import { NEWS_CATEGORIES } from '../../constants/news.js';

// Validates and normalises a raw request body into the shape the News service expects.
// Returns { valid: false, errors: string[] } on failure, or { valid: true, data: {...} } on success.
export function validateCreateNewsRequest(body = {}) {
  const errors = [];
  const { title, category, excerpt, content, author, date, isFeatured } = body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    errors.push('Title is required.');
  }

  if (!category || !NEWS_CATEGORIES.includes(category)) {
    errors.push(`Category is required and must be one of: ${NEWS_CATEGORIES.join(', ')}.`);
  }

  if (!excerpt || typeof excerpt !== 'string' || !excerpt.trim()) {
    errors.push('Excerpt is required.');
  }

  if (!content || typeof content !== 'string' || !content.trim()) {
    errors.push('Content is required.');
  }

  if (!author || typeof author !== 'string' || !author.trim()) {
    errors.push('Author is required.');
  }

  const parsedDate = date ? new Date(date) : null;
  if (!date || !parsedDate || Number.isNaN(parsedDate.getTime())) {
    errors.push('Date is required and must be a valid date.');
  }

  if (errors.length > 0) return { valid: false, errors };

  return {
    valid: true,
    data: {
      title: title.trim(),
      category,
      excerpt: excerpt.trim(),
      content: content.trim(),
      author: author.trim(),
      date: parsedDate,
      isFeatured: isFeatured === true || isFeatured === 'true',
    },
  };
}
