import { toChargesDto } from '../../utils/gst.js';

// Admin-only URL that serves the invoice PDF; null when no invoice was issued.
export const toInvoiceLink = (registration, baseUrl) => (registration.invoice?.number
  ? `${baseUrl}/api/v1/admin/registrations/${registration._id}/invoice`
  : null);

export function toEventAttendeeResponseDto(registration, baseUrl) {
  return {
    id:           registration._id,
    name:         registration.name,
    email:        registration.email,
    phone:        registration.phone,
    isMember:     registration.isMember,
    kisarId:      registration.kisarId ?? null,
    isarMemberId: registration.isarMemberId ?? null,
    answers:      registration.answers ?? [],
    amount:       registration.amount,
    baseAmount:   registration.baseAmount ?? null,
    cgst:         registration.cgst ?? null,
    sgst:         registration.sgst ?? null,
    totalAmount:  registration.amount,
    charges:      toChargesDto(registration),
    invoiceNumber: registration.invoice?.number ?? null,
    invoiceLink:  toInvoiceLink(registration, baseUrl),
    currency:     registration.currency,
    status:       registration.status,
    paidAt:       registration.payment?.paidAt ?? null,
    refund:       registration.refund?.status ? registration.refund : null,
    duplicatePayments: registration.duplicatePayments ?? [],
    registeredAt: registration.createdAt,
  };
}
