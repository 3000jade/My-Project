import { google } from 'googleapis';
import config from '../config';

export interface DriveHealthReport {
  isConfigured: boolean;
  serviceAccountEmail: string;
  rootFolderId: string;
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
  const { googleDriveServiceAccountEmail, googleDrivePrivateKey, googleDriveRootFolderId, isMockMode } =
    config.integrations;

  const report: DriveHealthReport = {
    isConfigured: Boolean(googleDriveServiceAccountEmail && googleDrivePrivateKey),
    serviceAccountEmail: googleDriveServiceAccountEmail || 'Not configured',
    rootFolderId: googleDriveRootFolderId || 'Default Root Drive',
    status: 'MOCK_DEV',
    message: '',
  };

  if (!report.isConfigured || isMockMode) {
    report.status = 'MOCK_DEV';
    report.message =
      'Google Drive credentials not detected in .env. The backend is running in resilient local development mock mode (all uploads, listings, and property_media sync simulate smoothly).';
    return report;
  }

  const start = Date.now();

  try {
    const auth = new google.auth.JWT({
      email: googleDriveServiceAccountEmail,
      key: googleDrivePrivateKey,
      scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive.metadata.readonly'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // 1. Verify Drive API clearance and storage quota
    const aboutRes = await drive.about.get({
      fields: 'user, storageQuota',
    });

    report.latencyMs = Date.now() - start;
    report.serviceAccountName = aboutRes.data.user?.displayName || 'Google Cloud Service Account';

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
      await drive.files.get({
        fileId: googleDriveRootFolderId,
        fields: 'id, name, capabilities',
      });
    }

    report.status = 'CONNECTED';
    report.message = `Successfully authenticated with Google Drive API v3 in ${report.latencyMs}ms.`;
  } catch (err: any) {
    report.status = 'ERROR';
    report.message = `Google Drive authentication failed: ${err.message}`;
  }

  return report;
}

async function run() {
  console.log('\n================================================================');
  console.log('  CP_kerby Luxury Architectural Platform - Google Drive Check   ');
  console.log('================================================================\n');

  const report = await checkGoogleDriveHealth();

  console.log(`Connection Status   : ${report.status}`);
  console.log(`Service Account     : ${report.serviceAccountEmail}`);
  if (report.serviceAccountName) {
    console.log(`Account Display Name: ${report.serviceAccountName}`);
  }
  console.log(`Target Folder ID    : ${report.rootFolderId}`);
  if (report.latencyMs !== undefined) {
    console.log(`API Ping Latency    : ${report.latencyMs}ms`);
  }
  if (report.storageQuota) {
    console.log(`Storage Limit       : ${report.storageQuota.limit}`);
    console.log(`Current Drive Usage : ${report.storageQuota.usageInDrive}`);
  }
  console.log(`Diagnosis           : ${report.message}\n`);

  if (report.status === 'MOCK_DEV') {
    console.log('----------------------------------------------------------------');
    console.log('To connect live Google Drive credentials, add these to backend/.env:');
    console.log('  GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL=your-sa@project.iam.gserviceaccount.com');
    console.log('  GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----"');
    console.log('  GOOGLE_DRIVE_ROOT_FOLDER_ID=your-folder-id-from-google-drive-url');
    console.log('----------------------------------------------------------------');
  }

  console.log('\n================================================================\n');
}

if (process.argv[1]?.includes('test-google-drive')) {
  run().catch(console.error);
}
