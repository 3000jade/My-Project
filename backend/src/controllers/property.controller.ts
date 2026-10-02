import { Request, Response } from 'express';
import { PropertyService } from '../services/property.service';
import { GoogleDriveService } from '../services/googleDrive.service';
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
      const {
        city,
        propertyType,
        transactionType,
        minPrice,
        maxPrice,
        beds,
        baths,
        status,
        standardStatus,
        agentId,
        search,
        page,
        limit,
        $filter,
        $select,
        $expand,
        $top,
        $skip,
        $orderby,
      } = req.query;

      const userRole = (req as AuthenticatedRequest).user?.role;

      const result = await PropertyService.findProperties(
        {
          city: city as string,
          propertyType: propertyType as string,
          transactionType: transactionType as string,
          minPrice: minPrice ? Number(minPrice) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
          beds: beds ? Number(beds) : undefined,
          baths: baths ? Number(baths) : undefined,
          status: status as string,
          standardStatus: standardStatus as string,
          agentId: agentId as string,
          search: search as string,
          page: page ? Number(page) : undefined,
          limit: limit ? Number(limit) : undefined,
          $filter: $filter as string,
          $select: $select as string,
          $expand: $expand as string,
          $top: $top ? Number($top) : undefined,
          $skip: $skip ? Number($skip) : undefined,
          $orderby: $orderby as string,
        },
        userRole
      );

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
      const expand = (req.query.$expand as string) || (req.query.expand as string);
      const userRole = (req as AuthenticatedRequest).user?.role;

      const property = await PropertyService.findPropertyById(id, expand, userRole);

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
      const userRole = req.user?.role;
      const created = await PropertyService.createProperty(req.body, userId, userRole);

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
      const userRole = req.user?.role;
      const updated = await PropertyService.updateProperty(id, req.body, userId, userRole);

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
      const statusCode = err.message?.startsWith('Forbidden') ? 403 : 400;
      res.status(statusCode).json({
        success: false,
        error: err.message || 'Could not update property.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/properties/:id/media
   */
  public static async uploadMedia(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const propertyId = String(req.params.id);
      const files = req.files as Express.Multer.File[];
      const category = (req.body.category as any) || 'Photos';

      if (!files || files.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No files provided for upload.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const results = [];
      for (const file of files) {
        const result = await GoogleDriveService.uploadListingFile(propertyId, file, category);
        results.push(result);
      }

      res.status(200).json({
        success: true,
        data: results,
        message: `Successfully uploaded ${results.length} file(s).`,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error uploading media.',
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
