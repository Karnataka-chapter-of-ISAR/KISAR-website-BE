export const CONTACT_TOPICS = [
  'Membership & onboarding',
  'Events & registration',
  'Ethics & accreditation',
  'Media & press',
  'Portal / technical support',
  'Other',
];

export const CONTACT_NAME_MAX = 50;
export const CONTACT_EMAIL_MAX = 254;
export const CONTACT_PHONE_MAX = 10;
export const CONTACT_MESSAGE_MAX = 600;

// Where enquiries are delivered; overridable per environment.
export const CONTACT_INBOX = process.env.CONTACT_TO_EMAIL || 'info@kisar.org.in';
