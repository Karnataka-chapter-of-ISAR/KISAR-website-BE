import { toNewsResponseDto } from '../dto/news/news.response.dto.js';
import { listNews, getNewsById } from '../services/news.service.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { MESSAGES } from '../constants/messages.js';

export async function getNewsController(req, res) {
  const news = await listNews();

  return sendSuccess(res, {
    message: MESSAGES.NEWS.FETCH_SUCCESS,
    data: { news: news.map(toNewsResponseDto) },
  });
}

export async function getNewsByIdController(req, res) {
  try {
    const news = await getNewsById(req.params.id);
    return sendSuccess(res, {
      message: MESSAGES.NEWS.FETCH_SUCCESS,
      data: { news: toNewsResponseDto(news) },
    });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, { message: err.message, statusCode: err.statusCode, data: err.data });
    }
    throw err;
  }
}
