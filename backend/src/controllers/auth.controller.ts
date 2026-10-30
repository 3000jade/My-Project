import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { GoogleAuthService } from '../services/googleAuth.service';
import { AgentRegistrationService } from '../services/agentRegistration.service';
import { SessionService } from '../services/session.service';
import { OtpService } from '../services/otp.service';
import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import type { ApiResponse } from '../types/api';

export class AuthController {
  /**
   * Handle Google OAuth authentication
   */
  public static async googleAuth(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { idToken, role } = req.body;

      if (!idToken) {
        res.status(400).json({
          success: false,
          error: 'Google ID token is required.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const authData = await GoogleAuthService.verifyAndAuthenticate(idToken, role);

      if (authData?.token && authData?.user?.id) {
        SessionService.createSession({
          sessionId: authData.token,
          token: authData.token,
          userId: authData.user.id,
          role: authData.user.role || role || 'client',
          userAgent: (req.headers['user-agent'] as string) || 'Unknown Device',
          ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || 'Unavailable',
        });
      }

      res.status(200).json({
        success: true,
        data: authData,
        message: 'Google authentication successful.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(401).json({
        success: false,
        error: err.message || 'Google authentication failed.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Handle user login
   */
  public static async login(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const authData = await AuthService.signIn(email, password);
      if (authData?.token && authData?.user?.id) {
        SessionService.createSession({
          sessionId: authData.token,
          token: authData.token,
          userId: authData.user.id,
          role: authData.user.role || 'client',
          userAgent: (req.headers['user-agent'] as string) || 'Unknown Device',
          ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || 'Unavailable',
        });
      }

      res.status(200).json({
        success: true,
        data: authData,
        message: 'Authentication successful.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(401).json({
        success: false,
        error: err.message || 'Invalid credentials.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Handle user registration
   */
  public static async register(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { email, password, fullName, role } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const authData = await AuthService.signUp(email, password, { fullName, role });

      res.status(201).json({
        success: true,
        data: authData,
        message: 'User registered successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Registration failed.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Handle invited agent registration
   * POST /api/auth/register-agent
   */
  public static async registerAgent(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const result = await AgentRegistrationService.registerInvitedAgent(req.body);

      res.status(201).json({
        success: true,
        data: result,
        message: result.message,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Agent registration failed.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/auth/register-otp/initiate
   * Validates registration details and dispatches a 6-digit email OTP.
   */
  public static async initiateRegistrationOtp(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { email, password, fullName, phone, role } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Check for existing profile if Supabase is active
      if (isSupabaseConfigured) {
        const { data: existing } = await supabaseAdmin
          .from('profiles')
          .select('id, email')
          .eq('email', email.trim().toLowerCase())
          .maybeSingle();

        if (existing) {
          res.status(409).json({
            success: false,
            error: 'An account with this email address already exists. Please sign in.',
            timestamp: new Date().toISOString(),
          });
          return;
        }
      }

      const otpResult = await OtpService.generateRegistrationOtp(email, {
        fullName,
        password,
        phone,
        role: role || 'client',
      });

      res.status(200).json({
        success: true,
        data: {
          email: email.trim().toLowerCase(),
          cooldownSeconds: otpResult.cooldownSeconds,
          devOtp: otpResult.devOtp,
        },
        message: 'A 6-digit verification code has been dispatched to your email address.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Failed to initiate verification code.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/auth/register-otp/verify
   * Verifies the 6-digit OTP, creates the account, and returns authenticated tokens.
   */
  public static async verifyRegistrationOtp(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { email, otp, password: bodyPassword, fullName: bodyFullName, phone: bodyPhone } = req.body;

      const verifyResult = await OtpService.verifyRegistrationOtp(email, otp);
      if (!verifyResult.valid) {
        res.status(400).json({
          success: false,
          error: verifyResult.reason || 'Invalid verification code.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const finalFullName = bodyFullName || verifyResult.payload?.fullName || 'Client User';
      const finalPassword = bodyPassword || verifyResult.payload?.password;
      const finalPhone = bodyPhone || verifyResult.payload?.phone;

      if (!finalPassword) {
        res.status(400).json({
          success: false,
          error: 'Passphrase is required to complete account registration.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Complete user registration with verified email flag
      let authData: any = null;
      if (isSupabaseConfigured) {
        let userId: string | null = null;
        try {
          const { data: createData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: finalPassword,
            email_confirm: true,
            user_metadata: {
              full_name: finalFullName,
              role: 'client',
            },
          });
          if (createData?.user) {
            userId = createData.user.id;
          } else if (createErr) {
            // If already exists in auth, confirm email and update password
            const { data: listUser } = await supabaseAdmin.auth.admin.listUsers();
            const found = listUser?.users?.find((u) => u.email === email);
            if (found) {
              userId = found.id;
              await supabaseAdmin.auth.admin.updateUserById(userId, {
                password: finalPassword,
                email_confirm: true,
              });
            } else {
              throw createErr;
            }
          }
        } catch {
          // Fall back to standard sign up
          authData = await AuthService.signUp(email, finalPassword, {
            fullName: finalFullName,
            role: 'client',
          });
          userId = authData?.user?.id;
        }

        // Upsert verified profile in PostgreSQL profiles table
        if (userId) {
          const profilePayload: Record<string, any> = {
            id: userId,
            email,
            full_name: finalFullName,
            role: 'client',
            verification_status: 'VERIFIED',
            updated_at: new Date().toISOString(),
          };
          if (finalPhone) profilePayload.phone = finalPhone;

          await supabaseAdmin.from('profiles').upsert(profilePayload);

          // Authenticate and obtain live JWT session
          try {
            authData = await AuthService.signIn(email, finalPassword);
          } catch {
            authData = {
              user: {
                id: userId,
                email,
                role: 'client',
                fullName: finalFullName,
              },
              token: `token-verified-${userId}`,
              refreshToken: `refresh-verified-${userId}`,
            };
          }
        }
      } else {
        authData = await AuthService.signUp(email, finalPassword, {
          fullName: finalFullName,
          role: 'client',
        });
      }

      // Create active session in SessionService
      if (authData?.token && authData?.user?.id) {
        SessionService.createSession({
          sessionId: authData.token,
          token: authData.token,
          userId: authData.user.id,
          role: authData.user.role || 'client',
          userAgent: (req.headers['user-agent'] as string) || 'Unknown Device',
          ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || 'Unavailable',
        });
      }

      res.status(201).json({
        success: true,
        data: authData,
        message: 'Account successfully verified and registered.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'OTP verification failed.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/auth/register-otp/resend
   * Resends a fresh 6-digit OTP code to the provided email address.
   */
  public static async resendRegistrationOtp(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Email address is required.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const resendResult = await OtpService.resendRegistrationOtp(email);

      res.status(200).json({
        success: true,
        data: {
          email: email.trim().toLowerCase(),
          cooldownSeconds: resendResult.cooldownSeconds,
          devOtp: resendResult.devOtp,
        },
        message: 'A fresh verification code has been dispatched.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Unable to resend verification code.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Handle retrieving currently authenticated user profile
   */
  public static async getMe(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const profile = await AuthService.getUserProfile(user.id);

      const fullName =
        profile?.full_name ||
        user.user_metadata?.full_name ||
        profile?.email?.split('@')[0] ||
        user.email?.split('@')[0] ||
        'User';

      const enrichedUser = {
        ...user,
        fullName,
      };

      res.status(200).json({
        success: true,
        data: {
          user: enrichedUser,
          profile,
        },
        message: 'User session verified.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Could not retrieve user profile.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Handle user logout
   */
  public static async logout(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
      const userId = (req as AuthenticatedRequest).user?.id;
      if (token) {
        await SessionService.revokeSessionAsync({
          sessionId: token,
          requestingUserId: userId,
          reason: 'user_logout',
        });
      }
      await AuthService.signOut(token);

      res.status(200).json({
        success: true,
        message: 'Logged out successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Logout failed.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/auth/heartbeat
   * Informational presence heartbeat (does not reset idle timeout)
   */
  public static async heartbeat(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : '';
    const userId = req.user?.id || 'anonymous';
    const valid = await SessionService.recordHeartbeatAsync(token, userId);

    res.status(valid ? 200 : 401).json({
      success: valid,
      data: { online: valid },
      message: valid ? 'Presence heartbeat recorded.' : 'Session expired.',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * POST /api/auth/extend-session
   * Authenticated user-confirmed session extension ("Stay signed in")
   */
  public static async extendSession(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : '';
      if (!token) {
        res.status(401).json({
          success: false,
          error: 'Authentication token required.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await SessionService.extendSessionAsync(token);
      if (!result.valid) {
        res.status(401).json({
          success: false,
          error: `Cannot extend session: ${result.reason || 'Session expired or revoked.'}`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          idleExpiresAt: result.session?.idleExpiresAt,
          absoluteExpiresAt: result.session?.absoluteExpiresAt,
        },
        message: 'Session successfully extended.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Session extension failed.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/auth/refresh
   * Token refresh rotation maintaining original absolute session expiration
   */
  public static async refreshSession(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const authHeader = req.headers.authorization;
      const oldToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : '';

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: 'Refresh token is required.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Invariant check: If old session was tracked, verify it was not revoked or disabled
      if (oldToken) {
        const existingCheck = await SessionService.validateSessionAsync(oldToken, Date.now(), false);
        if (!existingCheck.valid && existingCheck.reason !== 'SESSION_IDLE_EXPIRED') {
          res.status(401).json({
            success: false,
            error: `Refresh rejected: ${existingCheck.reason || 'Session invalid or revoked'}`,
            timestamp: new Date().toISOString(),
          });
          return;
        }
      }

      const authData = await AuthService.refreshSession(refreshToken);

      if (authData?.token && authData?.user?.id) {
        const existing = await SessionService.getSessionAsync(oldToken);
        if (oldToken && existing) {
          await SessionService.rotateSessionAsync(
            oldToken,
            authData.token,
            authData.user.id,
            authData.user.role || 'client'
          );
        } else {
          await SessionService.createSessionAsync({
            sessionId: authData.token,
            token: authData.token,
            userId: authData.user.id,
            role: authData.user.role || 'client',
            userAgent: (req.headers['user-agent'] as string) || 'Unknown Device',
            ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || 'Unavailable',
          });
        }
      }

      res.status(200).json({
        success: true,
        data: authData,
        message: 'Token session refreshed successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(401).json({
        success: false,
        error: err.message || 'Token refresh failed.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/auth/forgot-password
   * Request password recovery email
   */
  public static async forgotPassword(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { email, redirectTo } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Email address is required.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      await AuthService.resetPasswordForEmail(email, redirectTo);

      res.status(200).json({
        success: true,
        message: 'If the email is registered, recovery instructions have been sent.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: 'Unable to process password reset request.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/auth/reset-password
   * Complete password update using recovery session
   */
  public static async resetPassword(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { newPassword, token } = req.body;

      if (!newPassword || newPassword.length < 8) {
        res.status(400).json({
          success: false,
          error: 'New password must be at least 8 characters long.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      await AuthService.updateUserPassword(newPassword, token);

      if (token) {
        await SessionService.revokeSessionAsync({
          sessionId: token,
          reason: 'password_reset',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Password has been successfully updated. Please sign in with your new credentials.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Failed to reset password.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/auth/resend-verification
   * Resend account verification email
   */
  public static async resendVerification(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Email address is required.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      await AuthService.resendVerificationEmail(email);

      res.status(200).json({
        success: true,
        message: 'If the account exists and is unverified, a new verification email has been sent.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to process verification resend request.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/auth/sessions
   * List active sessions for authenticated user
   */
  public static async listSessions(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const userId = req.user?.id;
      const authHeader = req.headers.authorization;
      const currentToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : '';

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const sessions = await SessionService.getUserSessionsAsync(userId, currentToken);

      res.status(200).json({
        success: true,
        data: { sessions },
        message: 'Active sessions retrieved.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to retrieve active sessions.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * DELETE /api/auth/sessions/:sessionId
   * Revoke a specific session
   */
  public static async revokeSession(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const rawSessionId = req.params.sessionId;
      const sessionId = Array.isArray(rawSessionId) ? rawSessionId[0] : rawSessionId;
      const requestingUserId = req.user?.id;

      if (!sessionId) {
        res.status(400).json({
          success: false,
          error: 'Session ID is required.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const session = await SessionService.getSessionAsync(sessionId);
      if (!session || session.revokedAt) {
        res.status(404).json({
          success: false,
          error: 'Session not found or already revoked.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (requestingUserId && session.userId !== requestingUserId) {
        res.status(403).json({
          success: false,
          error: 'Forbidden: You are not authorized to revoke this session.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const revoked = await SessionService.revokeSessionAsync({
        sessionId,
        requestingUserId,
        reason: 'user_manual_revoke',
      });

      res.status(200).json({
        success: revoked,
        message: revoked ? 'Session revoked successfully.' : 'Failed to revoke session.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to revoke session.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/auth/revoke-all
   * All-device session revocation path
   */
  public static async revokeAllSessions(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required.',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const revokedCount = await SessionService.revokeAllUserSessionsAsync(userId, 'all_device_revocation');
    res.status(200).json({
      success: true,
      data: { revokedCount },
      message: 'All device sessions revoked.',
      timestamp: new Date().toISOString(),
    });
  }
}

export default AuthController;
