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

const isValidHttpUrl = (url?: string): boolean => {
  if (!url) return false;
  return /^https?:\/\//i.test(url);
};

const fallbackUrl = 'https://placeholder.supabase.co';
const fallbackKey = 'placeholder-key';

const resolvedUrl = isValidHttpUrl(config.supabaseUrl) ? config.supabaseUrl : fallbackUrl;
if (config.supabaseUrl && !isValidHttpUrl(config.supabaseUrl)) {
  logger.error(`Invalid SUPABASE_URL format "${config.supabaseUrl}". Expected a valid http:// or https:// URL. Using fallback.`);
}

export const supabase: SupabaseClient = createClient(
  resolvedUrl,
  config.supabaseAnonKey || fallbackKey
);

export const supabaseAdmin: SupabaseClient = createClient(
  resolvedUrl,
  config.supabaseServiceRoleKey || config.supabaseAnonKey || fallbackKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export default supabase;
