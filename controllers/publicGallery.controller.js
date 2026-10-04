import { toGalleryResponseDto } from '../dto/gallery/gallery.response.dto.js';
import { listPublicGalleryItems } from '../services/gallery.service.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import { sendSuccess } from '../utils/response.js';
import { MESSAGES } from '../constants/messages.js';

export async function getGalleryController(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const { items, totalCount } = await listPublicGalleryItems({ skip, limit });

  return sendSuccess(res, {
    message: MESSAGES.GALLERY.FETCH_SUCCESS,
    data: {
      gallery: items.map(toGalleryResponseDto),
      pagination: buildPaginationMeta({ page, limit, totalCount }),
    },
  });
}
