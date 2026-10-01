import logger from '../utils/logger.js';
import { sendEmail } from '../utils/mailer.js';
import { renderWelcome } from '../templates/emails/welcome.js';

// Never throws: a failed welcome email must not fail member creation or an import.
export async function sendWelcomeEmail(member) {
  try {
    const { subject, html, text } = renderWelcome({ name: member.name });
    await sendEmail({ to: member.email, subject, html, text });
    logger.info(`[sendWelcomeEmail] sent welcome email to ${member.email}`);
  } catch (err) {
    logger.error(`[sendWelcomeEmail] failed for ${member.email}: ${err.message}`);
  }
}
