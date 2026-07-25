import { EMAIL_REGEX, PHONE_REGEX, MEMBER_PRIVACY_OPTIONS } from '../../constants/members.js';

const OPTIONAL_STRING_FIELDS = [
  'title', 'membershipCategory', 'alternateEmail', 'alternatePhone', 'designation',
  'specialization', 'institution', 'address', 'city', 'district', 'state',
  'pincode', 'country', 'zone', 'chapter', 'linkedin',
];

// Validates and normalises a raw request body into the shape the Member service expects.
// Returns { valid: false, errors: string[] } on failure, or { valid: true, data: {...} } on success.
export function validateCreateMemberRequest(body = {}) {
  const errors = [];
  const { name, email, membershipNo, phone, privacy, joined } = body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push('Name is required.');
  }

  if (!membershipNo || typeof membershipNo !== 'string' || !membershipNo.trim()) {
    errors.push('Membership number is required.');
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email is required.');
  }

  if (phone && !PHONE_REGEX.test(phone.toString().trim())) {
    errors.push('Phone must be a valid 10-digit Indian mobile number.');
  }

  if (privacy && !MEMBER_PRIVACY_OPTIONS.includes(privacy)) {
    errors.push(`Privacy must be one of: ${MEMBER_PRIVACY_OPTIONS.join(', ')}.`);
  }

  if (errors.length > 0) return { valid: false, errors };

  const data = {
    name: name.trim(),
    membershipNo: membershipNo.trim(),
    email: email.trim().toLowerCase(),
    phone: phone ? phone.toString().trim() : null,
    privacy: privacy || 'public',
    joined: joined !== undefined && joined !== null && joined !== '' ? Number(joined) : null,
  };

  for (const field of OPTIONAL_STRING_FIELDS) {
    const value = body[field];
    data[field] = value && typeof value === 'string' && value.trim() ? value.trim() : null;
  }

  return { valid: true, data };
}
