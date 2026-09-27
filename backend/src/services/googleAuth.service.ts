import { OAuth2Client } from 'google-auth-library';
import { config } from '../config';
import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import logger from '../utils/logger';
import type { AuthResult } from './auth.service';

const oauth2Client = new OAuth2Client(config.integrations.googleClientId);

export class GoogleAuthService {
  public static async verifyAndAuthenticate(
    idToken: string,
    requestedRole: 'client' | 'agent' | 'broker' = 'client'
  ): Promise<AuthResult> {
    if (config.integrations.isMockMode || !config.integrations.googleClientId) {
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

    const ticket = await oauth2Client.verifyIdToken({
      idToken,
      audience: config.integrations.googleClientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error('Invalid Google ID token.');
    }

    const { email, name, picture, sub: googleId } = payload;

    if (!isSupabaseConfigured) {
      return {
        user: {
          id: googleId,
          email,
          fullName: name,
          avatarUrl: picture,
          role: requestedRole,
        },
        token: `mock-token-${googleId}`,
      };
    }

    // Check existing profile or upsert
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    let userId = existingProfile?.id;
    let role = existingProfile?.role || requestedRole;

    if (!existingProfile) {
      const { data: newProfile, error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          email,
          full_name: name,
          avatar_url: picture,
          role,
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Profile synchronization failed: ${insertError.message}`);
      }
      userId = newProfile.id;
    }

    return {
      user: {
        id: userId,
        email,
        fullName: name,
        avatarUrl: picture,
        role,
      },
      token: `token-google-${userId}`,
    };
  }
}

export default GoogleAuthService;
