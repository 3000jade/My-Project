import { Request, Response } from 'express';
import { PropertyService } from '../services/property.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import type { ApiResponse, PaginatedResponse } from '../types/api';

export class PropertyController {
  /**
   * GET /api/properties
   */
  public static async listProperties(
    req: Request,
    res: Response<PaginatedResponse>
  ): Promise<void> {
    try {
      const { city, propertyType, transactionType, minPrice, maxPrice, status, agentId, search, page, limit } = req.query;

      const result = await PropertyService.findProperties({
        city: city as string,
        propertyType: propertyType as string,
        transactionType: transactionType as string,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        status: status as string,
        agentId: agentId as string,
        search: search as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result.properties,
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        message: 'Properties retrieved successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to retrieve properties.',
        timestamp: new Date().toISOString(),
      } as any);
    }
  }

  /**
   * GET /api/properties/count
   */
  public static async countProperties(req: Request, res: Response) {
    try {
      const count = await PropertyService.countProperties(req.query);
      res.status(200).json({ success: true, count });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to count properties.' });
    }
  }

  /**
   * GET /api/properties/:id
   */
  public static async getProperty(
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const property = await PropertyService.findPropertyById(id);

      if (!property) {
        res.status(404).json({
          success: false,
          error: `Property with id '${id}' not found.`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: property,
        message: 'Property details retrieved.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error fetching property details.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/properties
   */
  public static async createProperty(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const { title, price } = req.body;

      if (!title || price === undefined) {
        res.status(400).json({
          success: false,
          error: 'Title and price are required.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const userId = req.user?.id;
      const created = await PropertyService.createProperty(req.body, userId);

      res.status(201).json({
        success: true,
        data: created,
        message: 'Property listing created successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Could not create property.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * PUT /api/properties/:id
   */
  public static async updateProperty(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const userId = req.user?.id;
      const updated = await PropertyService.updateProperty(id, req.body, userId);

      if (!updated) {
        res.status(404).json({
          success: false,
          error: `Property with id '${id}' not found.`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Property listing updated successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Could not update property.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * DELETE /api/properties/:id
   */
  public static async deleteProperty(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const userId = req.user?.id;
      const deleted = await PropertyService.deleteProperty(id, userId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: `Property with id '${id}' not found.`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Property listing deleted successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Could not delete property.',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export default PropertyController;
