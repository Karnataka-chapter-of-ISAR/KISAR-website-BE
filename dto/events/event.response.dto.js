export function toEventResponseDto(event) {
  const obj = typeof event.toObject === 'function' ? event.toObject() : event;
  const { _id, __v, ...rest } = obj;
  return { id: _id, ...rest };
}
