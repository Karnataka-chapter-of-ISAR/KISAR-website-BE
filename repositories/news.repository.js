import News from '../models/News.js';

export async function createNews(data, session) {
  const [news] = await News.create([data], { session });
  return news;
}

export function findAllNews() {
  return News.find().sort({ date: -1 }).lean();
}

export function findNewsById(newsId) {
  return News.findById(newsId).lean();
}

export function updateNews(newsId, data, session) {
  return News.findByIdAndUpdate(newsId, data, { new: true, runValidators: true, session }).lean();
}

export function deleteNews(newsId) {
  return News.findByIdAndDelete(newsId).lean();
}

// Clears the featured flag on every article except (optionally) one being promoted,
// so at most one article is ever featured at a time.
export function unsetFeaturedExcept(newsId, session) {
  const filter = newsId ? { _id: { $ne: newsId } } : {};
  return News.updateMany({ ...filter, isFeatured: true }, { isFeatured: false }, { session });
}
