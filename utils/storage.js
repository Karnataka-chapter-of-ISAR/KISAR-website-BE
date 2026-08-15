import fs from 'fs/promises';
import path from 'path';
import { UPLOADS_DIR } from '../middleware/uploadBannerImage.js';
import { NEWS_UPLOADS_DIR } from '../middleware/uploadNewsBannerImage.js';
import { GALLERY_UPLOADS_DIR } from '../middleware/uploadGalleryImage.js';
import logger from './logger.js';

// Single point of contact for removing a stored banner image. Today this is a local
// disk unlink; when banner storage moves to Cloudflare R2 (or similar), only this
// function's internals need to change — call sites stay the same.
export async function deleteBannerImage(bannerImagePath) {
  if (!bannerImagePath) return;

  const filePath = path.join(UPLOADS_DIR, path.basename(bannerImagePath));
  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      logger.error(`[deleteBannerImage] Failed to delete ${filePath}: ${err.message}`);
    }
  }
}

export async function deleteNewsBannerImage(bannerImagePath) {
  if (!bannerImagePath) return;

  const filePath = path.join(NEWS_UPLOADS_DIR, path.basename(bannerImagePath));
  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      logger.error(`[deleteNewsBannerImage] Failed to delete ${filePath}: ${err.message}`);
    }
  }
}

export async function deleteNewsAttachment(attachmentUrl) {
  if (!attachmentUrl) return;

  const filePath = path.join(NEWS_UPLOADS_DIR, path.basename(attachmentUrl));
  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      logger.error(`[deleteNewsAttachment] Failed to delete ${filePath}: ${err.message}`);
    }
  }
}

export async function deleteGalleryImage(imagePath) {
  if (!imagePath) return;

  const filePath = path.join(GALLERY_UPLOADS_DIR, path.basename(imagePath));
  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      logger.error(`[deleteGalleryImage] Failed to delete ${filePath}: ${err.message}`);
    }
  }
}
