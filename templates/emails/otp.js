import { escapeHtml, renderLayout } from './layout.js';

const BRAND = '#982078';
const DISPLAY_FONT = "Spectral, Georgia, 'Times New Roman', serif";
const SANS_FONT = "'Libre Franklin', Arial, Helvetica, sans-serif";

function renderDigits(otp) {
  const cells = [...otp].map(digit => `
        <td width="52" height="62" align="center" valign="middle" bgcolor="#ffffff" style="background-color:#ffffff;border:1px solid #efdce8;border-bottom:3px solid ${BRAND};border-radius:10px;font-family:${DISPLAY_FONT};font-size:30px;font-weight:700;color:${BRAND};">${escapeHtml(digit)}</td>`)
    .join('<td width="8" style="font-size:0;line-height:0;">&nbsp;</td>');

  return `<table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0"><tr>${cells}</tr></table>`;
}

const COPY = {
  login: {
    subject: 'Your login code',
    eyebrow: 'One-time code',
    subtitle: 'Enter this code to sign in to the KISAR portal.',
    codeName: 'login code',
    ignoreNote: 'If you did not try to log in, you can ignore this email.',
  },
  event_registration: {
    subject: 'Your email verification code',
    eyebrow: 'Email verification',
    subtitle: 'Enter this code to continue your event registration.',
    codeName: 'verification code',
    ignoreNote: 'If you did not try to register for an event, you can ignore this email.',
  },
};

// `otp` is the plain 6-digit code; `expiresInMinutes` is how long it stays valid.
// `purpose` picks the wording: 'login' (default) or 'event_registration'.
export function renderOtp({ otp, expiresInMinutes, purpose = 'login' }) {
  const copy = COPY[purpose] ?? COPY.login;
  const subject = copy.subject;
  const validFor = `${expiresInMinutes} ${expiresInMinutes === 1 ? 'minute' : 'minutes'}`;

  const bodyHtml = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#fcf6fa" style="background-color:#fcf6fa;border:1px solid #efdce8;border-radius:18px;">
      <tr><td align="center" style="padding:26px 12px 22px;">
        ${renderDigits(otp)}
        <div style="font-family:${SANS_FONT};font-size:13px;color:#756c74;padding-top:16px;">Expires in <strong style="color:#221a20;">${validFor}</strong></div>
      </td></tr>
    </table>
    <p style="margin:26px 0 20px;font-size:15px;">This code expires in ${validFor}. Do not share it.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#fcf6fa" style="background-color:#fcf6fa;border-radius:12px;">
      <tr><td style="padding:16px 18px;font-family:${SANS_FONT};font-size:13px;line-height:20px;color:#756c74;">${copy.ignoreNote} KISAR will never ask you for this code.</td></tr>
    </table>
    <div style="height:22px;line-height:22px;font-size:0;">&nbsp;</div>`;

  const html = renderLayout({
    preheader: `Your KISAR ${copy.codeName} is ${otp}. It expires in ${validFor}.`,
    eyebrow: copy.eyebrow,
    title: `Your ${copy.codeName}`,
    subtitle: copy.subtitle,
    bodyHtml,
  });

  const text = [
    `Your ${copy.codeName} is: ${otp}`,
    '',
    `This code expires in ${validFor}. Do not share it.`,
    '',
    `${copy.ignoreNote} KISAR will never ask you for this code.`,
    '',
    '- KISAR',
    'This is an automated message. Please do not reply to this email.',
    'Need help? info@kisar.org.in',
  ].join('\n');

  return { subject, html, text };
}
