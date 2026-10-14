import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN
    ? (process.env.CLIENT_ORIGIN.includes(',')
        ? process.env.CLIENT_ORIGIN.split(',').map((s) => s.trim())
        : process.env.CLIENT_ORIGIN)
    : 'http://localhost:5173',
  isProduction: process.env.NODE_ENV === 'production',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '',
  xaiApiKey: process.env.XAI_API_KEY || '',
  groqApiKey: process.env.GROQ_API_KEY || (process.env.XAI_API_KEY?.startsWith('gsk_') ? process.env.XAI_API_KEY : ''),
  aiModel: process.env.AI_MODEL || '',
  integrations: {
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    googleDriveServiceAccountEmail: process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL || '',
    googleDrivePrivateKey: (process.env.GOOGLE_DRIVE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    googleDriveRootFolderId: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || '',
    gmailUserEmail: process.env.GMAIL_USER_EMAIL || '',
    gmailAppPassword: (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, ''),
    gmailRefreshToken: process.env.GMAIL_REFRESH_TOKEN || '',
    whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'cp_kerby_whatsapp_verify_token',
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
    nominatimBaseUrl: process.env.NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org',
    nominatimUserAgent: process.env.NOMINATIM_USER_AGENT || 'CP_kerby_Platform/1.0 (concierge@cpkerby.luxury)',
    nominatimMockMode: process.env.NOMINATIM_MOCK_MODE === 'true',
    googleDriveRefreshToken: process.env.GOOGLE_DRIVE_REFRESH_TOKEN || '',
    isGoogleDriveConfigured: Boolean(
      (process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_DRIVE_PRIVATE_KEY) ||
      process.env.GOOGLE_DRIVE_REFRESH_TOKEN
    ),
    googleDriveMockMode:
      process.env.GOOGLE_DRIVE_MOCK_MODE === 'true' ||
      process.env.NODE_ENV === 'test' ||
      Boolean(process.env.VITEST) ||
      !(
        (process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_DRIVE_PRIVATE_KEY) ||
        process.env.GOOGLE_DRIVE_REFRESH_TOKEN
      ),
    isMockMode:
      process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST)
        ? true
        : (process.env.IS_MOCK_MODE !== undefined
          ? process.env.IS_MOCK_MODE === 'true'
          : (process.env.NODE_ENV !== 'production' || !process.env.GOOGLE_CLIENT_ID)),
  },
};

export default config;
