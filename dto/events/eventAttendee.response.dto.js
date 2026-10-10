import { toChargesDto } from '../../utils/gst.js';

export function toEventAttendeeResponseDto(registration) {
  return {
    id:           registration._id,
    name:         registration.name,
    email:        registration.email,
    phone:        registration.phone,
    isMember:     registration.isMember,
    isarMemberId: registration.isarMemberId ?? null,
    answers:      registration.answers ?? [],
    amount:       registration.amount,
    baseAmount:   registration.baseAmount ?? null,
    cgst:         registration.cgst ?? null,
    sgst:         registration.sgst ?? null,
    totalAmount:  registration.amount,
    charges:      toChargesDto(registration),
    invoiceNumber: registration.invoice?.number ?? null,
    currency:     registration.currency,
    status:       registration.status,
    paidAt:       registration.payment?.paidAt ?? null,
    refund:       registration.refund?.status ? registration.refund : null,
    duplicatePayments: registration.duplicatePayments ?? [],
    registeredAt: registration.createdAt,
  };
}
