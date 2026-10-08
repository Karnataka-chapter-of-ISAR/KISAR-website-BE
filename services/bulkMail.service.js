import { findMembersByIds } from '../repositories/member.repository.js';
import { sendEmail } from '../utils/mailer.js';
import { escapeHtml } from '../templates/emails/layout.js';
import { BULK_MAIL_CONCURRENCY } from '../constants/mails.js';
import { AppError } from '../utils/AppError.js';
import { MESSAGES } from '../constants/messages.js';
import logger from '../utils/logger.js';

// Replaces {{name}} / {{email}} placeholders; `escape` is true for HTML so a
// member's name can never inject markup into the designed email.
function fillPlaceholders(template, member, escape) {
  const values = { name: member.name, email: member.email };
  return template.replace(/\{\{\s*(name|email)\s*\}\}/gi, (_, key) => {
    const value = values[key.toLowerCase()] ?? '';
    return escape ? escapeHtml(value) : value;
  });
}

// Plain-text fallback for clients that don't render HTML, used when the FE doesn't send one.
function htmlToText(html) {
  return html
    .replace(/<(style|script|head)[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>|<\/(p|div|tr|h[1-6]|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Sends the designed email to each selected member, a few at a time (SES has a
// per-second send rate). One failed recipient never aborts the rest — the result
// reports exactly who did and didn't get it.
export async function sendBulkMail({ recipientIds, subject, html, text }) {
  const members = await findMembersByIds(recipientIds);
  if (members.length === 0) {
    throw new AppError(MESSAGES.MAILS.NO_RECIPIENTS_FOUND, 404);
  }

  const foundIds = new Set(members.map(m => String(m._id)));
  const notFound = recipientIds.filter(id => !foundIds.has(id));

  const sent = [];
  const failed = [];
  const baseText = text ?? htmlToText(html);

  let cursor = 0;
  async function worker() {
    while (cursor < members.length) {
      const member = members[cursor++];
      try {
        await sendEmail({
          to: member.email,
          subject: fillPlaceholders(subject, member, false),
          html: fillPlaceholders(html, member, true),
          text: fillPlaceholders(baseText, member, false),
        });
        sent.push(String(member._id));
      } catch (err) {
        logger.error(`[sendBulkMail] failed for ${member.email}: ${err.message}`);
        failed.push({ id: String(member._id), email: member.email });
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(BULK_MAIL_CONCURRENCY, members.length) }, worker));

  logger.info(`[sendBulkMail] sent=${sent.length} failed=${failed.length} notFound=${notFound.length}`);
  return { sent, failed, notFound };
}
