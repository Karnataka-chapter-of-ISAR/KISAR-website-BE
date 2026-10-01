import logger from '../utils/logger.js';
import { sendEmail } from '../utils/mailer.js';

// Never throws: a failed welcome email must not fail member creation or an import.
export async function sendWelcomeEmail(member) {
  try {
    await sendEmail({
      to: member.email,
      subject: 'Welcome to KISAR',
      text: `Hello ${member.name || 'Member'},\n\nYou have been registered as a KISAR member. You can now log in using this email address; a one-time code will be sent to you each time.\n\n- KISAR`,
    });
    logger.info(`[sendWelcomeEmail] sent welcome email to ${member.email}`);
  } catch (err) {
    logger.error(`[sendWelcomeEmail] failed for ${member.email}: ${err.message}`);
  }
}
