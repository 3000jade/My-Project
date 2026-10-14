import { google } from 'googleapis';
import config from '../config';

export interface DriveHealthReport {
  isConfigured: boolean;
  serviceAccountEmail?: string;
  authMethod: 'SERVICE_ACCOUNT' | 'OAUTH2_REFRESH_TOKEN' | 'NONE';
  rootFolderId: string;
  folderName?: string;
  folderCanAddChildren?: boolean;
  writeTest?: {
    success: boolean;
    fileId?: string;
    error?: string;
  };
  latencyMs?: number;
  status: 'CONNECTED' | 'MOCK_DEV' | 'ERROR';
  storageQuota?: {
    limit?: string;
    usage?: string;
    usageInDrive?: string;
  };
  serviceAccountName?: string;
  message: string;
}

export async function checkGoogleDriveHealth(): Promise<DriveHealthReport> {
  const {
    googleDriveServiceAccountEmail,
    googleDrivePrivateKey,
    googleDriveRootFolderId,
    googleDriveRefreshToken,
    googleClientId,
    googleClientSecret,
  } = config.integrations;

  const hasSA = Boolean(googleDriveServiceAccountEmail && googleDrivePrivateKey);
  const hasOAuth = Boolean(googleDriveRefreshToken && googleClientId && googleClientSecret);

  const report: DriveHealthReport = {
    isConfigured: hasSA || hasOAuth,
    authMethod: hasOAuth ? 'OAUTH2_REFRESH_TOKEN' : (hasSA ? 'SERVICE_ACCOUNT' : 'NONE'),
    serviceAccountEmail: googleDriveServiceAccountEmail || undefined,
    rootFolderId: googleDriveRootFolderId || 'Default Root Drive',
    status: 'MOCK_DEV',
    message: '',
  };

  if (!report.isConfigured) {
    report.status = 'MOCK_DEV';
    report.message =
      'Google Drive credentials not detected in .env. The backend is running in resilient local development mock mode.';
    return report;
  }

  const start = Date.now();

  try {
    let drive: any;

    if (hasOAuth) {
      const oauth2 = new google.auth.OAuth2(googleClientId, googleClientSecret);
      oauth2.setCredentials({ refresh_token: googleDriveRefreshToken });
      drive = google.drive({ version: 'v3', auth: oauth2 });
    } else {
      const auth = new google.auth.JWT({
        email: googleDriveServiceAccountEmail,
        key: googleDrivePrivateKey,
        scopes: ['https://www.googleapis.com/auth/drive'],
      });
      drive = google.drive({ version: 'v3', auth });
    }

    // 1. Verify Drive API clearance and storage quota
    const aboutRes = await drive.about.get({
      fields: 'user, storageQuota',
    });

    report.latencyMs = Date.now() - start;
    report.serviceAccountName = aboutRes.data.user?.displayName || (hasOAuth ? 'Authenticated Google User' : 'Google Cloud Service Account');

    if (aboutRes.data.storageQuota) {
      const q = aboutRes.data.storageQuota;
      const formatBytes = (bytes?: string | null) => {
        if (!bytes) return 'Unlimited / Shared';
        const num = parseInt(bytes, 10);
        return `${(num / (1024 * 1024 * 1024)).toFixed(2)} GB`;
      };

      report.storageQuota = {
        limit: formatBytes(q.limit),
        usage: formatBytes(q.usage),
        usageInDrive: formatBytes(q.usageInDrive),
      };
    }

    // 2. Check root folder accessibility if specified
    if (googleDriveRootFolderId) {
      const folderRes = await drive.files.get({
        fileId: googleDriveRootFolderId,
        supportsAllDrives: true,
        fields: 'id, name, capabilities',
      });
      report.folderName = folderRes.data.name;
      report.folderCanAddChildren = folderRes.data.capabilities?.canAddChildren;
    }

    // 3. Test upload and deletion capability (write probe)
    try {
      const { Readable } = await import('stream');
      const probeStream = new Readable();
      probeStream.push('CP_kerby Luxury Architectural Platform - Google Drive API probe test');
      probeStream.push(null);

      const probeRes = await drive.files.create({
        supportsAllDrives: true,
        requestBody: {
          name: `cp_kerby_probe_${Date.now()}.txt`,
          parents: googleDriveRootFolderId ? [googleDriveRootFolderId] : undefined,
        },
        media: {
          mimeType: 'text/plain',
          body: probeStream,
        },
        fields: 'id, name',
      });

      if (probeRes.data.id) {
        report.writeTest = {
          success: true,
          fileId: probeRes.data.id,
        };
        // Clean up probe file immediately
        await drive.files.delete({
          fileId: probeRes.data.id,
          supportsAllDrives: true,
        });
      }
    } catch (writeErr: any) {
      report.writeTest = {
        success: false,
        error: writeErr.message,
      };
    }

    report.status = 'CONNECTED';
    report.message = `Successfully authenticated with Google Drive API v3 in ${report.latencyMs}ms.`;
  } catch (err: any) {
    report.status = 'ERROR';
    report.message = `Google Drive connection error: ${err.message}`;
  }

  return report;
}

async function run() {
  console.log('\n================================================================');
  console.log('  CP_kerby Luxury Architectural Platform - Google Drive Check   ');
  console.log('================================================================\n');

  const report = await checkGoogleDriveHealth();

  console.log(`Connection Status   : ${report.status}`);
  console.log(`Auth Method         : ${report.authMethod}`);
  if (report.serviceAccountEmail) {
    console.log(`Service Account     : ${report.serviceAccountEmail}`);
  }
  if (report.serviceAccountName) {
    console.log(`Account Display Name: ${report.serviceAccountName}`);
  }
  console.log(`Target Folder ID    : ${report.rootFolderId}${report.folderName ? ` ("${report.folderName}")` : ''}`);
  if (report.folderCanAddChildren !== undefined) {
    console.log(`Folder Add Permission: ${report.folderCanAddChildren ? 'YES (Can add files)' : 'NO (Read only)'}`);
  }
  if (report.writeTest) {
    if (report.writeTest.success) {
      console.log(`Write Probe Test    : PASSED (File created & deleted successfully: ${report.writeTest.fileId})`);
    } else {
      console.log(`Write Probe Test    : FAILED (${report.writeTest.error})`);
    }
  }
  if (report.latencyMs !== undefined) {
    console.log(`API Ping Latency    : ${report.latencyMs}ms`);
  }
  if (report.storageQuota) {
    console.log(`Storage Limit       : ${report.storageQuota.limit}`);
    console.log(`Current Drive Usage : ${report.storageQuota.usageInDrive}`);
  }
  console.log(`Diagnosis           : ${report.message}\n`);

  if (report.status === 'CONNECTED' && report.authMethod === 'SERVICE_ACCOUNT') {
    console.log('Note on Service Account uploads:');
    console.log('- If uploading to a Google Workspace Shared Drive, uploads succeed with Shared Drive quota.');
    console.log('- If using a personal @gmail.com Drive folder, Google restricts Service Account quota to 0 bytes.');
    console.log('  To use personal Drive, provide GOOGLE_DRIVE_REFRESH_TOKEN in backend/.env.');
  }

  console.log('\n================================================================\n');
}

if (process.argv[1]?.includes('test-google-drive')) {
  run().catch(console.error);
}
