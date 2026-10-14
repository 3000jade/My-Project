import http from 'http';
import { URL } from 'url';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import config from '../config';

const PORT = 5005;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

async function main() {
  const clientId = config.integrations.googleClientId;
  const clientSecret = config.integrations.googleClientSecret;

  if (!clientId || !clientSecret) {
    console.error('ERROR: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in backend/.env');
    process.exit(1);
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.compose',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
  });

  console.log('\n================================================================');
  console.log('      Human Shelter Realty | Google Mail API Authorization      ');
  console.log('================================================================\n');
  console.log('1. Open this URL in your browser:\n');
  console.log(authUrl);
  console.log('\n2. Sign in with the Google Account you want to send emails from.');
  console.log('3. Click "Allow" to grant Gmail sending permission.\n');
  console.log(`Waiting for authorization callback on http://localhost:${PORT}...`);

  const server = http.createServer(async (req, res) => {
    try {
      if (!req.url?.startsWith('/oauth2callback')) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
      const code = parsedUrl.searchParams.get('code');

      if (!code) {
        res.writeHead(400);
        res.end('Authorization code missing.');
        return;
      }

      const { tokens } = await oauth2Client.getToken(code);
      const refreshToken = tokens.refresh_token;

      if (!refreshToken) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h3>Access token received, but no refresh token returned. Revoke app access or try again with prompt=consent.</h3>');
        console.warn('\nWarning: Google did not return a refresh_token.');
        server.close();
        return;
      }

      // Retrieve authorized email address
      oauth2Client.setCredentials(tokens);
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      let userEmail = '';
      try {
        const userInfo = await oauth2.userinfo.get();
        userEmail = userInfo.data.email || '';
      } catch {
        // Non-critical if userinfo scope isn't granted
      }

      // Save to backend/.env
      const envPath = path.resolve(__dirname, '../../.env');
      let envContent = '';
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }

      if (envContent.includes('GMAIL_REFRESH_TOKEN=')) {
        envContent = envContent.replace(
          /GMAIL_REFRESH_TOKEN=.*/,
          `GMAIL_REFRESH_TOKEN=${refreshToken}`
        );
      } else {
        envContent += `\nGMAIL_REFRESH_TOKEN=${refreshToken}\n`;
      }

      if (userEmail) {
        if (envContent.includes('GMAIL_USER_EMAIL=')) {
          envContent = envContent.replace(
            /GMAIL_USER_EMAIL=.*/,
            `GMAIL_USER_EMAIL=${userEmail}`
          );
        } else {
          envContent += `GMAIL_USER_EMAIL=${userEmail}\n`;
        }
      }

      fs.writeFileSync(envPath, envContent, 'utf8');

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <div style="font-family:sans-serif;padding:40px;text-align:center;">
          <h2 style="color:#0F766E;">Google Mail API Authorization Successful!</h2>
          <p><strong>GMAIL_REFRESH_TOKEN</strong> has been automatically saved to your backend/.env.</p>
          ${userEmail ? `<p>Authorized email: <strong>${userEmail}</strong></p>` : ''}
          <p>You can close this tab and return to your terminal.</p>
        </div>
      `);

      console.log('\n✅ SUCCESS! GMAIL_REFRESH_TOKEN has been saved to backend/.env.');
      if (userEmail) {
        console.log(` • Authorized Account: ${userEmail}`);
      }
      console.log('Your backend is now ready to send emails using the Google Mail API!\n');

      setTimeout(() => {
        server.close();
        process.exit(0);
      }, 1500);
    } catch (err: any) {
      res.writeHead(500);
      res.end(`Error: ${err.message}`);
      console.error('Error handling oauth callback:', err.message);
    }
  });

  server.listen(PORT);
}

main().catch(console.error);
