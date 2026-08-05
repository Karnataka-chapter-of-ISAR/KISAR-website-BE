import { toGalleryResponseDto } from '../dto/gallery/gallery.response.dto.js';
import { listGalleryItems } from '../services/gallery.service.js';
import { sendSuccess } from '../utils/response.js';
import { MESSAGES } from '../constants/messages.js';

export async function getGalleryController(req, res) {
  const items = await listGalleryItems();

  return sendSuccess(res, {
    message: MESSAGES.GALLERY.FETCH_SUCCESS,
    data: { gallery: items.map(toGalleryResponseDto) },
  });
}
