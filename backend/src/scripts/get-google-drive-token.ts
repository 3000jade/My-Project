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
    scope: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive'],
  });

  console.log('\n================================================================');
  console.log('   Google Drive Personal Account Authorization (15GB Quota)     ');
  console.log('================================================================\n');
  console.log('1. Open this URL in your browser:\n');
  console.log(authUrl);
  console.log('\n2. Sign in with the Google Account that owns your Drive folder.');
  console.log('3. Grant Drive permissions.\n');
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
        res.end('<h3>Access token received, but no refresh token returned. (If you already authorized, revoke app access and try again with prompt=consent).</h3>');
        console.warn('\nWarning: Google did not return a refresh_token. Make sure prompt=consent is used.');
        server.close();
        return;
      }

      // Save to backend/.env
      const envPath = path.resolve(__dirname, '../../.env');
      let envContent = '';
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }

      if (envContent.includes('GOOGLE_DRIVE_REFRESH_TOKEN=')) {
        envContent = envContent.replace(
          /GOOGLE_DRIVE_REFRESH_TOKEN=.*/,
          `GOOGLE_DRIVE_REFRESH_TOKEN=${refreshToken}`
        );
      } else {
        envContent += `\n# Google Drive OAuth2 Refresh Token (Personal Storage)\nGOOGLE_DRIVE_REFRESH_TOKEN=${refreshToken}\n`;
      }

      fs.writeFileSync(envPath, envContent, 'utf8');

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <div style="font-family:sans-serif;padding:40px;text-align:center;">
          <h2 style="color:#0D4446;">Authorization Successful!</h2>
          <p>GOOGLE_DRIVE_REFRESH_TOKEN has been automatically saved to your backend/.env.</p>
          <p>You can close this tab and return to the terminal.</p>
        </div>
      `);

      console.log('\nSUCCESS! GOOGLE_DRIVE_REFRESH_TOKEN has been saved to backend/.env.');
      console.log('Your backend is now ready to upload images to Google Drive using your personal 15GB+ storage quota!\n');

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
