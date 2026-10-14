import { google } from 'googleapis';
import config from '../config';

async function checkMsg() {
  const messageId = process.argv[2] || '1a13a4b1e8393392';
  const oauth2 = new google.auth.OAuth2(
    config.integrations.googleClientId,
    config.integrations.googleClientSecret
  );
  oauth2.setCredentials({ refresh_token: config.integrations.gmailRefreshToken });
  const gmail = google.gmail({ version: 'v1', auth: oauth2 });

  try {
    const res = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    console.log('================================================================');
    console.log('   Google Mail API Message Investigation Report                 ');
    console.log('================================================================');
    console.log(` • Message ID  : ${res.data.id}`);
    console.log(` • Thread ID   : ${res.data.threadId}`);
    console.log(` • Label IDs   : ${JSON.stringify(res.data.labelIds)}`);
    console.log(` • Snippet     : ${res.data.snippet}`);

    const headers = res.data.payload?.headers || [];
    const getHeader = (name: string) => headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value;

    console.log(` • From        : ${getHeader('From')}`);
    console.log(` • To          : ${getHeader('To')}`);
    console.log(` • Subject     : ${getHeader('Subject')}`);
    console.log(` • Date        : ${getHeader('Date')}`);
    console.log(` • Message-ID  : ${getHeader('Message-ID')}`);
    console.log('================================================================\n');
  } catch (err: any) {
    console.error('Error fetching message details from Google Mail API:', err.message);
  }
}

checkMsg();
