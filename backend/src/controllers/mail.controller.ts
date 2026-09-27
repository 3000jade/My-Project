import { Request, Response } from 'express';
import { GmailService } from '../services/gmail.service';
import type { ApiResponse } from '../types/api';

export class MailController {
  /**
   * POST /api/mail/send
   * Direct mail dispatch for brochure/inquiry/tour
   */
  public static async sendMail(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { type, data } = req.body;

      if (!type || !data) {
        res.status(400).json({
          success: false,
          error: 'Email type and data payload are required.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      let result: { success: boolean; messageId?: string };

      if (type === 'tour') {
        result = await GmailService.sendTourConfirmation(data);
      } else {
        result = await GmailService.sendInquiryNotification(data);
      }

      if (!result.success) {
        res.status(500).json({
          success: false,
          error: 'Failed to dispatch email via Gmail API.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result,
        message: 'Email dispatched successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error processing email dispatch.',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export default MailController;
