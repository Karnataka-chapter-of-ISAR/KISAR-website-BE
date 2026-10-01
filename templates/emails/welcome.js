import { escapeHtml, portalUrl, renderButton, renderLayout, renderSteps } from './layout.js';

const STEPS = [
  { title: 'Enter your email', detail: 'Use the address this message was sent to.' },
  { title: 'Receive a one-time code', detail: 'A 6-digit code arrives in your inbox.' },
  { title: 'Enter the code', detail: 'You are signed in to the member portal.' },
];

export function renderWelcome({ name }) {
  const displayName = name || 'Member';
  const subject = 'Welcome to the Karnataka Chapter of ISAR';

  const bodyHtml = `
    <p style="margin:0 0 16px;">Hello ${escapeHtml(displayName)},</p>
    <p style="margin:0;">You have been registered as a KISAR member. You can now log in using this email address; a one-time code will be sent to you each time.</p>
    ${renderButton('Log in to the portal →', portalUrl())}
    ${renderSteps('How login works', STEPS)}
    <p style="margin:26px 0 22px;color:#756c74;">— KISAR</p>`;

  const html = renderLayout({
    preheader: 'Your KISAR member account is ready. Log in with a one-time code.',
    eyebrow: 'Membership confirmed',
    title: 'Welcome to the Karnataka Chapter of ISAR',
    subtitle: 'Your member account is ready.',
    bodyHtml,
  });

  const text = [
    `Hello ${displayName},`,
    '',
    'You have been onboarded as a KISAR member. You can now log in using this email address; a one-time code will be sent to you each time.',
    '',
    `Log in to the portal: ${portalUrl()}`,
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
