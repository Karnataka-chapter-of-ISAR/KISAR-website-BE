import { toChargesDto } from '../../utils/gst.js';

export function toRegistrationResponseDto(registration) {
  return {
    id:         registration._id,
    eventId:    registration.eventId,
    eventTitle: registration.eventTitle,
    status:     registration.status,
    amount:     registration.amount,
    baseAmount: registration.baseAmount ?? null,
    cgst:       registration.cgst ?? null,
    sgst:       registration.sgst ?? null,
    totalAmount: registration.amount,
    charges:    toChargesDto(registration),
    invoiceNumber: registration.invoice?.number ?? null,
    currency:   registration.currency,
    isMember:   registration.isMember,
    name:       registration.name,
    email:      registration.email,
    phone:      registration.phone,
  };
}
