import mongoose from 'mongoose';
import * as eventRepository from '../repositories/event.repository.js';
import * as registrationRepository from '../repositories/registration.repository.js';
import { sendRefundInitiatedEmail, sendEventCancelledEmail } from './notifications.service.js';
import * as cashfree from '../utils/cashfree.js';
import { startOfToday, eventEndDate } from '../utils/date.js';
import { AppError } from '../utils/AppError.js';
import logger from '../utils/logger.js';
import { MESSAGES } from '../constants/messages.js';
import { REGISTRATION_STATUS, REFUND_STATUS } from '../constants/events.js';

const { CONFIRMED, REFUND_PENDING } = REGISTRATION_STATUS;

const EMAIL_BATCH_SIZE = 10;

const refundNote = (reason) => (reason === 'event_cancelled' ? 'Event cancelled' : 'Refund issued by KISAR');

// Starts a refund for one paid registration. The pending -> refund_pending move
// is atomic and happens *before* the gateway call, so a double click or a retry
// racing a bulk run can never create two refunds. Never throws on gateway
// failure: the failure is recorded on the registration for the admin to retry.
export async function initiateRefund(registration, reason) {
  const attempt = (registration.refund?.attempt ?? 0) + 1;
  const refundId = `refund_${registration._id}_${attempt}`;

  const started = await registrationRepository.startRefund(registration._id, {
    refundId,
    attempt,
    amount: registration.amount,
    reason,
  });
  if (!started) return { registration, started: false, failed: false };

  try {
    const result = await cashfree.createRefund({
      orderId: started.payment.orderId,
      refundId,
      amount: started.amount,
      note: refundNote(reason),
    });

    if (result.refund_status === 'SUCCESS') {
      const refunded = await registrationRepository.markRefunded(refundId);
      await sendRefundInitiatedEmail({ registration: refunded ?? started, reason });
      return { registration: refunded ?? started, started: true, failed: false };
    }
  } catch (err) {
    logger.error(`[refund] could not start refund ${refundId} for registration ${started._id}: ${err.message}`);
    const failed = await registrationRepository.markRefundFailed(started._id, MESSAGES.REFUNDS.GATEWAY_FAILED);
    return { registration: failed ?? started, started: true, failed: true };
  }

  await sendRefundInitiatedEmail({ registration: started, reason });
  return { registration: started, started: true, failed: false };
}

async function loadEvent(eventId) {
  if (!mongoose.Types.ObjectId.isValid(eventId)) throw new AppError(MESSAGES.EVENTS.NOT_FOUND, 404);
  const event = await eventRepository.findEventById(eventId);
  if (!event) throw new AppError(MESSAGES.EVENTS.NOT_FOUND, 404);
  return event;
}

// Applies a refund status reported by Cashfree (webhook, or a manual status sync).
async function applyRefundStatus({ refundId, status, description }) {
  if (status === 'SUCCESS') {
    await registrationRepository.markRefunded(refundId);
  } else if (status === 'CANCELLED') {
    await registrationRepository.markRefundFailedByRefundId(refundId, description || 'Refund was cancelled by the gateway.');
  }
}

export async function handleRefundWebhook({ refund }) {
  if (!refund?.refund_id) return;
  await applyRefundStatus({
    refundId: refund.refund_id,
    status: refund.refund_status,
    description: refund.status_description,
  });
}

