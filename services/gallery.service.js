import mongoose from 'mongoose';
import * as galleryRepository from '../repositories/gallery.repository.js';
import { deleteGalleryImage } from '../utils/storage.js';
import { AppError } from '../utils/AppError.js';
import { MESSAGES } from '../constants/messages.js';

export async function createGalleryItem({ data, image, createdBy }) {
  return galleryRepository.createGalleryItem({ ...data, image, createdBy });
}

export async function listGalleryItems() {
  return galleryRepository.findAllGalleryItems();
}

export async function updateGalleryItem({ galleryId, data, image }) {
  if (!mongoose.Types.ObjectId.isValid(galleryId)) throw new AppError(MESSAGES.GALLERY.NOT_FOUND, 404);

  const updatePayload = { ...data };
  if (image) updatePayload.image = image;

  const previousItem = image ? await galleryRepository.findGalleryItemById(galleryId) : null;

  const item = await galleryRepository.updateGalleryItem(galleryId, updatePayload);
  if (!item) throw new AppError(MESSAGES.GALLERY.NOT_FOUND, 404);

  if (previousItem?.image) await deleteGalleryImage(previousItem.image);

  return item;
}

export async function deleteGalleryItem(galleryId) {
  if (!mongoose.Types.ObjectId.isValid(galleryId)) throw new AppError(MESSAGES.GALLERY.NOT_FOUND, 404);

  const item = await galleryRepository.deleteGalleryItem(galleryId);
  if (!item) throw new AppError(MESSAGES.GALLERY.NOT_FOUND, 404);

  if (item.image) await deleteGalleryImage(item.image);

  return item;
}
