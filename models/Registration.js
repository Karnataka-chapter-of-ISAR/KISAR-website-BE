import mongoose from 'mongoose';
import { EVENT_CURRENCY, REGISTRATION_STATUS, REFUND_STATUS } from '../constants/events.js';

const answerSchema = new mongoose.Schema(
  {
    key:   { type: String, required: true },
    label: { type: String, required: true },
    type:  { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { _id: false },
);

const registrationSchema = new mongoose.Schema(
  {
    eventId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    // Registrations are kept for audit after an event is deleted, so the
    // event's title/date are snapshotted here.
    eventTitle:   { type: String, required: true, trim: true },
    eventDate:    { type: Date, required: true },
    eventEndDate: { type: Date, default: null },

    memberId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Member', default: null },
    isMember:     { type: Boolean, required: true },
    name:         { type: String, required: true, trim: true },
    email:        { type: String, required: true, lowercase: true, trim: true },
    phone:        { type: String, required: true, trim: true },
    isarMemberId: { type: String, trim: true, default: null },
    answers:      { type: [answerSchema], default: [] },

    status:       { type: String, enum: Object.values(REGISTRATION_STATUS), required: true },
    // Only pending/confirmed registrations are active. Keeps "one registration
    // per email per event" enforceable with a partial unique index while still
    // letting a later state (e.g. refunded) free the email up.
    isActive:     { type: Boolean, default: true },

    // `amount` is what the person pays (entry fee + GST). The breakdown is null
    // for free registrations and for ones made before GST was introduced.
    amount:       { type: Number, required: true, min: 0, default: 0 },
    baseAmount:   { type: Number, min: 0, default: null },
    cgst:         { type: Number, min: 0, default: null },
    sgst:         { type: Number, min: 0, default: null },
    currency:     { type: String, default: EVENT_CURRENCY },
    invoice: {
      number:   { type: String, default: null },
      issuedAt: { type: Date, default: null },
    },
    payment: {
      orderId:          { type: String, default: null },
      attempt:          { type: Number, default: 0 },
      paymentSessionId: { type: String, default: null },
      cfPaymentId:      { type: String, default: null },
      paidAt:           { type: Date, default: null },
    },
    refund: {
      refundId:      { type: String, default: null },
      attempt:       { type: Number, default: 0 },
      status:        { type: String, enum: Object.values(REFUND_STATUS), default: null },
      amount:        { type: Number, default: null },
      reason:        { type: String, enum: ['event_cancelled', 'admin'], default: null },
      initiatedAt:   { type: Date, default: null },
      processedAt:   { type: Date, default: null },
      failureReason: { type: String, default: null },
    },
    // Payments received for an older order after this registration was already
    // confirmed — should not happen, surfaced for the admin to refund.
    duplicatePayments: {
      type: [{ orderId: String, cfPaymentId: String, amount: Number, receivedAt: Date }],
      default: [],
    },
  },
  { timestamps: true },
);

registrationSchema.index(
  { eventId: 1, email: 1 },
  { unique: true, partialFilterExpression: { isActive: true } },
);
// These fields default to null on every document, and a sparse index still indexes
// null — so a plain unique+sparse index would reject the second registration.
// Index only documents where the id is actually set.
registrationSchema.index({ 'payment.orderId': 1 }, { unique: true, partialFilterExpression: { 'payment.orderId': { $type: 'string' } } });
registrationSchema.index({ 'refund.refundId': 1 }, { unique: true, partialFilterExpression: { 'refund.refundId': { $type: 'string' } } });
registrationSchema.index({ 'invoice.number': 1 }, { unique: true, partialFilterExpression: { 'invoice.number': { $type: 'string' } } });

export default mongoose.model('Registration', registrationSchema);
