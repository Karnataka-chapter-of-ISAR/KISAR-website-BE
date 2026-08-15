import { NEWS_CATEGORIES } from '../../constants/news.js';

// Validates and normalises a raw request body into the shape the News service expects.
// Returns { valid: false, errors: string[] } on failure, or { valid: true, data: {...} } on success.
export function validateCreateNewsRequest(body = {}) {
  const errors = [];
  const { title, category, excerpt, content, author, date, isFeatured, attachmentTitle, attachmentCategory } = body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    errors.push('Title is required.');
  }

  if (!category || typeof category !== 'string' || !category.trim()) {
    errors.push('Category is required.');
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

  if (attachmentTitle !== undefined && attachmentTitle !== null && (typeof attachmentTitle !== 'string' || !attachmentTitle.trim())) {
    errors.push('Attachment title must be a non-empty string when provided.');
  }

  if (attachmentCategory !== undefined && attachmentCategory !== null && (typeof attachmentCategory !== 'string' || !attachmentCategory.trim())) {
    errors.push('Attachment category must be a non-empty string when provided.');
  }

  if (errors.length > 0) return { valid: false, errors };

  return {
    valid: true,
    data: {
      title: title.trim(),
      category: category.trim(),
      excerpt: excerpt.trim(),
      content: content.trim(),
      author: author.trim(),
      date: parsedDate,
      isFeatured: isFeatured === true || isFeatured === 'true',
      attachmentTitle: attachmentTitle && typeof attachmentTitle === 'string' ? attachmentTitle.trim() : null,
      attachmentCategory: attachmentCategory && typeof attachmentCategory === 'string' ? attachmentCategory.trim() : null,
    },
  };
}
