import { EVENT_TYPES, TIME_FORMAT_REGEX } from '../../constants/events.js';

const LINK_LABEL_MAX_LENGTH = 50;

// Validates a partial update payload — only keys present in the body are validated and returned.
// Returns { valid: false, errors: string[] } on failure, or { valid: true, data: {...} } on success.
export function validateUpdateEventRequest(body = {}) {
  const errors = [];
  const data = {};
  const { title, type, capacity, date, time, location, link, linkLabel, isHighlighted } = body;

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

  if (capacity !== undefined) {
    const capacityNum = Number(capacity);
    if (capacity === null || capacity === '' || !Number.isInteger(capacityNum) || capacityNum < 1) {
      errors.push('Capacity must be a positive whole number.');
    } else {
      data.capacity = capacityNum;
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

  if (errors.length > 0) return { valid: false, errors };

  return { valid: true, data };
}
