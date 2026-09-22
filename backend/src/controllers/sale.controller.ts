import { Request, Response } from 'express';
import { SaleService } from '../services/sale.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import type { ApiResponse } from '../types/api';

export class SaleController {
  /**
   * GET /api/sales
   */
  public static async list(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const user = req.user;
      const role = (req.query.role as string) || (user?.role as string) || 'broker';
      const userId = user?.id || (req.query.agentId as string) || undefined;

      const sales = await SaleService.listSales(req.query as any, role, userId);

      res.status(200).json({
        success: true,
        data: sales,
        message: 'Sales conveyance records retrieved.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to retrieve sales records.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/sales/:id
   */
  public static async getById(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
      const sale = await SaleService.getSaleById(id);

      if (!sale) {
        res.status(404).json({
          success: false,
          error: `Sales record with ID "${id}" was not found.`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: sale,
        message: 'Sales conveyance dossier retrieved.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to retrieve sale record.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/sales
   */
  public static async create(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const created = await SaleService.createSale(req.body);

      res.status(201).json({
        success: true,
        data: created,
        message: 'Sales conveyance transaction registered.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Failed to create sales record.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * PUT /api/sales/:id
   */
  public static async update(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
      const updated = await SaleService.updateSale(id, req.body);

      if (!updated) {
        res.status(404).json({
          success: false,
          error: `Sales record with ID "${id}" was not found.`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Sales conveyance record updated.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to update sales record.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * DELETE /api/sales/:id
   */
  public static async delete(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
      const deleted = await SaleService.deleteSale(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: `Sales record with ID "${id}" was not found.`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Sales conveyance record deleted.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to delete sales record.',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export default SaleController;
