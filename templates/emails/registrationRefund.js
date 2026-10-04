import { escapeHtml, renderLayout } from './layout.js';

const MUTED = '#756c74';

const formatAmount = (amount, currency) => (currency === 'INR' ? `₹${amount}` : `${amount} ${currency}`);

const FOOTER_TEXT = [
  '',
  '- KISAR',
  '',
  'This is an automated message. Please do not reply to this email.',
  'Need help? info@kisar.org.in',
];

function renderMessage({ preheader, eyebrow, title, name, paragraphs }) {
  const bodyHtml = `
    <p style="margin:0 0 16px;">Hello ${escapeHtml(name)},</p>
    ${paragraphs.map((p) => `<p style="margin:0 0 16px;">${escapeHtml(p)}</p>`).join('')}
    <p style="margin:6px 0 22px;color:${MUTED};">— KISAR</p>`;

  return {
    html: renderLayout({ preheader, eyebrow, title, subtitle: '', bodyHtml }),
    text: [`Hello ${name},`, '', ...paragraphs.flatMap((p) => [p, '']).slice(0, -1), ...FOOTER_TEXT].join('\n'),
  };
}

// A refund for a paid registration has been started.
// `reason`: 'event_cancelled' (the event was cancelled) or 'admin' (refunded by an admin, e.g. a duplicate payment).
export function renderRefundInitiated({ registration, reason }) {
  const amount = formatAmount(registration.refund?.amount ?? registration.amount, registration.currency);
  const cause = reason === 'event_cancelled'
    ? `The event "${registration.eventTitle}" has been cancelled, so your registration is cancelled too.`
    : `Your registration for "${registration.eventTitle}" has been cancelled and refunded by the KISAR team.`;

  const paragraphs = [
    cause,
    `A refund of ${amount} has been initiated to your original payment method. It usually reaches your account within 5–7 business days, depending on your bank.`,
    'If you have any questions, write to info@kisar.org.in.',
  ];

  return {
    subject: `Refund initiated: ${registration.eventTitle}`,
    ...renderMessage({
      preheader: `A refund of ${amount} for ${registration.eventTitle} has been initiated.`,
      eyebrow: 'Refund initiated',
      title: 'Your refund is on its way',
      name: registration.name,
      paragraphs,
    }),
  };
}

// The event was cancelled and the registration carried no payment.
export function renderEventCancelled({ registration }) {
  const paragraphs = [
    `We're sorry to let you know that the event "${registration.eventTitle}" has been cancelled, so your registration is cancelled too.`,
    'No payment was taken for this registration, so there is nothing to refund. If you have any questions, write to info@kisar.org.in.',
  ];

  return {
    subject: `Event cancelled: ${registration.eventTitle}`,
    ...renderMessage({
      preheader: `${registration.eventTitle} has been cancelled.`,
      eyebrow: 'Event cancelled',
      title: 'This event has been cancelled',
      name: registration.name,
      paragraphs,
    }),
  };
}
