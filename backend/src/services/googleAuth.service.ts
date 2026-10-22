import { OAuth2Client } from 'google-auth-library';
import { config } from '../config';
import { supabase, supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import logger from '../utils/logger';
import type { AuthResult } from './auth.service';

const oauth2Client = new OAuth2Client(config.integrations.googleClientId);

export class GoogleAuthService {
  public static async verifyAndAuthenticate(
    idToken: string,
    requestedRole: 'client' | 'agent' | 'broker' = 'client'
  ): Promise<AuthResult> {
    // 1. Check for mock/dev tokens, non-JWT test payloads, or unconfigured credentials
    const isJwt = idToken.includes('.') && idToken.split('.').length === 3 && idToken.length > 50;
    const isMock = !isJwt || idToken.startsWith('mock-') || idToken.startsWith('dev-mock-') || !config.integrations.googleClientId;

    if (isMock) {
      logger.warn('[GoogleAuthService] Mock mode active: generating mock Google user session.');
      const sanitizedEmail = requestedRole === 'broker'
        ? 'broker.google@luxuryrealty.test'
        : (requestedRole === 'agent' ? 'agent.google@luxuryrealty.test' : 'client.google@luxuryrealty.test');

      return {
        user: {
          id: `dev-google-mock-uid-${requestedRole}`,
          email: sanitizedEmail,
          fullName: 'Alexander Wright (Google)',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
          role: requestedRole,
        },
        token: `dev-mock-jwt-token-google-${requestedRole}`,
      };
    }

    // 2. Verify Google ID token
    const ticket = await oauth2Client.verifyIdToken({
      idToken,
      audience: config.integrations.googleClientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error('Invalid Google ID token.');
    }

    const { email, name, picture, sub: googleId } = payload;
    const safeRole = requestedRole === 'broker' ? 'broker' : (requestedRole === 'agent' ? 'agent' : 'client');

    if (!isSupabaseConfigured) {
      return {
        user: {
          id: googleId,
          email,
          fullName: name || 'Google User',
          avatarUrl: picture || '',
          role: safeRole,
        },
        token: `mock-token-${googleId}`,
      };
    }

    // 3. Check existing profile or provision new account in Supabase
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    let userId: string;
    let finalRole: string;
    let finalFullName: string = name || 'Google User';
    let finalAvatarUrl: string = picture || '';

    if (existingProfile) {
      userId = existingProfile.id;
      // Preserve existing database role to prevent privilege escalation or accidental demotion
      finalRole = existingProfile.role;
      finalFullName = existingProfile.full_name || name || 'Google User';
      finalAvatarUrl = existingProfile.avatar_url || picture || '';

      // Auto-populate supported fields from Google metadata if previously missing
      const updates: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (!existingProfile.avatar_url && picture) {
        updates.avatar_url = picture;
      }
      if (!existingProfile.full_name && name) {
        updates.full_name = name;
      }

      if (Object.keys(updates).length > 1) {
        await supabaseAdmin
          .from('profiles')
          .update(updates)
          .eq('id', userId);
      }
    } else {
      // Provision user in auth.users
      finalRole = safeRole;
      try {
        const { data: createdAuthUser, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: {
            full_name: name || 'Google User',
            avatar_url: picture || '',
            role: safeRole,
          },
        });

        if (authCreateError) {
          // If user exists in auth.users but profile was missing, recover auth id
          const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
          const matched = usersList?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
          if (matched) {
            userId = matched.id;
          } else {
            throw new Error(authCreateError.message);
          }
        } else {
          userId = createdAuthUser.user.id;
        }
      } catch (err: any) {
        logger.error(`[GoogleAuthService] Failed to provision auth user: ${err.message}`);
        throw new Error(`Profile synchronization failed: ${err.message}`);
      }

      // Ensure profile record is populated
      await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          email,
          full_name: finalFullName,
          avatar_url: finalAvatarUrl,
          role: safeRole,
          updated_at: new Date().toISOString(),
        });
    }

    // 4. Generate Supabase session token
    let sessionToken = `token-google-${userId}`;
    try {
      const linkRes = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email,
      });

      if (linkRes.data?.properties?.hashed_token) {
        const verifyRes = await supabase.auth.verifyOtp({
          token_hash: linkRes.data.properties.hashed_token,
          type: 'magiclink',
        });

        if (verifyRes.data?.session?.access_token) {
          sessionToken = verifyRes.data.session.access_token;
        }
      }
    } catch (sessionErr: any) {
      logger.warn('[GoogleAuthService] Fallback to direct token format:', sessionErr.message);
    }

    return {
      user: {
        id: userId,
        email,
        fullName: finalFullName,
        avatarUrl: finalAvatarUrl,
        role: finalRole,
      },
      token: sessionToken,
    };
  }
}

export default GoogleAuthService;
