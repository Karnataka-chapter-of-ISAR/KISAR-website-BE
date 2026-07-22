export function toNewsResponseDto(news) {
  const obj = typeof news.toObject === 'function' ? news.toObject() : news;
  const { _id, __v, ...rest } = obj;
  return { id: _id, ...rest };
}
