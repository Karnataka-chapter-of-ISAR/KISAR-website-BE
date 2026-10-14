import { EMAIL_REGEX } from '../../constants/members.js';

// Returns { valid: false, errors: string[] } on failure, or { valid: true, data: { name, email, isSuperAdmin } }.
export function validateCreateAdminRequest(body = {}) {
  const errors = [];
  const { name, email, sa } = body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push('Name is required.');
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email is required.');
  }

  // "sa" marks the new admin as a super admin. Optional; defaults to false.
  if (sa !== undefined && typeof sa !== 'boolean') {
    errors.push('sa must be true or false.');
  }

  if (errors.length > 0) return { valid: false, errors };

  return { valid: true, data: { name: name.trim(), email: email.trim().toLowerCase(), isSuperAdmin: sa === true } };
}
