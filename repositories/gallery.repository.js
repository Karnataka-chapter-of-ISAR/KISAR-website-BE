import Gallery from '../models/Gallery.js';

export function createGalleryItem(data) {
  return Gallery.create(data);
}

export function findAllGalleryItems() {
  return Gallery.find().sort({ createdAt: -1 }).lean();
}

export function findGalleryItemById(galleryId) {
  return Gallery.findById(galleryId).lean();
}

export function updateGalleryItem(galleryId, data) {
  return Gallery.findByIdAndUpdate(galleryId, data, { new: true, runValidators: true }).lean();
}

export function deleteGalleryItem(galleryId) {
  return Gallery.findByIdAndDelete(galleryId).lean();
}
