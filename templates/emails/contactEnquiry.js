import { escapeHtml, renderLayout } from './layout.js';

const row = (label, valueHtml) => `
    <tr>
      <td valign="top" style="padding:8px 16px 8px 0;font-size:13px;color:#756c74;white-space:nowrap;">${escapeHtml(label)}</td>
      <td valign="top" style="padding:8px 0;font-size:14px;color:#221a20;">${valueHtml}</td>
    </tr>`;

// Internal notification sent to the KISAR inbox when someone submits the contact form.
export function renderContactEnquiry({ firstName, lastName, email, phone, topic, message }) {
  const fullName = `${firstName} ${lastName}`;
  const subject = `Website enquiry: ${topic}`;

  const bodyHtml = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${row('Name', escapeHtml(fullName))}
      ${row('Email', `<a href="mailto:${escapeHtml(email)}" style="color:#982078;">${escapeHtml(email)}</a>`)}
      ${row('Phone', phone ? escapeHtml(phone) : '<span style="color:#756c74;">Not provided</span>')}
      ${row('Topic', escapeHtml(topic))}
    </table>
    <p style="margin:20px 0 6px;font-size:13px;color:#756c74;">Message</p>
    <p style="margin:0;white-space:pre-wrap;">${escapeHtml(message)}</p>
    <p style="margin:26px 0 0;font-size:13px;color:#756c74;">Reply to this email to respond to ${escapeHtml(firstName)} directly. They consented to KISAR storing their details to respond to this enquiry.</p>`;

  const html = renderLayout({
    preheader: `${fullName} wrote about ${topic}.`,
    eyebrow: 'Contact form',
    title: 'New website enquiry',
    subtitle: topic,
    bodyHtml,
  });

  const text = [
    'New website enquiry',
    '',
    `Name: ${fullName}`,
    `Email: ${email}`,
    `Phone: ${phone || 'Not provided'}`,
    `Topic: ${topic}`,
    '',
    'Message:',
    message,
    '',
    'Reply to this email to respond directly. The sender consented to KISAR storing their details to respond to this enquiry.',
  ].join('\n');

  return { subject, html, text };
}
