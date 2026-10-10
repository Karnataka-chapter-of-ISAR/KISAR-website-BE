import mongoose from 'mongoose';
import * as eventRepository from '../repositories/event.repository.js';
import * as memberRepository from '../repositories/member.repository.js';
import * as registrationRepository from '../repositories/registration.repository.js';
import * as counterRepository from '../repositories/counter.repository.js';
import { validateRegistrationAnswers, normalisePhone } from '../dto/events/registerForEvent.request.dto.js';
import { sendRegistrationConfirmationEmail } from './notifications.service.js';
import { initiateRefund, handleRefundWebhook } from './refund.service.js';
import { readRegistrationToken } from '../utils/registrationToken.js';
import * as cashfree from '../utils/cashfree.js';
import { startOfToday } from '../utils/date.js';
import { calculateGst, toChargesDto, roundMoney, financialYear, formatInvoiceNumber } from '../utils/gst.js';
import { AppError } from '../utils/AppError.js';
import logger from '../utils/logger.js';
import { MESSAGES } from '../constants/messages.js';
import { EVENT_CURRENCY, REGISTRATION_STATUS } from '../constants/events.js';

const { CONFIRMED, PENDING_PAYMENT } = REGISTRATION_STATUS;

const PAYMENT_ORDER_TTL_MS = 30 * 60 * 1000;
const DUPLICATE_KEY_ERROR = 11000;
// Order ids look like KISAR-<registrationId>-<attempt>; the registration id lets
// a webhook be traced back even for an order that is no longer the current one.
const ORDER_ID_PATTERN = /^KISAR-([a-f0-9]{24})-\d+$/;

export async function getRegistrableEvent(eventId) {
  if (!mongoose.Types.ObjectId.isValid(eventId)) throw new AppError(MESSAGES.EVENTS.NOT_FOUND, 404);

  const event = await eventRepository.findEventById(eventId);
  if (!event) throw new AppError(MESSAGES.EVENTS.NOT_FOUND, 404);
  if (new Date(event.date) < startOfToday()) throw new AppError(MESSAGES.REGISTRATION.EVENT_CLOSED, 400);
  if (event.registrationsClosed) throw new AppError(MESSAGES.REGISTRATION.REGISTRATIONS_CLOSED, 400);

  return event;
}

// Events created before access types existed have no `accessType` (lean reads skip
// schema defaults) and keep their original behaviour: members only.
export const isMembersOnly = (event) => (event.accessType ?? 'members_only') === 'members_only';

// The event's price is the entry fee; 9% CGST + 9% SGST is charged on top of it.
function priceFor(event, isMember) {
  if (!event.pricing?.isPaid) return { baseAmount: 0, cgst: null, sgst: null, totalAmount: 0 };

  const entryFee = isMember ? event.pricing.memberPrice : event.pricing.nonMemberPrice;
  return calculateGst(entryFee);
}

// Who is registering is established by the session (logged-in member) or by a
// verified-email token — never by the email typed into the form, so the member
// price and prefill can't be claimed by typing someone else's address.
async function resolveVerifiedIdentity({ user, token, eventId, bodyEmail }) {
  if (user?.email) {
    const member = await memberRepository.findMemberByEmail(user.email.toLowerCase());
    if (member) return { email: member.email, member };
  }

  if (token) {
    const payload = readRegistrationToken(token);
    if (payload && payload.eventId === String(eventId) && (!bodyEmail || bodyEmail === payload.email)) {
      return { email: payload.email, member: await memberRepository.findMemberByEmail(payload.email) };
    }
  }

  throw new AppError(MESSAGES.REGISTRATION.EMAIL_NOT_VERIFIED, 401);
}

async function createRegistrationOnce(details) {
  try {
    return await registrationRepository.createRegistration(details);
  } catch (err) {
    if (err.code !== DUPLICATE_KEY_ERROR) throw err;
    return null;
  }
}

function toPaymentInfo(registration) {
  return {
    orderId: registration.payment.orderId,
    paymentSessionId: registration.payment.paymentSessionId,
    environment: cashfree.cashfreeEnvironment(),
  };
}

