import { createClient, SupabaseClient } from '@supabase/supabase-js';
import config from './index';
import logger from '../utils/logger';

export const isSupabaseConfigured = Boolean(
  config.supabaseUrl &&
  config.supabaseAnonKey &&
  !config.supabaseUrl.includes('your-project')
);

if (!isSupabaseConfigured) {
  logger.warn(
    'Supabase credentials are missing or unconfigured in environment. Please update your .env file with live credentials.'
  );
}

const fallbackUrl = 'https://placeholder.supabase.co';
const fallbackKey = 'placeholder-key';

export const supabase: SupabaseClient = createClient(
  config.supabaseUrl || fallbackUrl,
  config.supabaseAnonKey || fallbackKey
);

export const supabaseAdmin: SupabaseClient = createClient(
  config.supabaseUrl || fallbackUrl,
  config.supabaseServiceRoleKey || config.supabaseAnonKey || fallbackKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export default supabase;
