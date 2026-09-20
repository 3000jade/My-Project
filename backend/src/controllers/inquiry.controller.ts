import { Request, Response } from 'express';
import { InquiryService } from '../services/inquiry.service';
import type { ApiResponse } from '../types/api';

export class InquiryController {
  /**
   * POST /api/inquiries
   */
  public static async create(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { name, email, message } = req.body;

      if (!name || !email || !message) {
        res.status(400).json({
          success: false,
          error: 'Name, email, and message are required fields.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const inquiry = await InquiryService.createInquiry(req.body);

      res.status(201).json({
        success: true,
        data: inquiry,
        message: 'Inquiry received. A representative will contact you shortly.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error processing inquiry.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/inquiries
   */
  public static async list(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const type = req.query.type as string | undefined;
      let agentId = req.query.agentId as string | undefined;

      // Role check: If authenticated user is an agent, filter to their own inquiries unless explicitly specified
      const user = (req as any).user;
      if (user && user.role === 'agent' && !agentId) {
        agentId = user.id || 'agent-1';
      }

      const inquiries = await InquiryService.listInquiries({
        status,
        agentId,
        type,
      });

      res.status(200).json({
        success: true,
        data: inquiries,
        message: 'Inquiries retrieved.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error fetching inquiries.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/inquiries/:id
   */
  public static async getById(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = String(req.params.id);
      const inquiry = await InquiryService.getInquiryById(id);

      if (!inquiry) {
        res.status(404).json({
          success: false,
          error: `Inquiry with ID "${id}" was not found.`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: inquiry,
        message: 'Inquiry retrieved successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error retrieving inquiry.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * PUT /api/inquiries/:id
   */
  public static async update(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = String(req.params.id);
      const updated = await InquiryService.updateInquiry(id, req.body);

      if (!updated) {
        res.status(404).json({
          success: false,
          error: `Inquiry with ID "${id}" was not found.`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Inquiry updated successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error updating inquiry.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * DELETE /api/inquiries/:id
   */
  public static async delete(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = String(req.params.id);
      const success = await InquiryService.deleteInquiry(id);

      res.status(200).json({
        success,
        message: 'Inquiry deleted successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error deleting inquiry.',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export default InquiryController;
