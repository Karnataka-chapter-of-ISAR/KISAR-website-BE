import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

// Uses a dedicated SES IAM user, separate from the S3 upload user
// (AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY), so each credential set only
// carries the permissions its own service needs.
const sesClient = new SESv2Client({
  region: process.env.SES_REGION,
  credentials: {
    accessKeyId: process.env.SES_ACCESS_KEY_ID,
    secretAccessKey: process.env.SES_SECRET_ACCESS_KEY,
  },
});

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
