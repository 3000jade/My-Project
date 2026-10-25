import { Request, Response } from 'express';
import { PropertyService } from '../services/property.service';
import { AgentService } from '../services/agent.service';
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
        list_agent_key,
        listAgentKey,
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
          list_agent_key: (list_agent_key || listAgentKey) as string,
          listAgentKey: (list_agent_key || listAgentKey) as string,
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

      // Agents are prohibited from creating property listings unless explicitly granted can_create_listings === true by their Broker
      if (userRole === 'agent') {
        const agentProfile = userId ? await AgentService.getAgentById(userId) : null;
        if (!agentProfile || agentProfile.can_create_listings !== true || agentProfile.verification_status !== 'VERIFIED') {
          res.status(403).json({
            success: false,
            error: 'Forbidden: Agents cannot create property listings (verified or unverified). Creation is restricted to authorized brokers and administrators.',
            timestamp: new Date().toISOString(),
          });
          return;
        }
      }

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

      // Agents are strictly prohibited from direct property mutations
      if (userRole === 'agent') {
        res.status(403).json({
          success: false,
          error: 'Forbidden: Agents cannot directly mutate property listings. Please submit an edit proposal for broker review.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

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

  /**
   * POST /api/properties/:id/propose-edit
   * Proposes modifications to an assigned property listing (Agent only)
   */
  public static async proposeEdit(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const propertyId = String(req.params.id);
      const agentId = req.user?.id;

      if (!agentId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized: User session required.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const proposal = await PropertyService.proposeEdit(propertyId, agentId, {
        proposedChanges: req.body.proposedChanges,
        agentNotes: req.body.agentNotes,
      });

      res.status(201).json({
        success: true,
        data: proposal,
        message: 'Property edit proposal submitted successfully for broker review.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const isConflict = err.message?.includes('Conflict');
      const isForbidden = err.message?.startsWith('Forbidden');
      const statusCode = isConflict ? 409 : isForbidden ? 403 : 400;

      res.status(statusCode).json({
        success: false,
        error: err.message || 'Could not submit property edit proposal.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/properties/edit-requests
   * Lists edit requests with filtering
   */
  public static async getEditRequests(
    req: AuthenticatedRequest,
    res: Response<PaginatedResponse>
  ): Promise<void> {
    try {
      const { status, propertyId, agentId, page, limit } = req.query;
      const userRole = req.user?.role;
      const userId = req.user?.id;

      // If caller is an agent, restrict query strictly to their own requests
      const effectiveAgentId = userRole === 'agent' ? userId : (agentId as string);

      const result = await PropertyService.getEditRequests({
        status: status as string,
        propertyId: propertyId as string,
        agentId: effectiveAgentId,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result.requests,
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        message: 'Edit requests retrieved successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to retrieve edit requests.',
        timestamp: new Date().toISOString(),
      } as any);
    }
  }

  /**
   * GET /api/properties/edit-requests/:requestId
   * Retrieves single edit request with details
   */
  public static async getEditRequestById(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const requestId = String(req.params.requestId);
      const userId = req.user?.id;
      const userRole = req.user?.role;

      const request = await PropertyService.getEditRequestById(requestId, userId, userRole);

      if (!request) {
        res.status(404).json({
          success: false,
          error: `Edit request with id '${requestId}' not found.`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: request,
        message: 'Edit request retrieved successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const statusCode = err.message?.startsWith('Forbidden') ? 403 : 500;
      res.status(statusCode).json({
        success: false,
        error: err.message || 'Error fetching edit request.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/properties/edit-requests/:requestId/approve
   * Approves an edit request and atomically updates live listing (Broker/Admin)
   */
  public static async approveEditRequest(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const requestId = String(req.params.requestId);
      const brokerId = req.user?.id;

      if (!brokerId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized: User session required.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await PropertyService.approveEditRequest(
        requestId,
        brokerId,
        req.body.reviewNotes
      );

      res.status(200).json({
        success: true,
        data: result,
        message: 'Property edit request approved and published successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Could not approve edit request.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/properties/edit-requests/:requestId/reject
   * Rejects an edit request with required remarks (Broker/Admin)
   */
  public static async rejectEditRequest(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const requestId = String(req.params.requestId);
      const brokerId = req.user?.id;
      const { rejectionReason } = req.body;

      if (!brokerId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized: User session required.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (!rejectionReason || !rejectionReason.trim()) {
        res.status(400).json({
          success: false,
          error: 'Rejection reason is required.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await PropertyService.rejectEditRequest(
        requestId,
        brokerId,
        rejectionReason
      );

      res.status(200).json({
        success: true,
        data: result,
        message: 'Property edit request rejected successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Could not reject edit request.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/properties/edit-requests/:requestId/cancel
   * Cancels a pending edit request (Agent)
   */
  public static async cancelEditRequest(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const requestId = String(req.params.requestId);
      const agentId = req.user?.id;

      if (!agentId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized: User session required.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await PropertyService.cancelEditRequest(requestId, agentId);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Property edit request cancelled successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Could not cancel edit request.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * PATCH /api/properties/:id/accept-assignment
   * Assigned agent accepts listing assignment (or Admin)
   */
  public static async acceptAssignment(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const propertyId = String(req.params.id);
      const userId = req.user?.id;
      const role = req.user?.role;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized: User session required.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await PropertyService.acceptAssignment(propertyId, userId, role);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Property assignment accepted. Listing is now Active and published.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(err.message?.includes('Forbidden') ? 403 : 400).json({
        success: false,
        error: err.message || 'Could not accept property assignment.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * PATCH /api/properties/:id/decline-assignment
   * Assigned agent declines listing assignment
   */
  public static async declineAssignment(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const propertyId = String(req.params.id);
      const userId = req.user?.id;
      const role = req.user?.role;
      const reason = req.body?.reason;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized: User session required.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await PropertyService.declineAssignment(propertyId, userId, reason, role);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Property assignment declined. Broker notified for action.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(err.message?.includes('Forbidden') ? 403 : 400).json({
        success: false,
        error: err.message || 'Could not decline property assignment.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * PATCH /api/properties/:id/reassign-agent
   * Broker or Admin reassigns property to a different agent
   */
  public static async reassignAgent(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const propertyId = String(req.params.id);
      const userId = req.user?.id;
      const newAgentId = req.body?.newAgentId || req.body?.agentId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized: User session required.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (!newAgentId) {
        res.status(400).json({
          success: false,
          error: 'newAgentId is required in request body.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await PropertyService.reassignAgent(propertyId, userId, newAgentId);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Property listing reassigned. Confirmation pending from new agent.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Could not reassign property agent.',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export default PropertyController;
