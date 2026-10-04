import {
  EVENT_ACCESS_TYPES,
  EVENT_CURRENCY,
  REGISTRATION_FIELD_TYPES,
  REGISTRATION_FIELDS_MAX,
  REGISTRATION_FIELD_LABEL_MAX,
  REGISTRATION_FIELD_PLACEHOLDER_MAX,
  REGISTRATION_RESERVED_KEYS,
} from '../../constants/events.js';

const KEY_MAX_LENGTH = 40;

// Create/update bodies are multipart/form-data, where nested values arrive as
// JSON-encoded strings; plain JSON bodies deliver real objects/arrays.
function parseJsonField(value) {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function toBoolean(value) {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return null;
}

function toPrice(value) {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  return Number.isInteger(num) && num >= 1 ? num : NaN;
}

function slugify(label) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, KEY_MAX_LENGTH) || 'field';
}

// Keys are generated from the label (never trusted from the client) and made
// unique within the event, avoiding the reserved basic-field keys.
function uniqueKey(label, usedKeys) {
  const base = slugify(label);
  let key = base;
  for (let n = 2; usedKeys.has(key) || REGISTRATION_RESERVED_KEYS.includes(key); n += 1) {
    key = `${base.slice(0, KEY_MAX_LENGTH - 3)}_${n}`;
  }
  usedKeys.add(key);
  return key;
}

export function validateAccessType(accessType, errors) {
  if (!EVENT_ACCESS_TYPES.includes(accessType)) {
    errors.push(`Access type is required and must be one of: ${EVENT_ACCESS_TYPES.join(', ')}.`);
    return null;
  }
  return accessType;
}

// `pricing` = { isPaid, memberPrice, nonMemberPrice }. Prices are whole INR amounts.
// Members-only events only have a member price.
export function validatePricing(rawPricing, accessType, errors) {
  const pricing = parseJsonField(rawPricing) ?? {};
  if (!isPlainObject(pricing)) {
    errors.push('Pricing must be an object.');
    return null;
  }

  const isPaid = pricing.isPaid === undefined ? false : toBoolean(pricing.isPaid);
  if (isPaid === null) {
    errors.push('pricing.isPaid must be a boolean.');
    return null;
  }

  if (!isPaid) {
    return { isPaid: false, memberPrice: null, nonMemberPrice: null, currency: EVENT_CURRENCY };
  }

  const memberPrice = toPrice(pricing.memberPrice);
  if (memberPrice === null || Number.isNaN(memberPrice)) {
    errors.push('Member price is required for a paid event and must be a whole number of at least 1.');
  }

  let nonMemberPrice = null;
  if (accessType === 'open') {
    nonMemberPrice = toPrice(pricing.nonMemberPrice);
    if (nonMemberPrice === null || Number.isNaN(nonMemberPrice)) {
      errors.push('Non-member price is required for a paid open event and must be a whole number of at least 1.');
    } else if (memberPrice && !Number.isNaN(memberPrice) && memberPrice > nonMemberPrice) {
      errors.push('Member price cannot be higher than the non-member price.');
    }
  } else if (accessType === 'members_only' && toPrice(pricing.nonMemberPrice) !== null) {
    errors.push('A members-only event cannot have a non-member price.');
  }

  return { isPaid: true, memberPrice, nonMemberPrice, currency: EVENT_CURRENCY };
}

// `registrationFields` = admin-defined extra fields: [{ label, type, required, placeholder }].
export function validateRegistrationFields(rawFields, errors) {
  if (rawFields === undefined || rawFields === null || rawFields === '') return [];

  const fields = parseJsonField(rawFields);
  if (!Array.isArray(fields)) {
    errors.push('Registration fields must be an array.');
    return null;
  }
  if (fields.length > REGISTRATION_FIELDS_MAX) {
    errors.push(`An event can have at most ${REGISTRATION_FIELDS_MAX} custom registration fields.`);
    return null;
  }

  const usedKeys = new Set();
  const result = [];

  fields.forEach((field, index) => {
    const position = `Registration field ${index + 1}`;
    if (!isPlainObject(field)) {
      errors.push(`${position} must be an object.`);
      return;
    }

    const label = typeof field.label === 'string' ? field.label.trim() : '';
    if (!label || label.length > REGISTRATION_FIELD_LABEL_MAX) {
      errors.push(`${position}: label is required and must be ${REGISTRATION_FIELD_LABEL_MAX} characters or fewer.`);
      return;
    }
    if (!REGISTRATION_FIELD_TYPES.includes(field.type)) {
      errors.push(`${position}: type must be one of: ${REGISTRATION_FIELD_TYPES.join(', ')}.`);
      return;
    }

    const required = field.required === undefined ? false : toBoolean(field.required);
    if (required === null) {
      errors.push(`${position}: required must be a boolean.`);
      return;
    }

    const placeholder = typeof field.placeholder === 'string' ? field.placeholder.trim() : '';
    if (placeholder.length > REGISTRATION_FIELD_PLACEHOLDER_MAX) {
      errors.push(`${position}: placeholder must be ${REGISTRATION_FIELD_PLACEHOLDER_MAX} characters or fewer.`);
      return;
    }

    result.push({
      key: uniqueKey(label, usedKeys),
      label,
      type: field.type,
      required,
      placeholder: placeholder || null,
    });
  });

  return result;
}