// Progress of an event's refunds. With `sync`, still-pending refunds are checked
// against Cashfree first, in case a webhook never arrived.
export async function getEventRefundSummary({ eventId, sync = false }) {
  await loadEvent(eventId);

  if (sync) {
    const rows = await registrationRepository.findRefundRowsForEvent(eventId);
    for (const row of rows.filter((r) => r.status === REFUND_PENDING && r.refund.status === REFUND_STATUS.PENDING)) {
      try {
        const refund = await cashfree.getRefund(row.payment.orderId, row.refund.refundId);
        await applyRefundStatus({ refundId: row.refund.refundId, status: refund.refund_status, description: refund.status_description });
      } catch (err) {
        logger.error(`[refund] status sync failed for ${row.refund.refundId}: ${err.message}`);
      }
    }
  }

  const [rows, notStarted] = await Promise.all([
    registrationRepository.findRefundRowsForEvent(eventId),
    registrationRepository.countPaidConfirmedForEvent(eventId),
  ]);

  const failed = rows.filter((r) => r.status === REFUND_PENDING && r.refund.status === REFUND_STATUS.FAILED);
  return {
    notStarted,
    pending: rows.filter((r) => r.status === REFUND_PENDING && r.refund.status === REFUND_STATUS.PENDING).length,
    failed: failed.length,
    refunded: rows.filter((r) => r.status === REGISTRATION_STATUS.REFUNDED).length,
    failures: failed.map((r) => ({ registrationId: r._id, email: r.email, reason: r.refund.failureReason })),
    // Deleting the event is allowed only once nothing is waiting to be (or being) refunded.
    readyToDelete: notStarted === 0 && failed.length === 0 && rows.every((r) => r.status !== REFUND_PENDING),
  };
}

// Admin action: refund every paid registration of an upcoming event. Closes
// registration first and kills any unpaid checkout, so nobody can pay after the
// refunds have started. Safe to run again — it only retries what isn't refunded.
export async function initiateEventRefunds({ eventId }) {
  const event = await loadEvent(eventId);
  if (new Date(eventEndDate(event)) < startOfToday()) throw new AppError(MESSAGES.REFUNDS.PAST_EVENT, 409);

  await eventRepository.closeRegistrations(eventId);

  for (const pending of await registrationRepository.findPendingPaymentForEvent(eventId)) {
    if (!pending.payment.orderId) continue;
    try {
      await cashfree.terminateOrder(pending.payment.orderId);
    } catch (err) {
      logger.warn(`[refund] could not terminate order ${pending.payment.orderId}: ${err.message}`);
    }
  }

  // Sequential on purpose: keeps us well inside the gateway's rate limits.
  for (const registration of await registrationRepository.findRefundableForEvent(eventId)) {
    await initiateRefund(registration, 'event_cancelled');
  }

  return getEventRefundSummary({ eventId });
}

// Admin action: refund one registration (e.g. a duplicate payment). The person is
// unregistered as a result and would have to register again to attend.
export async function refundRegistration({ registrationId }) {
  if (!mongoose.Types.ObjectId.isValid(registrationId)) throw new AppError(MESSAGES.REGISTRATION.NOT_FOUND, 404);

  const registration = await registrationRepository.findRegistrationById(registrationId);
  if (!registration) throw new AppError(MESSAGES.REGISTRATION.NOT_FOUND, 404);

  const refundable = registration.amount > 0
    && (registration.status === CONFIRMED
      || (registration.status === REFUND_PENDING && registration.refund?.status === REFUND_STATUS.FAILED));
  if (!refundable) throw new AppError(MESSAGES.REFUNDS.NOT_REFUNDABLE, 409);

  const result = await initiateRefund(registration, 'admin');
  if (!result.started) throw new AppError(MESSAGES.REFUNDS.NOT_REFUNDABLE, 409);
  if (result.failed) throw new AppError(MESSAGES.REFUNDS.GATEWAY_FAILED, 502);

  return result.registration;
}

// Called right after an event is deleted. By then nothing is owed back, so what
// is left (free confirmed registrations and abandoned checkouts) is closed out
// and the free registrants are told the event is cancelled. Rows are kept for audit.
export async function cancelRemainingRegistrations(eventId) {
  const open = await registrationRepository.findOpenForEvent(eventId);
  if (open.length === 0) return;

  await registrationRepository.markEventCancelled(open.map((r) => r._id));

  for (const registration of open) {
    if (registration.payment?.orderId && registration.status !== CONFIRMED) {
      cashfree.terminateOrder(registration.payment.orderId).catch((err) => {
        logger.warn(`[refund] could not terminate order ${registration.payment.orderId}: ${err.message}`);
      });
    }
  }

  const toNotify = open.filter((r) => r.status === CONFIRMED);
  for (let i = 0; i < toNotify.length; i += EMAIL_BATCH_SIZE) {
    await Promise.all(toNotify.slice(i, i + EMAIL_BATCH_SIZE).map((registration) => sendEventCancelledEmail({ registration })));
  }
}
