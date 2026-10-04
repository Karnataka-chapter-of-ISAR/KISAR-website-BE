import { EVENT_TYPES, TIME_FORMAT_REGEX } from '../../constants/events.js';

const LINK_LABEL_MAX_LENGTH = 50;
const LOCKED_FIELDS = ['accessType', 'pricing', 'registrationFields'];

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
  const { title, type, date, time, location, link, linkLabel, isHighlighted, images } = body;

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
    } else {
      data.type = type;
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

  if (time !== undefined) {
    if (!time || !TIME_FORMAT_REGEX.test(time)) {
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
