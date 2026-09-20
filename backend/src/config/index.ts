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
};

export default config;
