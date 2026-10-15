export const ACTIVITY_TYPES = {
  PAYMENT_RECEIVED: 'payment_received',
  APPROVAL_REQUESTED: 'approval_requested',
  ARTICLE_PUBLISHED: 'article_published',
  EVENT_CREATED: 'event_created',
  BULK_MAIL_SENT: 'bulk_mail_sent',
  ADMIN_ADDED: 'admin_added',
  MEMBERS_BULK_UPLOADED: 'members_bulk_uploaded',
};

// Types written to the ActivityLog collection (the rest are derived).
export const LOGGED_ACTIVITY_TYPES = [ACTIVITY_TYPES.BULK_MAIL_SENT, ACTIVITY_TYPES.MEMBERS_BULK_UPLOADED];

// Cap per source and overall, so a busy month can't make the response unbounded.
export const ACTIVITY_PER_SOURCE_LIMIT = 100;
export const ACTIVITY_MAX_ITEMS = 100;
