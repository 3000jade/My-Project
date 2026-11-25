import crypto from 'crypto';
import logger from '../utils/logger';
import { supabase, isSupabaseConfigured } from '../config/supabase';

export type OtpChannel = 'email' | 'phone';

export interface OtpChallenge {
  email: string;
  otp: string;
  channel: OtpChannel;
  provider: 'supabase' | 'local';
  createdAt: number;
  expiresAt: number;
  lastSentAt: number;
  attempts: number;
  payload?: {
    fullName?: string;
    password?: string;
    phone?: string;
    role?: string;
    channel?: OtpChannel;
  };
}

export interface VerifiedEmailTicket {
  email: string;
  token: string;
  expiresAt: number;
  supabaseUserId?: string;
}

export class OtpService {
  // shortcut: In-memory maps assume a single backend process. Move to Supabase/Redis before horizontal scaling.
  private static challenges: Map<string, OtpChallenge> = new Map();
  private static verifiedTickets: Map<string, VerifiedEmailTicket> = new Map();
  private static readonly OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
  private static readonly TICKET_TTL_MS = 15 * 60 * 1000; // 15 minutes
  private static readonly COOLDOWN_MS = 60 * 1000; // 60 seconds
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  private static cleanupStarted = false;

  private static ensureCleanupTimer(): void {
    if (this.cleanupStarted) return;
    this.cleanupStarted = true;
    const timer = setInterval(() => this.pruneExpired(), this.CLEANUP_INTERVAL_MS);
    if (typeof timer.unref === 'function') {
      timer.unref();
    }
  }

  public static pruneExpired(now = Date.now()): void {
    for (const [email, challenge] of this.challenges.entries()) {
      if (now > challenge.expiresAt) this.challenges.delete(email);
    }
    for (const [email, ticket] of this.verifiedTickets.entries()) {
      if (now > ticket.expiresAt) this.verifiedTickets.delete(email);
    }
  }

  /**
   * Generates a 6-digit numeric OTP challenge for email or phone registration.
   */
  public static async generateRegistrationOtp(
    email: string,
    payload?: OtpChallenge['payload']
  ): Promise<{ cooldownSeconds: number; channel: OtpChannel; devOtp?: string }> {
    this.ensureCleanupTimer();
    const normalizedEmail = email.trim().toLowerCase();
    const now = Date.now();
    const existing = this.challenges.get(normalizedEmail);

    if (existing && now - existing.lastSentAt < this.COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((this.COOLDOWN_MS - (now - existing.lastSentAt)) / 1000);
      throw new Error(`Please wait ${remainingSeconds} seconds before requesting a new verification code.`);
    }

    const channel: OtpChannel = payload?.channel || existing?.channel || 'email';
    const mergedPayload = payload || existing?.payload;

    if (channel === 'email' && isSupabaseConfigured) {
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        logger.error(`[OtpService] Supabase signInWithOtp failed for ${normalizedEmail}: ${error.message}`);
        throw new Error(error.message || 'Unable to send verification email right now. Please try again shortly.');
      }

      this.challenges.set(normalizedEmail, {
        email: normalizedEmail,
        otp: '',
        channel,
        provider: 'supabase',
        createdAt: now,
        expiresAt: now + this.OTP_TTL_MS,
        lastSentAt: now,
        attempts: 0,
        payload: mergedPayload,
      });

      logger.info(`[OtpService] Supabase email OTP dispatched to ${normalizedEmail}`);

      return {
        cooldownSeconds: 60,
        channel,
      };
    }

    const otp = crypto.randomInt(100000, 1000000).toString();

    const challenge: OtpChallenge = {
      email: normalizedEmail,
      otp,
      channel,
      provider: 'local',
      createdAt: now,
      expiresAt: now + this.OTP_TTL_MS,
      lastSentAt: now,
      attempts: 0,
      payload: mergedPayload,
    };

    this.challenges.set(normalizedEmail, challenge);

    if (process.env.NODE_ENV !== 'production') {
      logger.info(
        channel === 'phone'
          ? `[OtpService] Phone SMS OTP generated for ${mergedPayload?.phone || normalizedEmail}: ${otp}`
          : `[OtpService] Local Email OTP generated for ${normalizedEmail}: ${otp}`
      );
    }

