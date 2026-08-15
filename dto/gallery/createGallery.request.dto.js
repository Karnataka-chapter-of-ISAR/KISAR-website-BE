import { GALLERY_SIZES } from '../../constants/gallery.js';

// Validates and normalises a raw request body into the shape the Gallery service expects.
// Returns { valid: false, errors: string[] } on failure, or { valid: true, data: {...} } on success.
export function validateCreateGalleryRequest(body = {}, validCategorySlugs = new Set()) {
  const errors = [];
  const { title, subtitle, category, size } = body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    errors.push('Title is required.');
  }

  if (!category || typeof category !== 'string' || !category.trim()) {
    errors.push('Category is required.');
  } else if (validCategorySlugs.size > 0 && !validCategorySlugs.has(category.trim())) {
    errors.push('Selected category is not valid.');
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
      category: category.trim(),
      size: size ?? 'normal',
    },
  };
}
