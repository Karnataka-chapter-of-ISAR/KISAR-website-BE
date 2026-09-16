import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

// Credentials/region resolve from the standard AWS env vars
// (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION) via the SDK's
// default credential provider chain — nothing to pass explicitly here.
const sesClient = new SESv2Client({});

export async function sendEmail({ to, subject, text }) {
  await sesClient.send(new SendEmailCommand({
    FromEmailAddress: process.env.EMAIL_FROM,
    Destination: { ToAddresses: [to] },
    Content: {
      Simple: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: { Text: { Data: text, Charset: 'UTF-8' } },
      },
    },
  }));
}
