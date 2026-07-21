import News from '../models/News.js';

export function createNews(data) {
  return News.create(data);
}

export function findAllNews() {
  return News.find().sort({ date: -1 }).lean();
}

export function findNewsById(newsId) {
  return News.findById(newsId).lean();
}

export function updateNews(newsId, data) {
  return News.findByIdAndUpdate(newsId, data, { new: true, runValidators: true }).lean();
}

export function deleteNews(newsId) {
  return News.findByIdAndDelete(newsId).lean();
}

// Clears the featured flag on every article except (optionally) one being promoted,
// so at most one article is ever featured at a time.
export function unsetFeaturedExcept(newsId) {
  const filter = newsId ? { _id: { $ne: newsId } } : {};
  return News.updateMany({ ...filter, isFeatured: true }, { isFeatured: false });
}
