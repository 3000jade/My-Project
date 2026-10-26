import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { GoogleAuthService } from '../services/googleAuth.service';
import { AgentRegistrationService } from '../services/agentRegistration.service';
import { SessionService } from '../services/session.service';
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
