import { Response } from 'express';
import { DataManagementService, type DataActor } from '../services/dataManagement.service';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import type { ApiResponse } from '../types/api';

function getActor(req: AuthenticatedRequest): DataActor {
  return {
    id: String(req.user?.id || 'unknown'),
    role: String((req.user as any)?.role || 'client'),
    name: (req.user as any)?.full_name || (req.user as any)?.email,
  };
}

function sendError(res: Response<ApiResponse>, err: unknown) {
  const message = err instanceof Error ? err.message : 'Unexpected server error.';
  const status = message.startsWith('Forbidden')
    ? 403
    : message.startsWith('Too Many Requests')
      ? 429
      : 500;
  if (status === 429) {
    const match = message.match(/(\d+)s/);
    res.setHeader('Retry-After', match ? match[1] : '300');
  }
  res.status(status).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
  });
}

export class DataManagementController {
  public static async getBackupSummary(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const summary = await DataManagementService.getBackupSummary(getActor(req));
      res.status(200).json({
        success: true,
        data: summary,
        message: 'Backup summary loaded.',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      sendError(res, err);
    }
  }

  public static async exportSnapshot(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const snapshot = await DataManagementService.exportSnapshot(getActor(req));
      res.status(200).json({
        success: true,
        data: snapshot,
        message: 'Backup snapshot generated.',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      sendError(res, err);
    }
  }
}
