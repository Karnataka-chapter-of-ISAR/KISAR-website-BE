export function toRegistrationResponseDto(registration) {
  return {
    id:         registration._id,
    eventId:    registration.eventId,
    eventTitle: registration.eventTitle,
    status:     registration.status,
    amount:     registration.amount,
    currency:   registration.currency,
    isMember:   registration.isMember,
    name:       registration.name,
    email:      registration.email,
    phone:      registration.phone,
  };
}
