import logger from '../utils/logger.js';
import { sendEmail } from '../utils/mailer.js';
import { renderContactEnquiry } from '../templates/emails/contactEnquiry.js';
import { CONTACT_INBOX } from '../constants/contact.js';
import { AppError } from '../utils/AppError.js';
import { MESSAGES } from '../constants/messages.js';

// The email is the only record of the enquiry, so a send failure is surfaced to the sender.
export async function submitContactEnquiry(enquiry) {
  const { subject, html, text } = renderContactEnquiry(enquiry);
  try {
    await sendEmail({ to: CONTACT_INBOX, subject, html, text, replyTo: enquiry.email });
    logger.info(`[submitContactEnquiry] forwarded enquiry from ${enquiry.email} to ${CONTACT_INBOX}`);
  } catch (err) {
    logger.error(`[submitContactEnquiry] failed for ${enquiry.email}: ${err.message}`);
    throw new AppError(MESSAGES.CONTACT.SEND_FAILED, 502);
  }
}
