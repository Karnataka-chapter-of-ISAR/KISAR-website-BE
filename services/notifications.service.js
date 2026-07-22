import logger from '../utils/logger.js';

// Provider not finalized yet — logging only until the real transport is wired in.
// Once chosen, swap the body of this function for a call to utils/mailer.js's sendEmail().
export async function sendWelcomeEmail(member) {
  logger.info(`[sendWelcomeEmail] queued welcome email for ${member.email}`);
}
