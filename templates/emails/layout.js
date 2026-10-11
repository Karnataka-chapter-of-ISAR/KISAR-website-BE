// Shared KISAR email shell. Email clients ignore most modern CSS, so this is
// table-based with inline styles. Brand tokens mirror the website's theme.
const BRAND = '#982078';
const PLUM = '#3a0e2f';
const INK = '#221a20';
const MUTED = '#756c74';
const DISPLAY_FONT = "Spectral, Georgia, 'Times New Roman', serif";
const SANS_FONT = "'Libre Franklin', Arial, Helvetica, sans-serif";

const HEADER_HEIGHT = 250;

export const portalUrl = () => process.env.PORTAL_URL || 'https://www.kisar.org.in';
export const adminPortalUrl = () => process.env.ADMIN_PORTAL_URL || 'https://kisaradmin.netlify.app';
const assetBase = () => process.env.EMAIL_ASSET_BASE_URL || `${portalUrl()}/email`;

export function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderButton(label, href) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 30px;">
      <tr>
        <td bgcolor="${BRAND}" style="background-color:${BRAND};border-radius:10px;">
          <a href="${escapeHtml(href)}" target="_blank" style="display:inline-block;padding:14px 26px;font-family:${SANS_FONT};font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>`;
}

export function renderSteps(title, steps) {
  const rows = steps.map((step, i) => `
        <tr>
          <td width="28" valign="top" style="padding:0 14px 16px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
              <td width="28" height="28" align="center" valign="middle" bgcolor="#f0d9e8" style="background-color:#f0d9e8;border-radius:14px;font-family:${DISPLAY_FONT};font-size:13px;font-weight:700;color:${BRAND};">${i + 1}</td>
            </tr></table>
          </td>
          <td valign="top" style="padding:0 0 16px;font-family:${SANS_FONT};">
            <div style="font-size:14px;font-weight:700;color:${INK};line-height:20px;">${escapeHtml(step.title)}</div>
            <div style="font-size:13px;color:${MUTED};line-height:19px;">${escapeHtml(step.detail)}</div>
          </td>
        </tr>`).join('');

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#fcf6fa" style="background-color:#fcf6fa;border:1px solid #efdce8;border-radius:18px;">
      <tr><td style="padding:22px 24px 6px;">
        <div style="font-family:${SANS_FONT};font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${BRAND};padding-bottom:16px;">${escapeHtml(title)}</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>
      </td></tr>
    </table>`;
}

// `title`/`eyebrow`/`subtitle` are plain text (escaped here); `bodyHtml` is trusted markup.
export function renderLayout({ preheader, eyebrow, title, subtitle, bodyHtml }) {
  const headerImg = `${assetBase()}/welcome-header.jpg`;

  return `<!doctype html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light only">
  <title>${escapeHtml(title)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Spectral:wght@600;700&family=Libre+Franklin:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#f4e6f0;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f4e6f0" style="background-color:#f4e6f0;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border-radius:18px;overflow:hidden;">

        <tr>
          <td background="${headerImg}" bgcolor="#fbeff6" valign="bottom" height="${HEADER_HEIGHT}" style="height:${HEADER_HEIGHT}px;background-color:#fbeff6;background-image:url('${headerImg}');background-size:cover;background-position:left center;border-bottom:2px solid ${BRAND};">
            <!--[if gte mso 9]>
            <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:${HEADER_HEIGHT}px;">
              <v:fill type="frame" src="${headerImg}" color="#fbeff6" />
              <v:textbox inset="0,0,0,0">
            <![endif]-->
            <div style="padding:0 32px 28px;">
              <div style="font-family:${SANS_FONT};font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${BRAND};padding-bottom:8px;">${escapeHtml(eyebrow)}</div>
              <div style="font-family:${DISPLAY_FONT};font-size:34px;line-height:40px;font-weight:700;color:${PLUM};">${escapeHtml(title)}</div>
              <div style="font-family:${SANS_FONT};font-size:14px;line-height:20px;color:${INK};padding-top:8px;">${escapeHtml(subtitle)}</div>
            </div>
            <!--[if gte mso 9]></v:textbox></v:rect><![endif]-->
          </td>
        </tr>

        <tr>
          <td style="padding:30px 32px 8px;font-family:${SANS_FONT};font-size:14px;line-height:22px;color:${INK};">
            ${bodyHtml}
          </td>
        </tr>

        <tr>
          <td bgcolor="${PLUM}" style="background-color:${PLUM};padding:24px 32px;font-family:${SANS_FONT};">
            <div style="font-family:${DISPLAY_FONT};font-size:17px;font-weight:700;letter-spacing:1px;color:#ffffff;">Karnataka Chapter of ISAR</div>
            <div style="font-size:12px;color:#c06aa3;padding:2px 0 14px;">Affiliated with the Indian Society of Assisted Reproduction (<a href="https://www.isarindia.net/" target="_blank" style="color:#c06aa3;text-decoration:underline;">ISAR</a>)</div>
            <div style="font-size:11px;line-height:17px;color:#e7b9d6;">This is an automated message. Please do not reply to this email.</div>
            <div style="font-size:11px;line-height:17px;color:#e7b9d6;">Need help? <a href="mailto:info@kisar.org.in" style="color:#ffffff;">info@kisar.org.in</a> &nbsp;&middot;&nbsp; <a href="https://kisar.org.in" style="color:#ffffff;">kisar.org.in</a></div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
