import { EMAIL_REGEX, PHONE_REGEX, ADMIN_EDITABLE_MEMBER_FIELDS } from '../../constants/members.js';

const NUMERIC_FIELDS = ['joined', 'colorIndex'];

// Validates an admin's field-wise edit from the members grid (AG-Grid sends
// one or a few changed cells per request, not the full row). Unlike
// createMember's validator, only fields present in the body are checked/returned.
export function validatePatchMemberRequest(body = {}) {
  const errors = [];
  const submittedFields = Object.keys(body);

  const disallowed = submittedFields.filter(field => !ADMIN_EDITABLE_MEMBER_FIELDS.includes(field));
  if (disallowed.length > 0) {
    errors.push(`These fields cannot be edited: ${disallowed.join(', ')}.`);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'name') && (!body.name || typeof body.name !== 'string' || !body.name.trim())) {
    errors.push('Name cannot be empty.');
  }

  if (Object.prototype.hasOwnProperty.call(body, 'ISARMemberID') && (!body.ISARMemberID || typeof body.ISARMemberID !== 'string' || !body.ISARMemberID.trim())) {
    errors.push('ISAR member ID cannot be empty.');
  }

  if (Object.prototype.hasOwnProperty.call(body, 'email') && (!body.email || typeof body.email !== 'string' || !EMAIL_REGEX.test(body.email.trim()))) {
    errors.push('A valid email is required.');
  }

  if (Object.prototype.hasOwnProperty.call(body, 'alternateEmail') && body.alternateEmail && !EMAIL_REGEX.test(body.alternateEmail.toString().trim())) {
    errors.push('Alternate email must be a valid email address.');
  }

  if (Object.prototype.hasOwnProperty.call(body, 'phone') && body.phone && !PHONE_REGEX.test(body.phone.toString().trim())) {
    errors.push('Phone must be a valid 10-digit phone number.');
  }

  if (Object.prototype.hasOwnProperty.call(body, 'alternatePhone') && body.alternatePhone && !PHONE_REGEX.test(body.alternatePhone.toString().trim())) {
    errors.push('Alternate phone must be a valid 10-digit phone number.');
  }

  if (errors.length > 0) return { valid: false, errors };

  const data = {};
  for (const field of ADMIN_EDITABLE_MEMBER_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) continue;
    const value = body[field];
    if (NUMERIC_FIELDS.includes(field)) {
      data[field] = value !== undefined && value !== null && value !== '' ? Number(value) : null;
    } else if (field === 'email') {
      data[field] = value.trim().toLowerCase();
    } else if (typeof value === 'string') {
      data[field] = value.trim() || null;
    } else {
      data[field] = value ?? null;
    }
  }

  if (Object.keys(data).length === 0) {
    return { valid: false, errors: ['No fields to update.'] };
  }

  return { valid: true, data };
}
