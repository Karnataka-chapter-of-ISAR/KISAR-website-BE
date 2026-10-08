export const BULK_MAIL_MAX_RECIPIENTS = 500;
export const BULK_MAIL_MAX_SUBJECT_LENGTH = 200;
export const BULK_MAIL_MAX_HTML_LENGTH = 1_000_000;
export const BULK_MAIL_CONCURRENCY = 10;
// Route-level JSON body limit — must exceed BULK_MAIL_MAX_HTML_LENGTH plus the recipient ids.
export const BULK_MAIL_BODY_LIMIT = '2mb';
