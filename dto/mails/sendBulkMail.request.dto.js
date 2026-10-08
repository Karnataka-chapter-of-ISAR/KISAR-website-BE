import mongoose from 'mongoose';
import {
  BULK_MAIL_MAX_RECIPIENTS,
  BULK_MAIL_MAX_SUBJECT_LENGTH,
  BULK_MAIL_MAX_HTML_LENGTH,
} from '../../constants/mails.js';

// Validates and normalises a raw request body into the shape the bulk mail service expects.
// Returns { valid: false, errors: string[] } on failure, or { valid: true, data: {...} } on success.
export function validateSendBulkMailRequest(body = {}) {
  const errors = [];
  const { recipientIds, subject, html, text } = body;

  if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
    errors.push('At least one recipient is required.');
  } else if (recipientIds.length > BULK_MAIL_MAX_RECIPIENTS) {
    errors.push(`A maximum of ${BULK_MAIL_MAX_RECIPIENTS} recipients can be mailed at once.`);
  } else if (recipientIds.some(id => typeof id !== 'string' || !mongoose.isValidObjectId(id))) {
    errors.push('Every recipient id must be a valid member id.');
  }

  if (!subject || typeof subject !== 'string' || !subject.trim()) {
    errors.push('Subject is required.');
  } else if (subject.trim().length > BULK_MAIL_MAX_SUBJECT_LENGTH) {
    errors.push(`Subject must be at most ${BULK_MAIL_MAX_SUBJECT_LENGTH} characters.`);
  }

  if (!html || typeof html !== 'string' || !html.trim()) {
    errors.push('Email body (html) is required.');
  } else if (html.length > BULK_MAIL_MAX_HTML_LENGTH) {
    errors.push('Email body is too large.');
  }

  if (text !== undefined && text !== null && typeof text !== 'string') {
    errors.push('Plain-text body must be a string.');
  }

  if (errors.length > 0) return { valid: false, errors };

  return {
    valid: true,
    data: {
      recipientIds: [...new Set(recipientIds)],
      subject: subject.trim(),
      html,
      text: text && text.trim() ? text : null,
    },
  };
}
