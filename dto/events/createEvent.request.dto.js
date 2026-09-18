import { EVENT_TYPES, TIME_FORMAT_REGEX } from '../../constants/events.js';

const LINK_LABEL_MAX_LENGTH = 50;

// `images` arrives as a real array in a JSON body, or as a single field in
// multipart/form-data — either a JSON-encoded array string or one bare URL.
function parseImages(images) {
  if (images === undefined) return [];
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

// Validates and normalises a raw request body into the shape the Event service expects.
// Returns { valid: false, errors: string[] } on failure, or { valid: true, data: {...} } on success.
export function validateCreateEventRequest(body = {}) {
  const errors = [];
  const { title, type, capacity, date, time, location, link, linkLabel, isHighlighted, images } = body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    errors.push('Event title is required.');
  }

  if (!type || !EVENT_TYPES.includes(type)) {
    errors.push(`Type is required and must be one of: ${EVENT_TYPES.join(', ')}.`);
  }

  const capacityNum = Number(capacity);
  if (capacity === undefined || capacity === null || capacity === '' || !Number.isInteger(capacityNum) || capacityNum < 1) {
    errors.push('Capacity is required and must be a positive whole number.');
  }

  const parsedDate = date ? new Date(date) : null;
  if (!date || !parsedDate || Number.isNaN(parsedDate.getTime())) {
    errors.push('Date is required and must be a valid date.');
  }

  if (!time || !TIME_FORMAT_REGEX.test(time)) {
    errors.push('Time is required and must be in HH:mm format.');
  }

  if (!location || typeof location !== 'string' || !location.trim()) {
    errors.push('Location is required.');
  }

  if (link) {
    try {
      new URL(link);
    } catch {
      errors.push('Link must be a valid URL.');
    }
  }

  if (linkLabel && (typeof linkLabel !== 'string' || linkLabel.trim().length > LINK_LABEL_MAX_LENGTH)) {
    errors.push(`Link label must be ${LINK_LABEL_MAX_LENGTH} characters or fewer.`);
  }

  const parsedImages = parseImages(images);
  if (parsedImages === null) {
    errors.push('Images must be an array of image URLs.');
  } else if (parsedImages.some((url) => typeof url !== 'string' || !url.trim())) {
    errors.push('Each image must be a non-empty URL string.');
  }

  if (errors.length > 0) return { valid: false, errors };

  const parsedIsHighlighted = isHighlighted === true || isHighlighted === 'true';

  return {
    valid: true,
    data: {
      title: title.trim(),
      type,
      capacity: capacityNum,
      date: parsedDate,
      time,
      location: location.trim(),
      link: link ? link.trim() : null,
      linkLabel: linkLabel ? linkLabel.trim() : undefined,
      isHighlighted: parsedIsHighlighted,
      images: parsedImages.map((url) => url.trim()),
    },
  };
}