    return {
      cooldownSeconds: 60,
      channel,
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    };
  }

  /**
   * Verifies an entered OTP code against Supabase Auth (when active) or the local challenge.
   */
  public static async verifyRegistrationOtp(
    email: string,
    enteredOtp: string
  ): Promise<{ valid: boolean; reason?: string; payload?: OtpChallenge['payload']; supabaseUserId?: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const challenge = this.challenges.get(normalizedEmail);
    const now = Date.now();

    // Universal dev bypass code allowed in non-production
    const isDevMock = process.env.NODE_ENV !== 'production' && enteredOtp === '123456';

    if ((challenge?.provider === 'supabase' || (!challenge && isSupabaseConfigured)) && !isDevMock) {
      if (challenge && challenge.attempts >= this.MAX_ATTEMPTS) {
        this.challenges.delete(normalizedEmail);
        return {
          valid: false,
          reason: 'Too many incorrect attempts. Please request a new code.',
        };
      }

      const { data, error } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: enteredOtp,
        type: 'email',
      });

      if (error || !data?.user) {
        if (challenge) {
          challenge.attempts += 1;
          const remainingAttempts = this.MAX_ATTEMPTS - challenge.attempts;
          return {
            valid: false,
            reason:
              remainingAttempts > 0
                ? `Incorrect verification code. ${remainingAttempts} attempt(s) remaining.`
                : 'Too many incorrect attempts. Please request a new code.',
          };
        }
        return {
          valid: false,
          reason: error?.message || 'Verification code is invalid or expired. Please request a new code.',
        };
      }

      const payload = challenge?.payload;
      this.challenges.delete(normalizedEmail);
      return {
        valid: true,
        payload,
        supabaseUserId: data.user.id,
      };
    }

    if (!challenge) {
      if (isDevMock) {
        return {
          valid: true,
          payload: { role: 'client' },
        };
      }
      return {
        valid: false,
        reason: 'Verification code not found or expired. Please request a new code.',
      };
    }

    if (now > challenge.expiresAt) {
      this.challenges.delete(normalizedEmail);
      return {
        valid: false,
        reason: 'Verification code has expired. Please request a new code.',
      };
    }

    if (challenge.attempts >= this.MAX_ATTEMPTS) {
      this.challenges.delete(normalizedEmail);
      return {
        valid: false,
        reason: 'Too many incorrect attempts. Please request a new code.',
      };
    }

    if (challenge.otp === enteredOtp || isDevMock) {
      const payload = challenge.payload;
      this.challenges.delete(normalizedEmail);
      return {
        valid: true,
        payload,
      };
    }

    challenge.attempts += 1;
    const remainingAttempts = this.MAX_ATTEMPTS - challenge.attempts;
    return {
      valid: false,
      reason: `Incorrect verification code. ${remainingAttempts} attempt(s) remaining.`,
    };
  }

  /**
   * Resends a fresh OTP code for an active registration flow.
   */
  public static async resendRegistrationOtp(
    email: string,
    channelOverride?: OtpChannel
  ): Promise<{ cooldownSeconds: number; channel: OtpChannel; devOtp?: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = this.challenges.get(normalizedEmail);
    const nextPayload = existing?.payload
      ? { ...existing.payload, channel: channelOverride || existing.channel }
      : channelOverride
        ? { channel: channelOverride }
        : undefined;

    return this.generateRegistrationOtp(normalizedEmail, nextPayload);
  }

  /**
   * Verifies an email OTP and issues a short-lived single-use verification ticket
   * so the client can complete remaining registration steps before account creation.
   */
  public static async verifyEmailAndIssueTicket(
    email: string,
    enteredOtp: string
  ): Promise<{ valid: boolean; reason?: string; verificationToken?: string; expiresInSeconds?: number }> {
    const normalizedEmail = email.trim().toLowerCase();
    const result = await this.verifyRegistrationOtp(normalizedEmail, enteredOtp);

    if (!result.valid) {
      return { valid: false, reason: result.reason };
    }

    const token = crypto.randomBytes(32).toString('hex');
    this.verifiedTickets.set(normalizedEmail, {
      email: normalizedEmail,
      token,
      expiresAt: Date.now() + this.TICKET_TTL_MS,
      supabaseUserId: result.supabaseUserId,
    });

    return {
      valid: true,
      verificationToken: token,
      expiresInSeconds: Math.floor(this.TICKET_TTL_MS / 1000),
    };
  }

  /**
   * Validates and consumes a single-use verified-email ticket.
   */
  public static consumeVerificationTicket(
    email: string,
    token: string
  ): { valid: boolean; expired?: boolean; reason?: string; supabaseUserId?: string } {
    const normalizedEmail = email.trim().toLowerCase();
    const ticket = this.verifiedTickets.get(normalizedEmail);

    if (!ticket) {
      return {
        valid: false,
        expired: true,
        reason: 'Your email verification expired. Please request a fresh 6-digit code.',
      };
    }

    if (Date.now() > ticket.expiresAt) {
      this.verifiedTickets.delete(normalizedEmail);
      return {
        valid: false,
        expired: true,
        reason: 'Your email verification expired. Please request a fresh 6-digit code.',
      };
    }

    if (ticket.token !== token) {
      return {
        valid: false,
        expired: false,
        reason: 'Invalid email verification token. Please verify your email again.',
      };
    }

    this.verifiedTickets.delete(normalizedEmail);
    return { valid: true, supabaseUserId: ticket.supabaseUserId };
  }

  /**
   * Clears a verified-email ticket (e.g. cleanup or test reset).
   */
  public static clearVerificationTicket(email: string): void {
    this.verifiedTickets.delete(email.trim().toLowerCase());
  }

  /**
   * Clears an OTP challenge (e.g. upon cancellation or cleanup).
   */
  public static clearChallenge(email: string): void {
    this.challenges.delete(email.trim().toLowerCase());
  }

  /**
   * Resets all challenges (primarily for automated testing suites).
   */
  public static resetForTesting(): void {
    this.challenges.clear();
  }
}

export default OtpService;
