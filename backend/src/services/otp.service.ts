import crypto from 'crypto';
import logger from '../utils/logger';

export interface OtpChallenge {
  email: string;
  otp: string;
  createdAt: number;
  expiresAt: number;
  lastSentAt: number;
  attempts: number;
  payload?: {
    fullName?: string;
    password?: string;
    phone?: string;
    role?: string;
  };
}

export class OtpService {
  private static challenges: Map<string, OtpChallenge> = new Map();
  private static readonly OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
  private static readonly COOLDOWN_MS = 60 * 1000; // 60 seconds
  private static readonly MAX_ATTEMPTS = 5;

  /**
   * Generates a 6-digit numeric OTP challenge for email registration.
   */
  public static async generateRegistrationOtp(
    email: string,
    payload?: OtpChallenge['payload']
  ): Promise<{ cooldownSeconds: number; devOtp?: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const now = Date.now();
    const existing = this.challenges.get(normalizedEmail);

    if (existing && now - existing.lastSentAt < this.COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((this.COOLDOWN_MS - (now - existing.lastSentAt)) / 1000);
      throw new Error(`Please wait ${remainingSeconds} seconds before requesting a new verification code.`);
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const challenge: OtpChallenge = {
      email: normalizedEmail,
      otp,
      createdAt: now,
      expiresAt: now + this.OTP_TTL_MS,
      lastSentAt: now,
      attempts: 0,
      payload: payload || existing?.payload,
    };

    this.challenges.set(normalizedEmail, challenge);

    logger.info(`[OtpService] Registration OTP generated for ${normalizedEmail}: ${otp}`);

    return {
      cooldownSeconds: 60,
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    };
  }

  /**
   * Verifies an entered OTP code against the stored challenge.
   */
  public static async verifyRegistrationOtp(
    email: string,
    enteredOtp: string
  ): Promise<{ valid: boolean; reason?: string; payload?: OtpChallenge['payload'] }> {
    const normalizedEmail = email.trim().toLowerCase();
    const challenge = this.challenges.get(normalizedEmail);
    const now = Date.now();

    // Universal dev bypass code allowed in non-production
    const isDevMock = process.env.NODE_ENV !== 'production' && enteredOtp === '123456';

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
    email: string
  ): Promise<{ cooldownSeconds: number; devOtp?: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = this.challenges.get(normalizedEmail);

    return this.generateRegistrationOtp(normalizedEmail, existing?.payload);
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
