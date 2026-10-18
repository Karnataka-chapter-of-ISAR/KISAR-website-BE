import logger from '../utils/logger.js';
import { sendEmail } from '../utils/mailer.js';
import { generateInvoicePdf } from '../utils/invoicePdf.js';
import { renderWelcome } from '../templates/emails/welcome.js';
import { renderAdminAdded } from '../templates/emails/adminAdded.js';
import { renderRegistrationConfirmation } from '../templates/emails/registrationConfirmation.js';
import { renderRefundInitiated, renderEventCancelled } from '../templates/emails/registrationRefund.js';

// Never throws: a failed welcome email must not fail member creation or an import.
export async function sendWelcomeEmail(member) {
  try {
    const { subject, html, text } = renderWelcome({ name: member.name, memberId: member.memberId });
    await sendEmail({ to: member.email, subject, html, text });
    logger.info(`[sendWelcomeEmail] sent welcome email to ${member.email}`);
  } catch (err) {
    logger.error(`[sendWelcomeEmail] failed for ${member.email}: ${err.message}`);
  }
}

// Never throws: the admin is already created, so a failed notification must not fail the request.
export async function sendAdminAddedEmail({ name, email, addedBy }) {
  try {
    const { subject, html, text } = renderAdminAdded({ name, addedBy });
    await sendEmail({ to: email, subject, html, text });
    logger.info(`[sendAdminAddedEmail] sent admin notification to ${email}`);
    return true;
  } catch (err) {
    logger.error(`[sendAdminAddedEmail] failed for ${email}: ${err.message}`);
    return false;
  }
}

// The GST invoice accompanies paid registrations that have one; if it can't be
// generated the confirmation still goes out without it.
async function buildInvoiceAttachments(registration) {
  if (!registration.invoice?.number) return [];

  try {
    const content = await generateInvoicePdf({ registration });
    const filename = `Invoice-${registration.invoice.number.replace(/\//g, '-')}.pdf`;
    return [{ filename, content, contentType: 'application/pdf' }];
  } catch (err) {
    logger.error(`[sendRegistrationConfirmationEmail] invoice PDF failed for ${registration.email}: ${err.message}`);
    return [];
  }
}

// Never throws: a failed confirmation email must not undo a confirmed registration.
export async function sendRegistrationConfirmationEmail({ registration, event }) {
  try {
    const attachments = await buildInvoiceAttachments(registration);
    const { subject, html, text } = renderRegistrationConfirmation({ registration, event, hasInvoice: attachments.length > 0 });
    await sendEmail({ to: registration.email, subject, html, text, attachments });
    logger.info(`[sendRegistrationConfirmationEmail] sent to ${registration.email} for event ${registration.eventId}`);
  } catch (err) {
    logger.error(`[sendRegistrationConfirmationEmail] failed for ${registration.email}: ${err.message}`);
  }
}

// Never throws: the refund / cancellation itself has already happened by the time this is sent.
export async function sendRefundInitiatedEmail({ registration, reason }) {
  try {
    const { subject, html, text } = renderRefundInitiated({ registration, reason });
    await sendEmail({ to: registration.email, subject, html, text });
    logger.info(`[sendRefundInitiatedEmail] sent to ${registration.email} for event ${registration.eventId}`);
  } catch (err) {
    logger.error(`[sendRefundInitiatedEmail] failed for ${registration.email}: ${err.message}`);
  }
}

export async function sendEventCancelledEmail({ registration }) {
  try {
    const { subject, html, text } = renderEventCancelled({ registration });
    await sendEmail({ to: registration.email, subject, html, text });
    logger.info(`[sendEventCancelledEmail] sent to ${registration.email} for event ${registration.eventId}`);
  } catch (err) {
    logger.error(`[sendEventCancelledEmail] failed for ${registration.email}: ${err.message}`);
  }
}
