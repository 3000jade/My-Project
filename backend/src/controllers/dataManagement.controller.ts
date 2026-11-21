import { Response } from 'express';
import { DataManagementService, type DataActor, type ExportFormat } from '../services/dataManagement.service';
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
  const status = message.startsWith('Forbidden') ? 403 : message.includes('not found') ? 404 : 400;
  res.status(status).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
  });
}

export class DataManagementController {
  public static previewImport(req: AuthenticatedRequest, res: Response<ApiResponse>): void {
    try {
      const { resource, rows } = req.body || {};
      if (!Array.isArray(rows)) {
        res.status(400).json({
          success: false,
          error: 'Request body must include a rows array.',
          timestamp: new Date().toISOString(),
        });
        return;
      }
      const preview = DataManagementService.previewImport(getActor(req), String(resource || ''), rows);
      res.status(200).json({
        success: true,
        data: preview,
        message: 'Import preview generated (no changes saved).',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      sendError(res, err);
    }
  }

  public static async commitImport(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const { resource, rows } = req.body || {};
      if (!Array.isArray(rows)) {
        res.status(400).json({
          success: false,
          error: 'Request body must include a rows array.',
          timestamp: new Date().toISOString(),
        });
        return;
      }
      const result = await DataManagementService.commitImport(getActor(req), String(resource || ''), rows);
      res.status(200).json({
        success: true,
        data: result,
        message: 'Import committed and recorded in audit log.',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      sendError(res, err);
    }
  }

  public static async exportRecords(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const resource = String(req.params.resource || '');
      const format = (req.query.format === 'csv' ? 'csv' : 'json') as ExportFormat;
      const result = await DataManagementService.exportRecords(getActor(req), resource, format);

      if (req.query.download === 'true') {
        res.setHeader('Content-Type', result.contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
        res.status(200).send(result.body as any);
        return;
      }

      res.status(200).json({
        success: true,
        data: result,
        message: 'Export generated.',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      sendError(res, err);
    }
  }

  public static async getHealth(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const health = await DataManagementService.getDataHealth(getActor(req));
      res.status(200).json({
        success: true,
        data: health,
        message: 'Data health summary loaded.',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      sendError(res, err);
    }
  }

  public static async archiveRecord(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const { resource, id } = req.body || {};
      const result = await DataManagementService.setArchiveState(getActor(req), String(resource || ''), String(id || ''), true);
      res.status(200).json({
        success: true,
        data: result,
        message: 'Record archived (reversible).',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      sendError(res, err);
    }
  }

  public static async restoreRecord(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const { resource, id } = req.body || {};
      const result = await DataManagementService.setArchiveState(getActor(req), String(resource || ''), String(id || ''), false);
      res.status(200).json({
        success: true,
        data: result,
        message: 'Record restored to active.',
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
