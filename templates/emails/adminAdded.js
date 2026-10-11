import { adminPortalUrl, escapeHtml, renderButton, renderLayout, renderSteps } from './layout.js';

const STEPS = [
  { title: 'Open the admin portal', detail: 'Use the button above or the link in this email.' },
  { title: 'Enter your email', detail: 'Use the address this message was sent to.' },
  { title: 'Enter the one-time code', detail: 'A 6-digit code is emailed to you each time you sign in.' },
];

// `addedBy` is the name of the admin who added this person (optional).
export function renderAdminAdded({ name, addedBy }) {
  const displayName = name || 'there';
  const url = adminPortalUrl();
  const subject = 'You have been added as a KISAR admin';
  const addedByLine = addedBy ? ` by ${addedBy}` : '';

  const bodyHtml = `
    <p style="margin:0 0 16px;">Hello ${escapeHtml(displayName)},</p>
    <p style="margin:0;">You have been added${escapeHtml(addedByLine)} as an administrator of the KISAR portal. You can now sign in to the admin console using this email address; a one-time code will be sent to you each time.</p>
    ${renderButton('Open the admin portal →', url)}
    ${renderSteps('How login works', STEPS)}
    <p style="margin:26px 0 22px;color:#756c74;">— KISAR</p>`;

  const html = renderLayout({
    preheader: 'You now have admin access to the KISAR portal. Sign in with a one-time code.',
    eyebrow: 'Admin access granted',
    title: 'You are now a KISAR admin',
    subtitle: 'Your admin account is ready.',
    bodyHtml,
  });

  const text = [
    `Hello ${displayName},`,
    '',
    `You have been added${addedByLine} as an administrator of the KISAR portal. You can now sign in to the admin console using this email address; a one-time code will be sent to you each time.`,
    '',
    `Admin portal: ${url}`,
    '',
    'How login works:',
    ...STEPS.map((s, i) => `${i + 1}. ${s.title} - ${s.detail}`),
    '',
    '- KISAR',
    '',
    'This is an automated message. Please do not reply to this email.',
    'Need help? info@kisar.org.in',
  ].join('\n');

  return { subject, html, text };
}
