export const EVENT_TYPES = ['Conference', 'Workshop', 'Seminar', 'Webinar', 'Meetup', 'CME', 'Other'];

// 24-hour HH:mm, matches the native <input type="time"> format shown in the form
export const TIME_FORMAT_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Every string-valued Event field, searched together for the events search box.
// Excludes bannerImage (internal file path) — capacity (number) and date are
// handled separately since neither is a string.
export const EVENT_SEARCHABLE_STRING_FIELDS = ['title', 'type', 'location', 'time', 'link', 'linkLabel', 'createdBy'];
