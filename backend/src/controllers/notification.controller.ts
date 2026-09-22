import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import type { ApiResponse } from '../types/api';

export class NotificationController {
  /**
   * GET /api/notifications
   */
  public static async list(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { status, type, role, limit } = req.query as any;
      const notifications = await NotificationService.listNotifications({
        status: status || 'ALL',
        type,
        role,
        limit: limit ? Number(limit) : undefined,
      });

      res.status(200).json({
        success: true,
        data: notifications,
        message: 'Notifications retrieved successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to retrieve notifications.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/notifications/unread-count
   */
  public static async getUnreadCount(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const role = (req.query.role as string) || undefined;
      const count = await NotificationService.getUnreadCount(role);

      res.status(200).json({
        success: true,
        data: { count },
        message: 'Unread notification count retrieved.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to retrieve unread notification count.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * PATCH /api/notifications/:id/read
   */
  public static async markAsRead(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
      const is_read = req.body.is_read !== undefined ? Boolean(req.body.is_read) : true;

      const updated = await NotificationService.markAsRead(id, is_read);

      if (!updated) {
        res.status(404).json({
          success: false,
          error: `Notification with ID "${id}" was not found.`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: updated,
        message: `Notification marked as ${is_read ? 'read' : 'unread'}.`,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to update notification read status.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/notifications/mark-all-read
   */
  public static async markAllAsRead(_req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const result = await NotificationService.markAllAsRead();

      res.status(200).json({
        success: true,
        data: result,
        message: 'All notifications marked as read.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to mark all notifications as read.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/notifications
   */
  public static async create(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const created = await NotificationService.createNotification(req.body);

      res.status(201).json({
        success: true,
        data: created,
        message: 'Notification alert generated.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Failed to create notification.',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export default NotificationController;
