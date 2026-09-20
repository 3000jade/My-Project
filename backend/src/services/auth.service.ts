import { supabase, supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import logger from '../utils/logger';

export interface AuthResult {
  user: {
    id: string;
    email?: string;
    role?: string;
    fullName?: string;
    [key: string]: any;
  };
  token?: string;
}

export class AuthService {
  /**
   * Authenticate a user using Email and Password via Supabase
   */
  public static async signIn(email: string, password: string): Promise<AuthResult> {
    if (!isSupabaseConfigured) {
      logger.warn('[AuthService] Supabase not configured. Returning local development mock session.');
      const role = email.includes('broker') || email.includes('admin') ? 'broker' : 'agent';
      return {
        user: {
          id: 'dev-mock-uid-12345',
          email,
          role,
          fullName: 'Development User',
        },
        token: 'dev-mock-jwt-token-12345',
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user || !data.session) {
      throw new Error(error?.message || 'Invalid credentials.');
    }

    // Attempt to fetch profile for role
    let role = data.user.user_metadata?.role || 'agent';
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role, full_name')
        .eq('id', data.user.id)
        .single();

      if (profile?.role) {
        role = profile.role;
      }
    } catch {
      // Fall back to user_metadata
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        role,
        fullName: data.user.user_metadata?.full_name,
        userMetadata: data.user.user_metadata,
      },
      token: data.session.access_token,
    };
  }

  /**
   * Register a new user with Email, Password, and Profile metadata
   */
  public static async signUp(
    email: string,
    password: string,
    metadata: { fullName?: string; role?: string } = {}
  ): Promise<AuthResult> {
    if (!isSupabaseConfigured) {
      logger.warn('[AuthService] Supabase not configured. Returning local development mock registration.');
      return {
        user: {
          id: 'dev-mock-uid-registered',
          email,
          role: metadata.role || 'agent',
          fullName: metadata.fullName || 'New User',
        },
        token: 'dev-mock-jwt-token-registered',
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: metadata.fullName,
          role: metadata.role || 'agent',
        },
      },
    });

    if (error || !data.user) {
      throw new Error(error?.message || 'Registration failed.');
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        role: metadata.role || 'agent',
        fullName: metadata.fullName,
      },
      token: data.session?.access_token,
    };
  }

  /**
   * Get user profile details
   */
  public static async getUserProfile(userId: string) {
    if (!isSupabaseConfigured) {
      return {
        id: userId,
        email: 'dev@pt.com',
        role: 'agent',
        fullName: 'Development Agent',
      };
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      logger.warn(`Could not load profile for user ${userId}:`, error.message);
      return null;
    }

    return data;
  }

  /**
   * Sign out user session
   */
  public static async signOut(token?: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.auth.signOut();
    } catch (err: any) {
      logger.warn('Sign out warning:', err.message);
    }
  }
}

export default AuthService;
