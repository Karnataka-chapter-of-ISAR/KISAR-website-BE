import { EVENT_TYPES, EVENT_CUSTOM_TYPE_MAX, TIME_FORMAT_REGEX } from '../../constants/events.js';

const LINK_LABEL_MAX_LENGTH = 50;
const LOCKED_FIELDS = ['accessType', 'pricing', 'registrationFields'];

// Users are redirected to this link, so only web URLs are accepted.
function isHttpUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    return ['http:', 'https:'].includes(new URL(value.trim()).protocol);
  } catch {
    return false;
  }
}

// `images` arrives as a real array in a JSON body, or as a single field in
// multipart/form-data — either a JSON-encoded array string or one bare URL.
function parseImages(images) {
  if (Array.isArray(images)) return images;
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // not JSON — treat as a single URL
    }
    return [images];
  }
  return null;
}

// Validates a partial update payload — only keys present in the body are validated and returned.
// Returns { valid: false, errors: string[] } on failure, or { valid: true, data: {...} } on success.
export function validateUpdateEventRequest(body = {}) {
  const errors = [];
  const data = {};
  const { title, type, customType, date, endDate, time, location, link, linkLabel, registrationLink, isHighlighted, images } = body;

  // Fixed once the event is created: attendees register (and pay) against these.
  const lockedFields = LOCKED_FIELDS.filter((field) => body[field] !== undefined);
  if (lockedFields.length > 0) {
    errors.push(`${lockedFields.join(', ')} cannot be changed after the event is created.`);
  }

  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      errors.push('Event title must be a non-empty string.');
    } else {
      data.title = title.trim();
    }
  }

  if (type !== undefined) {
    if (!EVENT_TYPES.includes(type)) {
      errors.push(`Type must be one of: ${EVENT_TYPES.join(', ')}.`);
    } else if (type === 'Other') {
      const trimmedCustomType = typeof customType === 'string' ? customType.trim() : '';
      if (!trimmedCustomType || trimmedCustomType.length > EVENT_CUSTOM_TYPE_MAX) {
        errors.push(`Custom category is required when type is Other and must be ${EVENT_CUSTOM_TYPE_MAX} characters or fewer.`);
      } else {
        data.type = type;
        data.customType = trimmedCustomType;
      }
    } else {
      data.type = type;
      data.customType = null;
    }
  }

  if (date !== undefined) {
    const parsedDate = date ? new Date(date) : null;
    if (!date || !parsedDate || Number.isNaN(parsedDate.getTime())) {
      errors.push('Date must be a valid date.');
    } else {
      data.date = parsedDate;
    }
  }

  // null / empty resets the event to a single day. Ordering against the start
  // date is checked in the service, which knows the stored value.
  if (endDate !== undefined) {
    if (!endDate) {
      data.endDate = null;
    } else {
      const parsedEndDate = new Date(endDate);
      if (Number.isNaN(parsedEndDate.getTime())) {
        errors.push('End date must be a valid date.');
      } else {
        data.endDate = parsedEndDate;
      }
    }
  }

  if (time !== undefined) {
    // Empty value clears the optional time.
    if (!time) {
      data.time = null;
    } else if (!TIME_FORMAT_REGEX.test(time)) {
      errors.push('Time must be in HH:mm format.');
    } else {
      data.time = time;
    }
  }

  if (location !== undefined) {
    if (typeof location !== 'string' || !location.trim()) {
      errors.push('Location must be a non-empty string.');
    } else {
      data.location = location.trim();
    }
  }

  // Empty value clears the link, switching the event back to on-site registration.
  if (registrationLink !== undefined) {
    if (!registrationLink) {
      data.registrationLink = null;
    } else if (!isHttpUrl(registrationLink)) {
      errors.push('Registration link must be a valid http(s) URL.');
    } else {
      data.registrationLink = registrationLink.trim();
    }
  }

  if (link !== undefined) {
    if (link) {
      try {
        new URL(link);
        data.link = link.trim();
      } catch {
        errors.push('Link must be a valid URL.');
      }
    } else {
      data.link = null;
    }
  }

  if (linkLabel !== undefined) {
    if (linkLabel && (typeof linkLabel !== 'string' || linkLabel.trim().length > LINK_LABEL_MAX_LENGTH)) {
      errors.push(`Link label must be ${LINK_LABEL_MAX_LENGTH} characters or fewer.`);
    } else {
      data.linkLabel = linkLabel ? linkLabel.trim() : undefined;
    }
  }

  if (isHighlighted !== undefined) {
    if (isHighlighted !== true && isHighlighted !== false && isHighlighted !== 'true' && isHighlighted !== 'false') {
      errors.push('isHighlighted must be a boolean.');
    } else {
      data.isHighlighted = isHighlighted === true || isHighlighted === 'true';
    }
  }

  if (images !== undefined) {
    const parsedImages = parseImages(images);
    if (parsedImages === null) {
      errors.push('Images must be an array of image URLs.');
    } else if (parsedImages.some((url) => typeof url !== 'string' || !url.trim())) {
      errors.push('Each image must be a non-empty URL string.');
    } else {
      data.images = parsedImages.map((url) => url.trim());
    }
  }

  if (errors.length > 0) return { valid: false, errors };

  return { valid: true, data };
}