// Records a successful payment. Only the call that actually moves the
// registration pending -> confirmed gets a document back (and sends the email),
// so webhook retries and the status poll racing the webhook are harmless.
async function finalizePaidOrder({ registration, orderId, cfPaymentId, paidAmount }) {
  if (roundMoney(paidAmount) !== roundMoney(registration.amount)) {
    logger.error(`[registration] amount mismatch for order ${orderId}: paid ${paidAmount}, expected ${registration.amount}`);
    return null;
  }

  let confirmed = await registrationRepository.confirmPendingRegistration(registration._id, { orderId, cfPaymentId });
  if (!confirmed) return null;

  const event = await eventRepository.findEventById(confirmed.eventId);

  // The money arrived after an admin closed registration (or removed the event):
  // don't seat the person, hand the payment straight back.
  if (!event || event.registrationsClosed) {
    logger.warn(`[registration] payment for order ${orderId} arrived after registration closed - refunding`);
    await initiateRefund(confirmed, 'event_cancelled');
    return confirmed;
  }

  confirmed = await issueInvoiceNumber(confirmed);
  await sendRegistrationConfirmationEmail({ registration: confirmed, event });
  return confirmed;
}

// Only registrations charged with GST get an invoice (free ones, and paid ones
// from before GST was introduced, have no tax breakdown). Never throws: a
// numbering failure must not undo a confirmed payment.
async function issueInvoiceNumber(registration) {
  if (registration.amount <= 0 || registration.baseAmount == null) return registration;

  try {
    const fy = financialYear(registration.payment.paidAt ?? new Date());
    const seq = await counterRepository.reserveSequenceRange(`invoice-${fy}`, 1);
    const withInvoice = await registrationRepository.setInvoice(registration._id, { number: formatInvoiceNumber(fy, seq) });
    return withInvoice ?? registration;
  } catch (err) {
    logger.error(`[registration] could not assign invoice number for ${registration._id}: ${err.message}`);
    return registration;
  }
}

// Guarantees at most one live Cashfree order per registration: a retry reuses
// the active order's session, confirms an already-paid one, and only creates a
// new order once the previous one has expired or been terminated.
async function startPayment({ registration, event }) {
  const lastOrderId = registration.payment.orderId;

  if (lastOrderId) {
    const order = await cashfree.getOrder(lastOrderId);

    if (order.order_status === cashfree.ORDER_STATUS.PAID) {
      const confirmed = await finalizePaidOrder({
        registration,
        orderId: lastOrderId,
        cfPaymentId: await findSuccessfulPaymentId(lastOrderId),
        paidAmount: Number(order.order_amount),
      });
      return { registration: confirmed ?? (await registrationRepository.findRegistrationById(registration._id)), payment: null };
    }

    if (order.order_status === cashfree.ORDER_STATUS.ACTIVE) {
      if (Number(order.order_amount) === registration.amount && registration.payment.paymentSessionId) {
        return { registration, payment: toPaymentInfo(registration) };
      }
      await cashfree.terminateOrder(lastOrderId);
    }
  }

  const attempt = registration.payment.attempt + 1;
  const orderId = `KISAR-${registration._id}-${attempt}`;
  const returnBase = process.env.PAYMENT_RETURN_URL || `${process.env.PORTAL_URL || 'https://www.kisar.org.in'}/events/registration/return`;

  const order = await cashfree.createOrder({
    orderId,
    amount: registration.amount,
    currency: registration.currency || EVENT_CURRENCY,
    customer: {
      id: String(registration._id),
      name: registration.name,
      email: registration.email,
      phone: registration.phone,
    },
    returnUrl: `${returnBase}${returnBase.includes('?') ? '&' : '?'}order_id={order_id}`,
    notifyUrl: process.env.CASHFREE_WEBHOOK_URL,
    expiresAt: new Date(Date.now() + PAYMENT_ORDER_TTL_MS),
  });

  const updated = await registrationRepository.setPendingOrder(registration._id, {
    orderId,
    attempt,
    paymentSessionId: order.payment_session_id,
  });

  logger.info(`[registration] created order ${orderId} for event ${event._id} (${registration.amount} ${registration.currency})`);
  return { registration: updated, payment: toPaymentInfo(updated) };
}

