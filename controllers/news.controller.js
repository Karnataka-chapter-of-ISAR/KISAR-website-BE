import { validateCreateNewsRequest } from '../dto/news/createNews.request.dto.js';
import { toNewsResponseDto } from '../dto/news/news.response.dto.js';
import { createNews, listNews, updateNews, deleteNews } from '../services/news.service.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { MESSAGES } from '../constants/messages.js';

export async function getAdminNewsController(req, res) {
  const news = await listNews();

  return sendSuccess(res, {
    message: MESSAGES.NEWS.FETCH_SUCCESS,
    data: { news: news.map(toNewsResponseDto) },
  });
}

export async function createNewsController(req, res) {
  const { valid, errors, data } = validateCreateNewsRequest(req.body);
  if (!valid) {
    return sendError(res, {
      message: MESSAGES.NEWS.VALIDATION_ERROR,
      statusCode: 422,
      data: { errors },
    });
  }

  const bannerImage = req.files?.bannerImage?.[0] ? `/uploads/news/${req.files.bannerImage[0].filename}` : null;
  const attachmentFile = req.files?.attachment?.[0];
  const attachmentTitle = data.attachmentTitle || (attachmentFile ? attachmentFile.originalname.replace(/\.[^.]+$/, '') : null);
  const attachmentUrl = attachmentFile ? `/uploads/news/${attachmentFile.filename}` : null;
  const attachmentCategory = data.attachmentCategory || data.category;

  const news = await createNews({
    data,
    bannerImage,
    attachmentTitle,
    attachmentUrl,
    attachmentCategory,
    createdBy: req.admin?.email ?? null,
  });

  return sendSuccess(res, {
    message: MESSAGES.NEWS.CREATE_SUCCESS,
    statusCode: 201,
    data: { news: toNewsResponseDto(news) },
  });
}

export async function updateNewsController(req, res) {
  const { valid, errors, data } = validateCreateNewsRequest(req.body);
  if (!valid) {
    return sendError(res, {
      message: MESSAGES.NEWS.VALIDATION_ERROR,
      statusCode: 422,
      data: { errors },
    });
  }

  const bannerImage = req.files?.bannerImage?.[0] ? `/uploads/news/${req.files.bannerImage[0].filename}` : null;
  const attachmentFile = req.files?.attachment?.[0];
  const attachmentTitle = data.attachmentTitle || (attachmentFile ? attachmentFile.originalname.replace(/\.[^.]+$/, '') : undefined);
  const attachmentUrl = attachmentFile ? `/uploads/news/${attachmentFile.filename}` : undefined;
  const attachmentCategory = data.attachmentCategory || data.category;
  const clearAttachment = req.body.clearAttachment === 'true' || req.body.clearAttachment === true;

  try {
    const news = await updateNews({
      newsId: req.params.id,
      data,
      bannerImage,
      attachmentTitle,
      attachmentUrl,
      attachmentCategory,
      clearAttachment,
    });
    return sendSuccess(res, {
      message: MESSAGES.NEWS.UPDATE_SUCCESS,
      data: { news: toNewsResponseDto(news) },
    });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, { message: err.message, statusCode: err.statusCode, data: err.data });
    }
    throw err;
  }
}

export async function deleteNewsController(req, res) {
  try {
    await deleteNews(req.params.id);
    return sendSuccess(res, { message: MESSAGES.NEWS.DELETE_SUCCESS });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, { message: err.message, statusCode: err.statusCode, data: err.data });
    }
    throw err;
  }
}
