import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import type { ApiResponse } from '../types/api';

export class AuthController {
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

      res.status(200).json({
        success: true,
        data: {
          user,
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
}

export default AuthController;
