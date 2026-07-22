export function toEventResponseDto(event) {
  const obj = typeof event.toObject === 'function' ? event.toObject() : event;
  const { _id, __v, registeredMembers, ...rest } = obj;
  return { id: _id, registeredCount: registeredMembers?.length ?? 0, ...rest };
}
