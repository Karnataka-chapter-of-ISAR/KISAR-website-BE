import { validateCreateNewsRequest } from '../dto/news/createNews.request.dto.js';
import { toNewsResponseDto } from '../dto/news/news.response.dto.js';
import { createNews, listNews, updateNews, deleteNews } from '../services/news.service.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { MESSAGES } from '../constants/messages.js';
import { uploadBufferToS3, generateObjectKey } from '../utils/s3.js';

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

  const bannerImageFile = req.files?.bannerImage?.[0];
  const attachmentFile = req.files?.attachment?.[0];

  const [bannerImage, attachmentUrl] = await Promise.all([
    bannerImageFile
      ? uploadBufferToS3({ buffer: bannerImageFile.buffer, mimetype: bannerImageFile.mimetype, key: generateObjectKey('news', bannerImageFile.originalname) })
      : null,
    attachmentFile
      ? uploadBufferToS3({ buffer: attachmentFile.buffer, mimetype: attachmentFile.mimetype, key: generateObjectKey('news', attachmentFile.originalname) })
      : null,
  ]);

  const attachmentTitle = data.attachmentTitle || (attachmentFile ? attachmentFile.originalname.replace(/\.[^.]+$/, '') : null);
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

  const bannerImageFile = req.files?.bannerImage?.[0];
  const attachmentFile = req.files?.attachment?.[0];

  const [bannerImage, attachmentUrl] = await Promise.all([
    bannerImageFile
      ? uploadBufferToS3({ buffer: bannerImageFile.buffer, mimetype: bannerImageFile.mimetype, key: generateObjectKey('news', bannerImageFile.originalname) })
      : null,
    attachmentFile
      ? uploadBufferToS3({ buffer: attachmentFile.buffer, mimetype: attachmentFile.mimetype, key: generateObjectKey('news', attachmentFile.originalname) })
      : undefined,
  ]);

  const attachmentTitle = data.attachmentTitle || (attachmentFile ? attachmentFile.originalname.replace(/\.[^.]+$/, '') : undefined);
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
