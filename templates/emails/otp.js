import { escapeHtml, renderLayout } from './layout.js';

const BRAND = '#982078';
const DISPLAY_FONT = "Spectral, Georgia, 'Times New Roman', serif";
const SANS_FONT = "'Libre Franklin', Arial, Helvetica, sans-serif";

// Members are in India; render the expiry in IST regardless of server timezone.
function formatExpiryTime(date) {
  const time = new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  }).format(date);
  return `${time.toUpperCase()} IST`;
}

function renderDigits(otp) {
  const cells = [...otp].map(digit => `
        <td width="52" height="62" align="center" valign="middle" bgcolor="#ffffff" style="background-color:#ffffff;border:1px solid #efdce8;border-bottom:3px solid ${BRAND};border-radius:10px;font-family:${DISPLAY_FONT};font-size:30px;font-weight:700;color:${BRAND};">${escapeHtml(digit)}</td>`)
    .join('<td width="8" style="font-size:0;line-height:0;">&nbsp;</td>');

  return `<table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0"><tr>${cells}</tr></table>`;
}

// `otp` is the plain 6-digit code; `expiresAt` is the Date it stops being valid.
export function renderOtp({ otp, expiresAt }) {
  const subject = 'Your login code';
  const expiryTime = formatExpiryTime(expiresAt);
  const minutes = Math.max(1, Math.round((expiresAt.getTime() - Date.now()) / 60000));

  const bodyHtml = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#fcf6fa" style="background-color:#fcf6fa;border:1px solid #efdce8;border-radius:18px;">
      <tr><td align="center" style="padding:26px 12px 22px;">
        ${renderDigits(otp)}
        <div style="font-family:${SANS_FONT};font-size:13px;color:#756c74;padding-top:16px;">Expires at <strong style="color:#221a20;">${escapeHtml(expiryTime)}</strong> (in ${minutes} minutes)</div>
      </td></tr>
    </table>
    <p style="margin:26px 0 20px;font-size:15px;">This code expires at <strong>${escapeHtml(expiryTime)}</strong>. Do not share it.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#fcf6fa" style="background-color:#fcf6fa;border-radius:12px;">
      <tr><td style="padding:16px 18px;font-family:${SANS_FONT};font-size:13px;line-height:20px;color:#756c74;">If you did not try to log in, you can ignore this email. KISAR will never ask you for this code.</td></tr>
    </table>
    <div style="height:22px;line-height:22px;font-size:0;">&nbsp;</div>`;

  const html = renderLayout({
    preheader: `Your KISAR login code is ${otp}. It expires at ${expiryTime}.`,
    eyebrow: 'One-time code',
    title: 'Your login code',
    subtitle: 'Enter this code to sign in to the KISAR portal.',
    bodyHtml,
  });

  const text = [
    `Your login code is: ${otp}`,
    '',
    `This code expires at ${expiryTime} (in ${minutes} minutes). Do not share it.`,
    '',
    'If you did not try to log in, you can ignore this email. KISAR will never ask you for this code.',
    '',
    '- KISAR',
    'This is an automated message. Please do not reply to this email.',
    'Need help? info@kisar.org.in',
  ].join('\n');

  return { subject, html, text };
}
