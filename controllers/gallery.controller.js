import { validateCreateGalleryRequest } from '../dto/gallery/createGallery.request.dto.js';
import { toGalleryResponseDto } from '../dto/gallery/gallery.response.dto.js';
import { createGalleryItem, listGalleryItems, updateGalleryItem, deleteGalleryItem } from '../services/gallery.service.js';
import { findCategoriesBySection } from '../repositories/category.repository.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { MESSAGES } from '../constants/messages.js';

export async function getAdminGalleryController(req, res) {
  const items = await listGalleryItems();

  return sendSuccess(res, {
    message: MESSAGES.GALLERY.FETCH_SUCCESS,
    data: { gallery: items.map(toGalleryResponseDto) },
  });
}

export async function createGalleryController(req, res) {
  const validCategories = await findCategoriesBySection('gallery');
  const validCategorySlugs = new Set(validCategories.map(item => item.slug));
  const { valid, errors, data } = validateCreateGalleryRequest(req.body, validCategorySlugs);
  if (!valid) {
    return sendError(res, {
      message: MESSAGES.GALLERY.VALIDATION_ERROR,
      statusCode: 422,
      data: { errors },
    });
  }

  if (!req.file) {
    return sendError(res, {
      message: MESSAGES.GALLERY.VALIDATION_ERROR,
      statusCode: 422,
      data: { errors: [MESSAGES.GALLERY.IMAGE_REQUIRED] },
    });
  }

  const image = `/uploads/gallery/${req.file.filename}`;
  const item = await createGalleryItem({ data, image, createdBy: req.admin?.email ?? null });

  return sendSuccess(res, {
    message: MESSAGES.GALLERY.CREATE_SUCCESS,
    statusCode: 201,
    data: { gallery: toGalleryResponseDto(item) },
  });
}

export async function updateGalleryController(req, res) {
  const validCategories = await findCategoriesBySection('gallery');
  const validCategorySlugs = new Set(validCategories.map(item => item.slug));
  const { valid, errors, data } = validateCreateGalleryRequest(req.body, validCategorySlugs);
  if (!valid) {
    return sendError(res, {
      message: MESSAGES.GALLERY.VALIDATION_ERROR,
      statusCode: 422,
      data: { errors },
    });
  }

  const image = req.file ? `/uploads/gallery/${req.file.filename}` : null;

  try {
    const item = await updateGalleryItem({ galleryId: req.params.id, data, image });
    return sendSuccess(res, {
      message: MESSAGES.GALLERY.UPDATE_SUCCESS,
      data: { gallery: toGalleryResponseDto(item) },
    });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, { message: err.message, statusCode: err.statusCode, data: err.data });
    }
    throw err;
  }
}

export async function deleteGalleryController(req, res) {
  try {
    await deleteGalleryItem(req.params.id);
    return sendSuccess(res, { message: MESSAGES.GALLERY.DELETE_SUCCESS });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, { message: err.message, statusCode: err.statusCode, data: err.data });
    }
    throw err;
  }
}
