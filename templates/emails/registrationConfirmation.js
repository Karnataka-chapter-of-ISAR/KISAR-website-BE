import { cgstRatePercent, sgstRatePercent } from '../../utils/gst.js';
import { escapeHtml, portalUrl, renderButton, renderLayout } from './layout.js';

const MUTED = '#756c74';
const INK = '#221a20';
const SANS_FONT = "'Libre Franklin', Arial, Helvetica, sans-serif";

const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata',
});

// Multi-day events show "<start> to <end>"; legacy registrations have no end date.
const formatEventDates = (start, end) => {
  const from = formatDate(start);
  const till = end ? formatDate(end) : from;
  return till === from ? from : `${from} to ${till}`;
};

const formatAmount = (amount, currency) => (currency === 'INR' ? `₹${amount}` : `${amount} ${currency}`);

function renderDetails(rows) {
  const body = rows.map(([label, value]) => `
        <tr>
          <td valign="top" style="padding:0 16px 10px 0;font-family:${SANS_FONT};font-size:13px;color:${MUTED};white-space:nowrap;">${escapeHtml(label)}</td>
          <td valign="top" style="padding:0 0 10px;font-family:${SANS_FONT};font-size:14px;font-weight:600;color:${INK};">${escapeHtml(value)}</td>
        </tr>`).join('');

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#fcf6fa" style="background-color:#fcf6fa;border:1px solid #efdce8;border-radius:18px;">
      <tr><td style="padding:22px 24px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${body}</table>
      </td></tr>
    </table>`;
}

// `registration` is a Registration document (needs eventTitle/eventDate/name/amount/currency/payment);
// `event` supplies the time and location, which aren't snapshotted on the registration.
export function renderRegistrationConfirmation({ registration, event, hasInvoice = false }) {
  const paid = registration.amount > 0;
  const hasGst = paid && registration.baseAmount != null;
  const subject = `You're registered: ${registration.eventTitle}`;

  const rows = [
    ['Event', registration.eventTitle],
    [registration.eventEndDate ? 'Dates' : 'Date', formatEventDates(registration.eventDate, registration.eventEndDate)],
    ...(event?.time ? [['Time', event.time]] : []),
    ...(event?.location ? [['Location', event.location]] : []),
    ['Registered as', `${registration.name} (${registration.email})`],
    ...(hasGst
      ? [
        ['Entry fee', formatAmount(registration.baseAmount, registration.currency)],
        [`CGST (${cgstRatePercent()}%)`, formatAmount(registration.cgst, registration.currency)],
        [`SGST (${sgstRatePercent()}%)`, formatAmount(registration.sgst, registration.currency)],
      ]
      : []),
    ...(paid
      ? [
        ['Amount paid', formatAmount(registration.amount, registration.currency)],
        ['Order ID', registration.payment?.orderId ?? '—'],
      ]
      : []),
    ...(hasInvoice ? [['Invoice no.', registration.invoice.number]] : []),
  ];

  const bodyHtml = `
    <p style="margin:0 0 16px;">Hello ${escapeHtml(registration.name)},</p>
    <p style="margin:0 0 20px;">${paid ? 'Your payment was received and your registration is confirmed.' : 'Your registration is confirmed.'} Here are your details:</p>
    ${renderDetails(rows)}
    ${hasInvoice ? `<p style="margin:20px 0 0;">Your GST tax invoice is attached to this email as a PDF.</p>` : ''}
    ${renderButton('View events →', `${portalUrl()}/events`)}
    <p style="margin:0 0 22px;color:${MUTED};">Registrations cannot be cancelled online. If something looks wrong, write to info@kisar.org.in.</p>
    <p style="margin:0 0 22px;color:${MUTED};">— KISAR</p>`;

  const html = renderLayout({
    preheader: `Your registration for ${registration.eventTitle} is confirmed.`,
    eyebrow: 'Registration confirmed',
    title: "You're registered",
    subtitle: registration.eventTitle,
    bodyHtml,
  });

  const text = [
    `Hello ${registration.name},`,
    '',
    paid ? 'Your payment was received and your registration is confirmed.' : 'Your registration is confirmed.',
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`),
    '',
    ...(hasInvoice ? ['Your GST tax invoice is attached to this email as a PDF.', ''] : []),
    'Registrations cannot be cancelled online. If something looks wrong, write to info@kisar.org.in.',
    '',
    '- KISAR',
    '',
    'This is an automated message. Please do not reply to this email.',
    'Need help? info@kisar.org.in',
  ].join('\n');

  return { subject, html, text };
}
