export function toGalleryResponseDto(item) {
  const obj = typeof item.toObject === 'function' ? item.toObject() : item;
  const { _id, __v, ...rest } = obj;
  return { id: _id, ...rest };
}
