import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import config from '../config';

function createMimeMessage(to: string, from: string, subject: string, html: string): string {
  const boundary = `__boundary_${Date.now()}__`;
  const messageParts = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    'Please view this email with an HTML-compatible client.',
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    html,
    '',
    `--${boundary}--`,
  ];

  const message = messageParts.join('\r\n');
  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function testGmail() {
  console.log('================================================================');
  console.log('     Human Shelter Realty | Google Mail Verification Tool       ');
  console.log('================================================================\n');

  const clientId = config.integrations.googleClientId;
  const clientSecret = config.integrations.googleClientSecret;
  const gmailRefreshToken = config.integrations.gmailRefreshToken;
  const userEmail = config.integrations.gmailUserEmail;
  const appPassword = config.integrations.gmailAppPassword;

  console.log(` • Google Client ID     : ${clientId ? '••••••••' + clientId.slice(-8) : '❌ NOT SET'}`);
  console.log(` • GMAIL_REFRESH_TOKEN  : ${gmailRefreshToken ? '•••••••• (' + gmailRefreshToken.length + ' chars)' : '❌ NOT SET'}`);
  console.log(` • GMAIL_USER_EMAIL     : ${userEmail || '❌ NOT SET'}`);
  console.log(` • GMAIL_APP_PASSWORD   : ${appPassword ? '••••••••••••••••' : '❌ NOT SET'}`);
  console.log(` • IS_MOCK_MODE         : ${config.integrations.isMockMode}\n`);

  // Path A: Google Mail API (OAuth2 Refresh Token)
  if (gmailRefreshToken && clientId && clientSecret) {
    console.log('Testing official Google Mail API (OAuth2)...');
    try {
      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
      oauth2Client.setCredentials({ refresh_token: gmailRefreshToken });
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      const profile = await gmail.users.getProfile({ userId: 'me' });
      const sender = profile.data.emailAddress || userEmail;
      console.log(`✅ Google Mail API Connected Successfully!`);
      console.log(`   Authenticated Account: ${sender}`);

      const targetEmail = process.argv[2] || sender;
      console.log(`\nDispatching test email to ${targetEmail} via Google Mail API...`);

      const raw = createMimeMessage(
        targetEmail,
        `"Human Shelter Realty" <${sender}>`,
        '✅ Google Mail API Integration Active - Human Shelter Realty',
        `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 8px; background: #ffffff;">
          <h2 style="color: #0F766E; margin-top: 0;">Google Mail API Connected</h2>
          <p style="color: #1E293B; font-size: 14px; line-height: 1.5;">
            Your platform is now connected via the official <strong>Google Mail Cloud API</strong>.
          </p>
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 12px; margin: 16px 0; font-size: 12px; font-family: monospace; color: #64748B;">
            Account: ${sender}<br>
            Timestamp: ${new Date().toISOString()}<br>
            Method: Google Mail API (v1)
          </div>
          <p style="color: #64748B; font-size: 12px; margin-bottom: 0;">
            Agent onboarding invitations, inquiries, and tour notifications will now be delivered live.
          </p>
        </div>
        `
      );

      const res = await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw },
      });

      console.log(`✅ Test email delivered successfully via Google Mail API!`);
      console.log(`   Message ID: ${res.data.id}`);
      console.log('================================================================\n');
      process.exit(0);
    } catch (err: any) {
      console.error('❌ Google Mail API Error:', err.message);
      process.exit(1);
    }
  }

  // Path B: Google SMTP (App Password)
  if (userEmail && appPassword) {
    console.log('Testing Google SMTP (App Password)...');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: userEmail, pass: appPassword },
    });

    try {
      await transporter.verify();
      console.log('✅ SMTP Connection & Authentication Successful!');
      const targetEmail = process.argv[2] || userEmail;
      console.log(`Sending test email to ${targetEmail}...`);

      const info = await transporter.sendMail({
        from: `"Human Shelter Realty" <${userEmail}>`,
        to: targetEmail,
        subject: '✅ Google Mail SMTP Configuration Test - Human Shelter Realty',
        html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 8px; background: #ffffff;">
          <h2 style="color: #0F766E; margin-top: 0;">Google Mail SMTP Active</h2>
          <p style="color: #1E293B; font-size: 14px; line-height: 1.5;">
            Your platform is now connected via Google SMTP.
          </p>
        </div>
        `,
      });

      console.log(`✅ Test email delivered successfully via SMTP! (ID: ${info.messageId})`);
      process.exit(0);
    } catch (err: any) {
      console.error('❌ Google SMTP Error:', err.message);
      process.exit(1);
    }
  }

  // Neither configured
  console.log('❌ Neither Google Mail API nor Google SMTP credentials are fully configured.\n');
  console.log('To authenticate via the official Google Mail API:');
  console.log(' 👉 Run: npm run gmail:auth\n');
  console.log('Or to authenticate via Google App Password:');
  console.log(' 👉 Add GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx to backend/.env\n');
  process.exit(1);
}

testGmail();
