import { EMAIL_REGEX } from '../../constants/members.js';
import {
  CONTACT_TOPICS,
  CONTACT_NAME_MAX,
  CONTACT_EMAIL_MAX,
  CONTACT_PHONE_MAX,
  CONTACT_MESSAGE_MAX,
} from '../../constants/contact.js';

const trimmed = (value) => (typeof value === 'string' ? value.trim() : '');

// Validates the public contact-form submission.
// Returns { valid: false, errors: string[] } on failure, or { valid: true, data: {...} } on success.
export function validateContactRequest(body = {}) {
  const errors = [];
  const { phone, topic, consent } = body;
  const firstName = trimmed(body.firstName);
  const lastName = trimmed(body.lastName);
  const email = trimmed(body.email);
  const message = trimmed(body.message);

  if (!firstName || firstName.length > CONTACT_NAME_MAX) {
    errors.push(`First name is required and must be ${CONTACT_NAME_MAX} characters or fewer.`);
  }
  if (!lastName || lastName.length > CONTACT_NAME_MAX) {
    errors.push(`Last name is required and must be ${CONTACT_NAME_MAX} characters or fewer.`);
  }
  if (!email || email.length > CONTACT_EMAIL_MAX || !EMAIL_REGEX.test(email)) {
    errors.push('A valid email address is required.');
  }

  const phoneValue = phone === undefined || phone === null ? '' : String(phone).trim();
  if (phoneValue && !new RegExp(`^[0-9]{1,${CONTACT_PHONE_MAX}}$`).test(phoneValue)) {
    errors.push(`Phone must contain digits only, up to ${CONTACT_PHONE_MAX}.`);
  }

  if (!CONTACT_TOPICS.includes(topic)) {
    errors.push(`Topic is required and must be one of: ${CONTACT_TOPICS.join(', ')}.`);
  }
  if (!message || message.length > CONTACT_MESSAGE_MAX) {
    errors.push(`Message is required and must be ${CONTACT_MESSAGE_MAX} characters or fewer.`);
  }
  if (consent !== true) {
    errors.push('Consent is required.');
  }

  if (errors.length > 0) return { valid: false, errors };

  return {
    valid: true,
    data: { firstName, lastName, email: email.toLowerCase(), phone: phoneValue || null, topic, message },
  };
}
