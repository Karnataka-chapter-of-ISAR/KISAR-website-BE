import {
  EMAIL_REGEX,
  PHONE_REGEX,
  REGISTRATION_TEXT_MAX,
  REGISTRATION_TEXTAREA_MAX,
} from '../../constants/events.js';

const NAME_MAX_LENGTH = 100;

// Strips spaces/dashes and the +91/91 prefix; returns the bare 10-digit number or null.
export function normalisePhone(value) {
  if (typeof value !== 'string') return null;
  const compact = value.replace(/[\s-]/g, '');
  if (!PHONE_REGEX.test(compact)) return null;
  return compact.slice(-10);
}

function parseAnswers(raw) {
  if (raw === undefined || raw === null || raw === '') return {};
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return raw;
}

// Shape-only validation of the register request. Identity-dependent rules
// (who needs to supply name/phone, member lookups) live in the service.
export function validateRegisterRequest(body = {}) {
  const errors = [];
  const { name, email, phone, answers, emailVerificationToken } = body;

  if (name !== undefined && (typeof name !== 'string' || !name.trim() || name.trim().length > NAME_MAX_LENGTH)) {
    errors.push(`Name must be 1–${NAME_MAX_LENGTH} characters.`);
  }

  if (email !== undefined && (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim()))) {
    errors.push('Email must be a valid email address.');
  }

  let normalisedPhone;
  if (phone !== undefined && phone !== '') {
    normalisedPhone = normalisePhone(phone);
    if (!normalisedPhone) errors.push('Phone must be a valid 10-digit Indian mobile number.');
  }

  const parsedAnswers = parseAnswers(answers);
  if (parsedAnswers === null || typeof parsedAnswers !== 'object' || Array.isArray(parsedAnswers)) {
    errors.push('Answers must be an object keyed by field key.');
  }

  if (errors.length > 0) return { valid: false, errors };

  return {
    valid: true,
    data: {
      name: name?.trim(),
      email: email?.trim().toLowerCase(),
      phone: normalisedPhone,
      answers: parsedAnswers,
      emailVerificationToken: typeof emailVerificationToken === 'string' ? emailVerificationToken : undefined,
    },
  };
}

function validateAnswerValue(field, rawValue) {
  if (typeof rawValue !== 'string' && typeof rawValue !== 'number') return { error: 'is invalid.' };

  const text = String(rawValue).trim();

  switch (field.type) {
    case 'text':
      return text.length > REGISTRATION_TEXT_MAX
        ? { error: `must be ${REGISTRATION_TEXT_MAX} characters or fewer.` }
        : { value: text };
    case 'textarea':
      return text.length > REGISTRATION_TEXTAREA_MAX
        ? { error: `must be ${REGISTRATION_TEXTAREA_MAX} characters or fewer.` }
        : { value: text };
    case 'number': {
      const num = Number(text);
      return Number.isFinite(num) ? { value: num } : { error: 'must be a number.' };
    }
    case 'email':
      return EMAIL_REGEX.test(text) ? { value: text.toLowerCase() } : { error: 'must be a valid email address.' };
    case 'phone': {
      const phone = normalisePhone(text);
      return phone ? { value: phone } : { error: 'must be a valid 10-digit Indian mobile number.' };
    }
    default:
      return { error: 'has an unsupported type.' };
  }
}

// Checks the submitted answers against the event's registration fields.
// Returns the answers as a snapshot list ({ key, label, type, value }) in form order.
export function validateRegistrationAnswers(fields, rawAnswers, errors) {
  const knownKeys = new Set(fields.map((field) => field.key));
  Object.keys(rawAnswers)
    .filter((key) => !knownKeys.has(key))
    .forEach((key) => errors.push(`Unknown field: ${key}.`));

  const answers = [];
  for (const field of fields) {
    const raw = rawAnswers[field.key];

    // A checkbox always has an answer: unticked/omitted is `false`, and a required one must be ticked.
    if (field.type === 'checkbox') {
      const checked = raw === true || raw === 'true';
      const isBoolean = raw === undefined || raw === null || raw === '' || typeof raw === 'boolean' || raw === 'true' || raw === 'false';
      if (!isBoolean) {
        errors.push(`${field.label} must be true or false.`);
      } else if (field.required && !checked) {
        errors.push(`${field.label} must be checked.`);
      } else {
        answers.push({ key: field.key, label: field.label, type: field.type, value: checked });
      }
      continue;
    }

    const isEmpty = raw === undefined || raw === null || String(raw).trim() === '';

    if (isEmpty) {
      if (field.required) errors.push(`${field.label} is required.`);
      continue;
    }

    const { value, error } = validateAnswerValue(field, raw);
    if (error) {
      errors.push(`${field.label} ${error}`);
    } else {
      answers.push({ key: field.key, label: field.label, type: field.type, value });
    }
  }

  return answers;
}
