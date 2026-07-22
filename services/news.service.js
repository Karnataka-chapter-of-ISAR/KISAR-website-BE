import mongoose from 'mongoose';
import * as newsRepository from '../repositories/news.repository.js';
import { deleteNewsBannerImage } from '../utils/storage.js';
import { AppError } from '../utils/AppError.js';
import { MESSAGES } from '../constants/messages.js';

export async function createNews({ data, bannerImage, createdBy }) {
  const news = await newsRepository.createNews({ ...data, bannerImage, createdBy });

  // Only one article can be featured at a time — demote any previously featured article.
  if (news.isFeatured) await newsRepository.unsetFeaturedExcept(news._id);

  return news;
}

export async function listNews() {
  return newsRepository.findAllNews();
}

export async function getNewsById(newsId) {
  if (!mongoose.Types.ObjectId.isValid(newsId)) throw new AppError(MESSAGES.NEWS.NOT_FOUND, 404);

  const news = await newsRepository.findNewsById(newsId);
  if (!news) throw new AppError(MESSAGES.NEWS.NOT_FOUND, 404);

  return news;
}

export async function updateNews({ newsId, data, bannerImage }) {
  if (!mongoose.Types.ObjectId.isValid(newsId)) throw new AppError(MESSAGES.NEWS.NOT_FOUND, 404);

  const updatePayload = { ...data };
  if (bannerImage) updatePayload.bannerImage = bannerImage;

  const previousNews = bannerImage ? await newsRepository.findNewsById(newsId) : null;

  const news = await newsRepository.updateNews(newsId, updatePayload);
  if (!news) throw new AppError(MESSAGES.NEWS.NOT_FOUND, 404);

  if (previousNews?.bannerImage) await deleteNewsBannerImage(previousNews.bannerImage);
  if (news.isFeatured) await newsRepository.unsetFeaturedExcept(news._id);

  return news;
}

export async function deleteNews(newsId) {
  if (!mongoose.Types.ObjectId.isValid(newsId)) throw new AppError(MESSAGES.NEWS.NOT_FOUND, 404);

  const news = await newsRepository.deleteNews(newsId);
  if (!news) throw new AppError(MESSAGES.NEWS.NOT_FOUND, 404);

  if (news.bannerImage) await deleteNewsBannerImage(news.bannerImage);

  return news;
}
