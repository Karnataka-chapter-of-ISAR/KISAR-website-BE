export const EVENT_TYPES = ['Conference', 'Workshop', 'Seminar', 'Webinar', 'Meetup', 'CME', 'Other'];

// 24-hour HH:mm, matches the native <input type="time"> format shown in the form
export const TIME_FORMAT_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Every string-valued Event field, searched together for the events search box.
// Excludes bannerImage (internal file path) — date is handled separately since
// it isn't a string.
export const EVENT_SEARCHABLE_STRING_FIELDS = ['title', 'type', 'location', 'time', 'link', 'linkLabel', 'createdBy'];

export const EVENT_ACCESS_TYPES = ['open', 'members_only'];

export const EVENT_CURRENCY = 'INR';

// Admin-defined registration form fields (on top of the fixed basic fields).
export const REGISTRATION_FIELD_TYPES = ['text', 'textarea', 'number', 'email', 'phone', 'checkbox'];
export const REGISTRATION_FIELDS_MAX = 15;
export const REGISTRATION_FIELD_LABEL_MAX = 60;
export const REGISTRATION_FIELD_PLACEHOLDER_MAX = 100;
export const REGISTRATION_TEXT_MAX = 200;
export const REGISTRATION_TEXTAREA_MAX = 2000;

// Keys used by the fixed basic fields — custom fields may not reuse them.
export const REGISTRATION_RESERVED_KEYS = ['name', 'email', 'phone', 'isarMemberId'];

export const REGISTRATION_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  CONFIRMED: 'confirmed',
  REFUND_PENDING: 'refund_pending',
  REFUNDED: 'refunded',
  EVENT_CANCELLED: 'event_cancelled',
};

// Progress of a single registration's refund (status stays `refund_pending` until SUCCESS).
export const REFUND_STATUS = {
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
};

// Indian mobile number, optionally prefixed with +91 / 91; spaces and dashes are stripped first.
export const PHONE_REGEX = /^(?:\+?91)?[6-9]\d{9}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const REGISTRATION_VERIFICATION_TTL = '30m';
