import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

// Credentials come from the default provider chain (EB instance role in prod).
const sesClient = new SESv2Client({
  region: process.env.SES_REGION,
});

export async function sendEmail({ to, subject, text }) {
  const replyTo = process.env.SES_REPLY_TO;
  const configSet = process.env.SES_CONFIG_SET;

  await sesClient.send(new SendEmailCommand({
    FromEmailAddress: process.env.SES_FROM || process.env.EMAIL_FROM,
    Destination: { ToAddresses: [to] },
    ...(replyTo && { ReplyToAddresses: [replyTo] }),
    ...(configSet && { ConfigurationSetName: configSet }),
    Content: {
      Simple: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: { Text: { Data: text, Charset: 'UTF-8' } },
      },
    },
  }));
}
