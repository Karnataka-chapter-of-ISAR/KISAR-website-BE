import { EMAIL_REGEX } from '../../constants/members.js';

// Returns { valid: false, errors: string[] } on failure, or { valid: true, data: { name, email } }.
export function validateCreateAdminRequest(body = {}) {
  const errors = [];
  const { name, email } = body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push('Name is required.');
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email is required.');
  }

  if (errors.length > 0) return { valid: false, errors };

  return { valid: true, data: { name: name.trim(), email: email.trim().toLowerCase() } };
}
