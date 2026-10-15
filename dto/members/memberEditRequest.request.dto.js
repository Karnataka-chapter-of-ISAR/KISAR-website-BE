import { EMAIL_REGEX, PHONE_REGEX, MEMBER_EDIT_FIELDS } from '../../constants/members.js';
import { getFieldMode } from '../../utils/profileUtil.js';

// Validates a member's self-service profile edit submission. This is a
// partial update: only fields present in the body are checked/returned.
// Which tab a field belongs to (details/membership) and whether it needs
// approval or applies directly are derived downstream, not validated here.
export function validateMemberEditRequest(body = {}) {
  const errors = [];
  const submittedFields = Object.keys(body);

  const disallowed = submittedFields.filter(field => !MEMBER_EDIT_FIELDS.includes(field));
  if (disallowed.length > 0) {
    errors.push(`These fields cannot be edited: ${disallowed.join(', ')}.`);
  }

  // Defense in depth — profileUtil.js is the source of truth for this, even
  // though disabled fields (email) aren't in MEMBER_EDIT_FIELDS today.
  const disabled = submittedFields.filter(field => getFieldMode(field) === 'disabled');
  if (disabled.length > 0) {
    errors.push(`These fields cannot be edited: ${disabled.join(', ')}.`);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'name') && (!body.name || !body.name.toString().trim())) {
    errors.push('Name cannot be empty.');
  }

  if (Object.prototype.hasOwnProperty.call(body, 'phone') && body.phone && !PHONE_REGEX.test(body.phone.toString().trim())) {
    errors.push('Phone must be a valid 10-digit phone number.');
  }

  if (Object.prototype.hasOwnProperty.call(body, 'alternatePhone') && body.alternatePhone && !PHONE_REGEX.test(body.alternatePhone.toString().trim())) {
    errors.push('Alternate phone must be a valid 10-digit phone number.');
  }

  if (Object.prototype.hasOwnProperty.call(body, 'alternateEmail') && body.alternateEmail && !EMAIL_REGEX.test(body.alternateEmail.toString().trim())) {
    errors.push('Alternate email must be a valid email address.');
  }

  if (Object.prototype.hasOwnProperty.call(body, 'experience')) {
    if (body.experience !== null && typeof body.experience !== 'string') {
      errors.push('Experience must be text.');
    }
  }

  if (errors.length > 0) return { valid: false, errors };

  const changes = {};
  for (const field of MEMBER_EDIT_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) continue;
    const value = body[field];
    if (field === 'joined') {
      changes[field] = value !== undefined && value !== null && value !== '' ? Number(value) : null;
    } else if (typeof value === 'string') {
      changes[field] = value.trim() || null;
    } else {
      changes[field] = value ?? null;
    }
  }

  if (Object.keys(changes).length === 0) {
    return { valid: false, errors: ['No fields to update.'] };
  }

  return { valid: true, changes };
}
