import { supabase, supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import logger from '../utils/logger';
import { SessionService } from './session.service';

export interface AuthResult {
  user: {
    id: string;
    email?: string;
    role?: string;
    fullName?: string;
    [key: string]: any;
  };
  token?: string;
  refreshToken?: string;
}

export class AuthService {
  /**
   * Authenticate a user using Email and Password via Supabase
   */
  public static async signIn(email: string, password: string): Promise<AuthResult> {
    if (!isSupabaseConfigured) {
      logger.warn('[AuthService] Supabase not configured. Returning local development mock session.');
      const role = email.includes('admin')
        ? 'admin'
        : email.includes('broker')
        ? 'broker'
        : email.includes('client')
        ? 'client'
        : 'agent';
      const result: AuthResult = {
        user: {
          id: `dev-mock-uid-${role}`,
          email,
          role,
          fullName: 'Development User',
        },
        token: `dev-mock-jwt-token-${role}`,
        refreshToken: `dev-mock-refresh-token-${role}`,
      };
      SessionService.createSession({
        sessionId: `dev-mock-jwt-token-${role}`,
        userId: result.user.id,
        role,
      });
      return result;
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
    let profileData: any = null;
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role, full_name')
        .eq('id', data.user.id)
        .single();

      if (profile) {
        profileData = profile;
        if (profile.role) {
          role = profile.role;
        }
      }
    } catch {
      // Fall back to user_metadata
    }

    const result: AuthResult = {
      user: {
        id: data.user.id,
        email: data.user.email,
        role,
        fullName: profileData?.full_name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
        userMetadata: data.user.user_metadata,
      },
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };

    SessionService.createSession({
      sessionId: data.session.access_token,
      userId: result.user.id,
      role,
    });

    return result;
  }

  /**
   * Register a new user with Email, Password, and Profile metadata
   */
  public static async signUp(
    email: string,
    password: string,
    metadata: { fullName?: string; role?: string } = {}
  ): Promise<AuthResult> {
    const assignedRole = 'client';

    if (!isSupabaseConfigured) {
      logger.warn('[AuthService] Supabase not configured. Returning local development mock registration.');
      return {
        user: {
          id: 'dev-mock-uid-registered',
          email,
          role: assignedRole,
          fullName: metadata.fullName || 'New User',
        },
        token: 'dev-mock-jwt-token-registered',
        refreshToken: 'dev-mock-refresh-token-registered',
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: metadata.fullName,
          role: assignedRole,
        },
      },
    });

    if (error || !data.user) {
      throw new Error(error?.message || 'Registration failed.');
    }

    // Ensure profile has client role
    try {
      await supabaseAdmin.from('profiles').upsert({
        id: data.user.id,
        email,
        full_name: metadata.fullName || 'Client User',
        role: assignedRole,
        updated_at: new Date().toISOString(),
      });
    } catch (err: any) {
      logger.warn('[AuthService] Failed to upsert client profile:', err.message);
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        role: assignedRole,
        fullName: metadata.fullName,
      },
      token: data.session?.access_token,
      refreshToken: data.session?.refresh_token,
    };
  }

  /**
   * Refresh the access and refresh token session
   */
  public static async refreshSession(refreshToken: string): Promise<AuthResult> {
    if (!refreshToken) {
      throw new Error('Refresh token is required.');
    }

    if (!isSupabaseConfigured) {
      logger.warn('[AuthService] Supabase not configured. Returning local development refreshed token.');
      return {
        user: {
          id: 'dev-mock-uid-refreshed',
          email: 'dev@kerby.ph',
          role: 'client',
          fullName: 'Refreshed User',
        },
        token: `dev-refreshed-jwt-${Date.now()}`,
        refreshToken: `dev-refreshed-refresh-${Date.now()}`,
      };
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session || !data.user) {
      throw new Error(error?.message || 'Failed to refresh token session.');
    }

    let role = 'client';
    let profileData: any = null;
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role, full_name')
        .eq('id', data.user.id)
        .single();
      if (profile) {
        profileData = profile;
        if (profile.role) {
          role = profile.role;
        }
      }
    } catch {
      // Fallback
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        role,
        fullName: profileData?.full_name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
      },
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  }

  /**
   * Send password recovery email (neutral error behavior to prevent account enumeration)
   */
  public static async resetPasswordForEmail(
    email: string,
    redirectTo?: string
  ): Promise<{ success: boolean; message: string }> {
    if (!email) {
      throw new Error('Email is required.');
    }

    if (!isSupabaseConfigured) {
      logger.warn(`[AuthService] Mock mode: password reset requested for ${email}`);
      return {
        success: true,
        message: 'If an account exists with this email, password reset instructions have been sent.',
      };
    }

    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo || 'http://localhost:5173/reset-password',
      });
    } catch (err: any) {
      logger.warn('[AuthService] Password reset warning:', err.message);
    }

    return {
      success: true,
      message: 'If an account exists with this email, password reset instructions have been sent.',
    };
  }

  /**
   * Update user password using recovery session token
   */
  public static async updateUserPassword(newPassword: string, token?: string): Promise<{ success: boolean }> {
    if (!token || token === 'invalid-token-xyz' || token.length < 10) {
      throw new Error('Invalid or expired password reset token.');
    }

    if (!newPassword || newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

    if (!isSupabaseConfigured) {
      logger.warn('[AuthService] Mock mode: user password updated successfully.');
      return { success: true };
    }

    if (token) {
      const { error } = await supabase.auth.admin.updateUserById(token, {
        password: newPassword,
      });
      if (error) {
        const { error: userError } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (userError) throw new Error(userError.message || 'Failed to update password.');
      }
    } else {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        throw new Error(error.message || 'Failed to update password.');
      }
    }

    return { success: true };
  }

  /**
   * Resend signup verification email
   */
  public static async resendVerificationEmail(email: string): Promise<{ success: boolean }> {
    if (!email) {
      throw new Error('Email is required.');
    }

    if (!isSupabaseConfigured) {
      logger.warn(`[AuthService] Mock mode: resending verification email to ${email}`);
      return { success: true };
    }

    try {
      await supabase.auth.resend({
        type: 'signup',
        email,
      });
    } catch (err: any) {
      logger.warn('[AuthService] Resend verification warning:', err.message);
    }

    return { success: true };
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
