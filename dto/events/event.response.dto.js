export function toEventResponseDto(event) {
  const obj = typeof event.toObject === 'function' ? event.toObject() : event;
  // `registeredMembers` / `capacity` are legacy fields on old documents: the
  // former holds member ids (never exposed), the latter is no longer a concept.
  const { _id, __v, registeredMembers, capacity, ...rest } = obj;
  return {
    id: _id,
    registeredCount: rest.registeredCount ?? 0,
    isHighlighted: Boolean(rest.isHighlighted),
    ...rest,
    images: rest.images ?? [],
    accessType: rest.accessType ?? 'members_only',
    pricing: {
      isPaid: Boolean(rest.pricing?.isPaid),
      memberPrice: rest.pricing?.memberPrice ?? null,
      nonMemberPrice: rest.pricing?.nonMemberPrice ?? null,
      currency: rest.pricing?.currency ?? 'INR',
    },
    registrationFields: rest.registrationFields ?? [],
  };
}
