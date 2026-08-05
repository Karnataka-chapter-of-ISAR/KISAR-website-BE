import { GALLERY_CATEGORIES, GALLERY_SIZES } from '../../constants/gallery.js';

// Validates and normalises a raw request body into the shape the Gallery service expects.
// Returns { valid: false, errors: string[] } on failure, or { valid: true, data: {...} } on success.
export function validateCreateGalleryRequest(body = {}) {
  const errors = [];
  const { title, subtitle, category, size } = body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    errors.push('Title is required.');
  }

  if (!category || !GALLERY_CATEGORIES.includes(category)) {
    errors.push(`Category is required and must be one of: ${GALLERY_CATEGORIES.join(', ')}.`);
  }

  if (size != null && !GALLERY_SIZES.includes(size)) {
    errors.push(`Size must be one of: ${GALLERY_SIZES.join(', ')}.`);
  }

  if (errors.length > 0) return { valid: false, errors };

  return {
    valid: true,
    data: {
      title: title.trim(),
      subtitle: subtitle && typeof subtitle === 'string' && subtitle.trim() ? subtitle.trim() : null,
      category,
      size: size ?? 'normal',
    },
  };
}
