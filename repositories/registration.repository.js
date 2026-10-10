import Registration from '../models/Registration.js';
import { REGISTRATION_STATUS, REFUND_STATUS } from '../constants/events.js';

const { CONFIRMED, PENDING_PAYMENT, REFUND_PENDING, REFUNDED, EVENT_CANCELLED } = REGISTRATION_STATUS;

export function createRegistration(data) {
  return Registration.create(data);
}

export function findActiveRegistration({ eventId, email }) {
  return Registration.findOne({ eventId, email, isActive: true });
}

export function findRegistrationById(registrationId) {
  return Registration.findById(registrationId);
}

export function findRegistrationByOrderId(orderId) {
  return Registration.findOne({ 'payment.orderId': orderId });
}

// Refreshes the submitted details of a still-pending registration (the user came
// back and re-submitted the form). A confirmed row is never touched.
export function updatePendingRegistration(registrationId, data) {
  return Registration.findOneAndUpdate(
    { _id: registrationId, status: PENDING_PAYMENT },
    { $set: data },
    { new: true },
  );
}

export function setPendingOrder(registrationId, { orderId, attempt, paymentSessionId }) {
  return Registration.findOneAndUpdate(
    { _id: registrationId, status: PENDING_PAYMENT },
    { $set: { 'payment.orderId': orderId, 'payment.attempt': attempt, 'payment.paymentSessionId': paymentSessionId } },
    { new: true },
  );
}

// Atomic pending -> confirmed. Resolves with the updated document only for the
// call that actually performed the transition, so callers can safely trigger
// one-off side effects (the confirmation email) on a non-null result and treat
// repeated webhook deliveries as no-ops.
export function confirmPendingRegistration(registrationId, { orderId, cfPaymentId }) {
  return Registration.findOneAndUpdate(
    { _id: registrationId, status: PENDING_PAYMENT },
    {
      $set: {
        status: CONFIRMED,
        'payment.orderId': orderId,
        'payment.cfPaymentId': cfPaymentId ?? null,
        'payment.paidAt': new Date(),
      },
    },
    { new: true },
  );
}

// Assigns the invoice number once; resolves null if one is already set.
export function setInvoice(registrationId, { number }) {
  return Registration.findOneAndUpdate(
    { _id: registrationId, 'invoice.number': null },
    { $set: { 'invoice.number': number, 'invoice.issuedAt': new Date() } },
    { new: true },
  );
}

export function addDuplicatePayment(registrationId, entry) {
  return Registration.findByIdAndUpdate(
    registrationId,
    { $push: { duplicatePayments: { ...entry, receivedAt: new Date() } } },
    { new: true },
  );
}

export async function countConfirmedByEventIds(eventIds) {
  if (eventIds.length === 0) return new Map();
  const rows = await Registration.aggregate([
    { $match: { eventId: { $in: eventIds }, status: CONFIRMED, isActive: true } },
    { $group: { _id: '$eventId', count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((row) => [String(row._id), row.count]));
}

const attendeeFilter = ({ eventId, status }) => ({ eventId, status: status ?? CONFIRMED });

export function countForEvent({ eventId, status }) {
  return Registration.countDocuments(attendeeFilter({ eventId, status }));
}

export function findForEventPaginated({ eventId, status, skip, limit }) {
  return Registration.find(attendeeFilter({ eventId, status }))
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
}

// Event ids (as strings) the given email is confirmed for — drives the
// `registered` flag on event listings.
export async function findRegisteredEventIds({ email, eventIds }) {
  if (eventIds.length === 0) return new Set();
  const rows = await Registration.find(
    { email, eventId: { $in: eventIds }, status: CONFIRMED, isActive: true },
    { eventId: 1 },
  ).lean();
  return new Set(rows.map((row) => String(row.eventId)));
}

// Paid registrations that still need a refund started (or restarted after a failure).
export function findRefundableForEvent(eventId) {
  return Registration.find({
    eventId,
    isActive: true,
    amount: { $gt: 0 },
    $or: [{ status: CONFIRMED }, { status: REFUND_PENDING, 'refund.status': REFUND_STATUS.FAILED }],
  });
}

export function findPendingPaymentForEvent(eventId) {
  return Registration.find({ eventId, status: PENDING_PAYMENT });
}

export function findRefundRowsForEvent(eventId) {
  return Registration.find({ eventId, status: { $in: [REFUND_PENDING, REFUNDED] } }).lean();
}

export function countPaidConfirmedForEvent(eventId) {
  return Registration.countDocuments({ eventId, status: CONFIRMED, isActive: true, amount: { $gt: 0 } });
}

// Atomically moves a registration into (or back into) refund_pending. Resolves
// null when it isn't eligible, so concurrent/double clicks can't double-refund.
export function startRefund(registrationId, { refundId, attempt, amount, reason }) {
  return Registration.findOneAndUpdate(
    {
      _id: registrationId,
      isActive: true,
      amount: { $gt: 0 },
      $or: [{ status: CONFIRMED }, { status: REFUND_PENDING, 'refund.status': REFUND_STATUS.FAILED }],
    },
    {
      $set: {
        status: REFUND_PENDING,
        refund: { refundId, attempt, status: REFUND_STATUS.PENDING, amount, reason, initiatedAt: new Date(), processedAt: null, failureReason: null },
      },
    },
    { new: true },
  );
}

export function markRefundFailed(registrationId, failureReason) {
  return Registration.findOneAndUpdate(
    { _id: registrationId, status: REFUND_PENDING },
    { $set: { 'refund.status': REFUND_STATUS.FAILED, 'refund.failureReason': failureReason } },
    { new: true },
  );
}

export function markRefundFailedByRefundId(refundId, failureReason) {
  return Registration.findOneAndUpdate(
    { 'refund.refundId': refundId, status: REFUND_PENDING, 'refund.status': REFUND_STATUS.PENDING },
    { $set: { 'refund.status': REFUND_STATUS.FAILED, 'refund.failureReason': failureReason } },
    { new: true },
  );
}

// Resolves with the document only for the call that performed the transition.
export function markRefunded(refundId) {
  return Registration.findOneAndUpdate(
    { 'refund.refundId': refundId, status: REFUND_PENDING },
    { $set: { status: REFUNDED, isActive: false, 'refund.status': REFUND_STATUS.SUCCESS, 'refund.processedAt': new Date() } },
    { new: true },
  );
}

// Registrations whose event is being deleted and that carry no money to return.
export function findOpenForEvent(eventId) {
  return Registration.find({ eventId, status: { $in: [CONFIRMED, PENDING_PAYMENT] } });
}

export function markEventCancelled(registrationIds) {
  return Registration.updateMany(
    { _id: { $in: registrationIds }, status: { $in: [CONFIRMED, PENDING_PAYMENT] } },
    { $set: { status: EVENT_CANCELLED, isActive: false } },
  );
}