function successfulPaymentId(payments) {
  const success = Array.isArray(payments) ? payments.find((p) => p.payment_status === 'SUCCESS') : null;
  return success ? String(success.cf_payment_id) : null;
}

async function findSuccessfulPaymentId(orderId) {
  try {
    return successfulPaymentId(await cashfree.getOrderPayments(orderId));
  } catch {
    return null;
  }
}

// What the gateway says about the user's payment attempts for a still-unpaid order,
// so the frontend can tell "still processing" from "declined / backed out / never tried".
// Cashfree keeps an order ACTIVE after a declined card or a back-button, so the
// order status alone can't distinguish those — the payment attempts can.
const PAYMENT_STATE_BY_CASHFREE_STATUS = {
  SUCCESS: 'success',
  PENDING: 'processing',
  FAILED: 'failed',
  USER_DROPPED: 'cancelled',
  CANCELLED: 'cancelled',
  VOID: 'cancelled',
  NOT_ATTEMPTED: 'not_attempted',
};

export function derivePaymentState(orderStatus, payments) {
  if (orderStatus === cashfree.ORDER_STATUS.EXPIRED || orderStatus === cashfree.ORDER_STATUS.TERMINATED) return 'expired';

  const attempts = Array.isArray(payments) ? payments : [];
  if (attempts.length === 0) return 'not_attempted';
  if (attempts.some((p) => p.payment_status === 'SUCCESS')) return 'success';
  if (attempts.some((p) => p.payment_status === 'PENDING')) return 'processing';

  const latest = [...attempts].sort((a, b) => new Date(b.payment_time ?? 0) - new Date(a.payment_time ?? 0))[0];
  return PAYMENT_STATE_BY_CASHFREE_STATUS[latest.payment_status] ?? 'processing';
}

export async function registerForEvent({ eventId, body, user }) {
  const event = await getRegistrableEvent(eventId);
  const { email, member } = await resolveVerifiedIdentity({
    user,
    token: body.emailVerificationToken,
    eventId,
    bodyEmail: body.email,
  });

  if (isMembersOnly(event) && !member) throw new AppError(MESSAGES.REGISTRATION.MEMBERS_ONLY, 403);

  const errors = [];
  const name = member ? member.name : body.name;
  if (!name) errors.push('Name is required.');

  // Members get their stored number as a fallback; the form value wins if they edited it.
  const phone = body.phone ?? (member ? normalisePhone(member.phone) : null);
  if (!phone) errors.push('Phone is required.');

  const answers = validateRegistrationAnswers(event.registrationFields ?? [], body.answers, errors);
  if (errors.length > 0) throw new AppError(MESSAGES.REGISTRATION.VALIDATION_ERROR, 422, { errors });

  const existing = await registrationRepository.findActiveRegistration({ eventId: event._id, email });
  if (existing?.status === CONFIRMED) throw new AppError(MESSAGES.EVENTS.ALREADY_REGISTERED, 409);

  const { baseAmount, cgst, sgst, totalAmount: amount } = priceFor(event, Boolean(member));
  const details = {
    memberId: member?._id ?? null,
    isMember: Boolean(member),
    name,
    email,
    phone,
    isarMemberId: member?.ISARMemberID ?? null,
    answers,
    amount,
    baseAmount: amount > 0 ? baseAmount : null,
    cgst,
    sgst,
    currency: EVENT_CURRENCY,
  };

  if (amount === 0) {
    const registration = await createRegistrationOnce({
      ...details,
      eventId: event._id,
      eventTitle: event.title,
      eventDate: event.date,
      status: CONFIRMED,
    });
    if (!registration) throw new AppError(MESSAGES.EVENTS.ALREADY_REGISTERED, 409);

    await sendRegistrationConfirmationEmail({ registration, event });
    return { registration, payment: null };
  }

  let pending;
  if (existing) {
    pending = await registrationRepository.updatePendingRegistration(existing._id, details);
  } else {
    pending = await createRegistrationOnce({
      ...details,
      eventId: event._id,
      eventTitle: event.title,
      eventDate: event.date,
      status: REGISTRATION_STATUS.PENDING_PAYMENT,
    });
    // Lost a race with a concurrent submit for the same email — pick up that row.
    pending ??= await registrationRepository.findActiveRegistration({ eventId: event._id, email });
  }
  if (!pending) throw new AppError(MESSAGES.EVENTS.ALREADY_REGISTERED, 409);
  if (pending.status === CONFIRMED) throw new AppError(MESSAGES.EVENTS.ALREADY_REGISTERED, 409);

  return startPayment({ registration: pending, event });
}

