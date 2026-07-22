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

  const bannerImage = req.file ? `/uploads/news/${req.file.filename}` : null;
  const news = await createNews({ data, bannerImage, createdBy: req.admin?.email ?? null });

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

  const bannerImage = req.file ? `/uploads/news/${req.file.filename}` : null;

  try {
    const news = await updateNews({ newsId: req.params.id, data, bannerImage });
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
