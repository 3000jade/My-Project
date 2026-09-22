import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { queryDashboardSchema } from '../schemas/dashboard.schema';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import type { ApiResponse } from '../types/api';

export class DashboardController {
  /**
   * GET /api/dashboard/summary
   */
  public static async getSummary(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const user = req.user;
      const rawRole = (req.query.role as string) || (user?.role as string) || 'broker';
      const rawAgentId = (req.query.agentId as string) || (user?.id as string) || undefined;

      const parseResult = queryDashboardSchema.safeParse({
        role: rawRole,
        agentId: rawAgentId,
      });

      if (!parseResult.success) {
        const issues = (parseResult.error as any).issues || (parseResult.error as any).errors || [];
        res.status(400).json({
          success: false,
          error: issues.map((e: any) => e.message).join(', ') || 'Invalid dashboard parameters.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const summary = await DashboardService.getSummary(parseResult.data);

      res.status(200).json({
        success: true,
        data: summary,
        message: 'Dashboard summary retrieved successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('[DashboardController Error]', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to retrieve dashboard summary.',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
