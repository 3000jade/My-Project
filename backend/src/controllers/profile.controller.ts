import { Request, Response } from 'express';
import { ProfileService } from '../services/profile.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import type { ApiResponse } from '../types/api';

export class ProfileController {
  /**
   * GET /api/profile
   * Retrieve current user profile (or role-specific default in preview)
   */
  public static async getProfile(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const user = req.user;
      const roleQuery = (req.query.role as string) || (user?.role as string) || 'agent';
      const userId = user?.id || (roleQuery === 'broker' ? 'user-broker-1' : 'user-agent-1');

      const profile = await ProfileService.getProfile(userId, roleQuery);

      res.status(200).json({
        success: true,
        data: profile,
        message: 'Profile retrieved successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to retrieve profile.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * PUT /api/profile
   * Update current user profile
   */
  public static async updateProfile(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const user = req.user;
      const roleQuery = (req.query.role as string) || (user?.role as string) || (req.body.role as string) || 'agent';
      const userId = user?.id || (roleQuery === 'broker' ? 'user-broker-1' : 'user-agent-1');

      const updated = await ProfileService.updateProfile(userId, req.body, roleQuery);

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Profile updated successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Failed to update profile.',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export default ProfileController;
