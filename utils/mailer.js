import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

// Credentials come from the default provider chain (EB instance role in prod).
const sesClient = new SESv2Client({
  region: process.env.SES_REGION,
});

const wrapBase64 = (buffer) => buffer.toString('base64').replace(/(.{76})/g, '$1\r\n');
const encodeHeader = (value) => `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;
const textPart = (type, body) => [
  `Content-Type: ${type}; charset=UTF-8`,
  'Content-Transfer-Encoding: base64',
  '',
  wrapBase64(Buffer.from(body, 'utf8')),
];

// SES's Simple content can't carry attachments, so these go out as a raw
// multipart/mixed message: [alternative(text, html)] + one part per attachment.
function buildRawMessage({ to, subject, text, html, attachments, replyTo }) {
  const mixed = `mixed_${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`;
  const alt = `alt_${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`;

  const lines = [
    `From: ${process.env.SES_FROM || process.env.EMAIL_FROM}`,
    `To: ${to}`,
    ...(replyTo ? [`Reply-To: ${replyTo}`] : []),
    `Subject: ${encodeHeader(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${mixed}"`,
    '',
    `--${mixed}`,
    `Content-Type: multipart/alternative; boundary="${alt}"`,
    '',
    `--${alt}`,
    ...textPart('text/plain', text),
    ...(html ? [`--${alt}`, ...textPart('text/html', html)] : []),
    `--${alt}--`,
  ];

  for (const { filename, content, contentType } of attachments) {
    lines.push(
      `--${mixed}`,
      `Content-Type: ${contentType}; name="${filename}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${filename}"`,
      '',
      wrapBase64(content),
    );
  }
  lines.push(`--${mixed}--`, '');

  return Buffer.from(lines.join('\r\n'), 'utf8');
}

// `text` is always sent; pass `html` as well for a styled version.
// `attachments` = [{ filename, content: Buffer, contentType }].
// `replyTo` overrides the SES_REPLY_TO default (e.g. to answer a contact-form sender directly).
export async function sendEmail({ to, subject, text, html, attachments = [], replyTo: replyToOverride }) {
  const replyTo = replyToOverride || process.env.SES_REPLY_TO;
  const configSet = process.env.SES_CONFIG_SET;

  const content = attachments.length > 0
    ? { Raw: { Data: buildRawMessage({ to, subject, text, html, attachments, replyTo }) } }
    : {
      Simple: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: {
          Text: { Data: text, Charset: 'UTF-8' },
          ...(html && { Html: { Data: html, Charset: 'UTF-8' } }),
        },
      },
    };

  await sesClient.send(new SendEmailCommand({
    // With Raw content the From/To/Reply-To headers live inside the message.
    ...(attachments.length === 0 && { FromEmailAddress: process.env.SES_FROM || process.env.EMAIL_FROM }),
    ...(attachments.length === 0 && { Destination: { ToAddresses: [to] } }),
    ...(attachments.length === 0 && replyTo && { ReplyToAddresses: [replyTo] }),
    ...(configSet && { ConfigurationSetName: configSet }),
    Content: content,
  }));
}