// Public status check used after the gateway redirects back. If the webhook
// hasn't arrived yet, Cashfree is asked directly so the user isn't left waiting.
export async function getRegistrationStatus(orderId) {
  const registration = await registrationRepository.findRegistrationByOrderId(orderId);
  if (!registration) throw new AppError(MESSAGES.REGISTRATION.NOT_FOUND, 404);

  let paymentState = null;
  if (registration.status === PENDING_PAYMENT) {
    const [order, payments] = await Promise.all([
      cashfree.getOrder(orderId),
      cashfree.getOrderPayments(orderId).catch(() => []),
    ]);

    if (order.order_status === cashfree.ORDER_STATUS.PAID) {
      await finalizePaidOrder({
        registration,
        orderId,
        cfPaymentId: successfulPaymentId(payments),
        paidAmount: Number(order.order_amount),
      });
    } else {
      paymentState = derivePaymentState(order.order_status, payments);
    }
  }

  const fresh = await registrationRepository.findRegistrationById(registration._id);
  if (fresh.status === CONFIRMED) paymentState = 'success';

  return {
    status: fresh.status,
    paymentState,
    eventId: fresh.eventId,
    eventTitle: fresh.eventTitle,
    amount: fresh.amount,
    totalAmount: fresh.amount,
    charges: toChargesDto(fresh),
    invoiceNumber: fresh.invoice?.number ?? null,
  };
}

async function handlePaymentSuccess({ orderId, cfPaymentId, paidAmount }) {
  const match = ORDER_ID_PATTERN.exec(orderId);
  const registration = match ? await registrationRepository.findRegistrationById(match[1]) : null;
  if (!registration) {
    logger.warn(`[webhook] payment for unknown order ${orderId}`);
    return;
  }

  if (registration.status !== PENDING_PAYMENT) {
    // The same order again is just a webhook retry. Anything else is money that
    // arrived for a registration that cannot take it (paid twice, or the event was
    // cancelled meanwhile) - flagged for an admin to refund.
    if (!(registration.status === CONFIRMED && registration.payment.orderId === orderId)) {
      logger.error(`[webhook] UNMATCHED PAYMENT: order ${orderId} paid for registration ${registration._id} (status ${registration.status})`);
      await registrationRepository.addDuplicatePayment(registration._id, { orderId, cfPaymentId, amount: paidAmount });
    }
    return;
  }

  await finalizePaidOrder({ registration, orderId, cfPaymentId, paidAmount });
}

export async function handleCashfreeWebhook({ rawBody, signature, timestamp }) {
  if (!cashfree.verifyWebhookSignature({ rawBody, signature, timestamp })) {
    throw new AppError(MESSAGES.PAYMENTS.INVALID_SIGNATURE, 401);
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    throw new AppError(MESSAGES.PAYMENTS.INVALID_SIGNATURE, 400);
  }

  if (payload.type === 'PAYMENT_SUCCESS_WEBHOOK') {
    const { order, payment } = payload.data;
    await handlePaymentSuccess({
      orderId: order.order_id,
      cfPaymentId: payment?.cf_payment_id != null ? String(payment.cf_payment_id) : null,
      paidAmount: Number(payment?.payment_amount ?? order.order_amount),
    });
  } else if (payload.type === 'REFUND_STATUS_WEBHOOK') {
    await handleRefundWebhook(payload.data);
  }
}
