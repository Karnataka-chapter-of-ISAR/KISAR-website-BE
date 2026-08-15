import mongoose from 'mongoose';
import * as newsRepository from '../repositories/news.repository.js';
import { deleteNewsBannerImage, deleteNewsAttachment } from '../utils/storage.js';
import { AppError } from '../utils/AppError.js';
import { MESSAGES } from '../constants/messages.js';

export async function createNews({ data, bannerImage, attachmentTitle, attachmentUrl, attachmentCategory, createdBy }) {
  const news = await newsRepository.createNews({ ...data, bannerImage, attachmentTitle, attachmentUrl, attachmentCategory, createdBy });

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

export async function updateNews({ newsId, data, bannerImage, attachmentTitle, attachmentUrl, attachmentCategory, clearAttachment = false }) {
  if (!mongoose.Types.ObjectId.isValid(newsId)) throw new AppError(MESSAGES.NEWS.NOT_FOUND, 404);

  const updatePayload = { ...data };
  if (bannerImage) updatePayload.bannerImage = bannerImage;
  if (attachmentUrl) updatePayload.attachmentUrl = attachmentUrl;
  if (attachmentTitle !== undefined) updatePayload.attachmentTitle = attachmentTitle;
  if (attachmentCategory !== undefined) updatePayload.attachmentCategory = attachmentCategory || null;
  if (clearAttachment) {
    updatePayload.attachmentTitle = null;
    updatePayload.attachmentUrl = null;
    updatePayload.attachmentCategory = null;
  }

  const previousNews = (bannerImage || attachmentUrl || clearAttachment) ? await newsRepository.findNewsById(newsId) : null;

  const news = await newsRepository.updateNews(newsId, updatePayload);
  if (!news) throw new AppError(MESSAGES.NEWS.NOT_FOUND, 404);

  if (previousNews?.bannerImage && bannerImage) await deleteNewsBannerImage(previousNews.bannerImage);
  if (previousNews?.attachmentUrl && (attachmentUrl || clearAttachment)) await deleteNewsAttachment(previousNews.attachmentUrl);
  if (news.isFeatured) await newsRepository.unsetFeaturedExcept(news._id);

  return news;
}

export async function deleteNews(newsId) {
  if (!mongoose.Types.ObjectId.isValid(newsId)) throw new AppError(MESSAGES.NEWS.NOT_FOUND, 404);

  const news = await newsRepository.deleteNews(newsId);
  if (!news) throw new AppError(MESSAGES.NEWS.NOT_FOUND, 404);

  if (news.bannerImage) await deleteNewsBannerImage(news.bannerImage);
  if (news.attachmentUrl) await deleteNewsAttachment(news.attachmentUrl);

  return news;
}
