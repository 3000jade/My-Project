import { Request, Response } from 'express';
import { subdivisionService } from '../services/subdivision.service';
import { subdivisionAiService } from '../services/subdivisionAi.service';
import { subdivisionValidationService } from '../services/subdivisionValidation.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import type { ApiResponse } from '../types/api';
import logger from '../utils/logger';

export class SubdivisionController {
  /**
   * GET /api/subdivisions — List all subdivision projects
   */
  static async listProjects(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const projects = await subdivisionService.listProjects();
      res.status(200).json({
        success: true,
        data: projects,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      logger.error('[SubdivisionController] listProjects failed:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to list subdivision projects',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/subdivisions — Create a new subdivision project (FR-001)
   */
  static async createProject(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const { name, developer_name, location_address, city, province_state, latitude, longitude, status } = req.body;

      if (!name || !location_address || !city) {
        res.status(400).json({
          success: false,
          error: 'Subdivision name, location_address, and city are required fields.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const project = await subdivisionService.createProject(
        {
          name,
          developer_name,
          location_address,
          city,
          province_state,
          latitude: latitude ? Number(latitude) : undefined,
          longitude: longitude ? Number(longitude) : undefined,
          status,
        },
        req.user?.id
      );

      res.status(201).json({
        success: true,
        data: project,
        message: 'Subdivision project created successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      logger.error('[SubdivisionController] createProject failed:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to create subdivision project',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/subdivisions/:id — Get subdivision details
   */
  static async getProjectById(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = String(req.params.id);
      const project = await subdivisionService.getProjectById(id);

      if (!project) {
        res.status(404).json({
          success: false,
          error: 'Subdivision project not found',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const activePlan = await subdivisionService.getActivePlan(id);
      const draftLots = await subdivisionService.getDraftLots(id);

      res.status(200).json({
        success: true,
        data: {
          ...project,
          activePlan,
          lotsCount: draftLots.length,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      logger.error('[SubdivisionController] getProjectById failed:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to get subdivision project',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/subdivisions/:id/plans — Upload or attach master plan image (FR-002, FR-003)
   */
  static async uploadPlan(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const projectId = String(req.params.id);
      const file = req.file;
      const { plan_title, image_url, image_width, image_height } = req.body;

      let resolvedImageUrl = image_url;
      let fileName = file?.originalname;
      let fileSizeBytes = file?.size;

      // If file uploaded via multipart
      if (file) {
        // Enforce format (FR-002: JPG, PNG, WebP)
        const allowedMime = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedMime.includes(file.mimetype)) {
          res.status(400).json({
            success: false,
            error: 'Invalid file format. Master plan must be a JPG, PNG, or WebP image.',
            timestamp: new Date().toISOString(),
          });
          return;
        }

        // Enforce size (max 15MB)
        if (file.size > 15 * 1024 * 1024) {
          res.status(400).json({
            success: false,
            error: 'File size exceeds limit. Maximum allowed size is 15MB.',
            timestamp: new Date().toISOString(),
          });
          return;
        }

        // Convert file buffer to base64 data URL
        resolvedImageUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      }

      // If neither file nor image_url provided, register as blank drafting canvas
      if (typeof resolvedImageUrl !== 'string') {
        resolvedImageUrl = '';
      }

      const plan = await subdivisionService.addPlan(
        projectId,
        {
          plan_title: plan_title || 'Master Cadastral Site Plan',
          image_url: resolvedImageUrl,
          file_name: fileName,
          file_size_bytes: fileSizeBytes,
          image_width: Number(image_width) || 1600,
          image_height: Number(image_height) || 1000,
        },
        req.user?.id
      );

      res.status(201).json({
        success: true,
        data: plan,
        message: 'Master plan uploaded and registered successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      logger.error('[SubdivisionController] uploadPlan failed:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to upload plan image',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/subdivisions/:id/plans/active — Get active master plan graphic
   */
  static async getActivePlan(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const projectId = String(req.params.id);
      const plan = await subdivisionService.getActivePlan(projectId);

      res.status(200).json({
        success: true,
        data: plan,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to retrieve active plan',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/subdivisions/:id/lots — Get working draft lots for editor
   */
  static async getDraftLots(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const projectId = String(req.params.id);
      const lots = await subdivisionService.getDraftLots(projectId);

      res.status(200).json({
        success: true,
        data: lots,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to get draft lots',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * PUT /api/subdivisions/:id/lots — Batch save working draft lots (FR-011)
   */
  static async batchSaveLots(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const projectId = String(req.params.id);
      const { plan_id, lots } = req.body;

      if (!Array.isArray(lots)) {
        res.status(400).json({
          success: false,
          error: 'lots must be an array of lot boundary records',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const savedLots = await subdivisionService.batchSaveDraftLots(
        projectId,
        plan_id || 'default',
        lots,
        req.user?.id
      );

      res.status(200).json({
        success: true,
        data: savedLots,
        message: `Successfully saved ${savedLots.length} lot drafts`,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      logger.error('[SubdivisionController] batchSaveLots failed:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to batch save draft lots',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/subdivisions/:id/validate — Pre-flight validation scan (FR-031, FR-032)
   */
  static async validateDraft(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const projectId = String(req.params.id);
      const validation = await subdivisionService.validateProjectDraft(projectId);

      res.status(200).json({
        success: true,
        data: validation,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to validate subdivision draft',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/subdivisions/:id/publish — Publish new immutable map version (FR-033, FR-036)
   */
  static async publishVersion(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const projectId = String(req.params.id);
      const { plan_id, notes } = req.body;

      const result = await subdivisionService.publishMapVersion(
        projectId,
        plan_id || 'default',
        notes,
        req.user?.id || 'b0000000-0000-0000-0000-000000000001'
      );

      if (!result.success) {
        res.status(422).json({
          success: false,
          error: 'Publication blocked: Pre-flight validation failed.',
          data: result.validation,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: result.version,
        message: `Version ${result.version?.version_number} published successfully to public visitors`,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      logger.error('[SubdivisionController] publishVersion failed:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to publish map version',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/subdivisions/:id/versions — List version history
   */
  static async listVersions(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const projectId = String(req.params.id);
      const versions = await subdivisionService.listVersions(projectId);

      res.status(200).json({
        success: true,
        data: versions,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to list versions',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/subdivisions/:id/versions/:version/restore — 1-Click Rollback (FR-036)
   */
  static async restoreVersion(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const projectId = String(req.params.id);
      const versionNumber = parseInt(String(req.params.version), 10);

      if (isNaN(versionNumber)) {
        res.status(400).json({
          success: false,
          error: 'Invalid version number parameter',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await subdivisionService.restoreVersion(
        projectId,
        versionNumber,
        req.user?.id || 'b0000000-0000-0000-0000-000000000001'
      );

      res.status(200).json({
        success: true,
        data: result,
        message: `Successfully restored subdivision map to historical Version ${versionNumber}`,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      logger.error('[SubdivisionController] restoreVersion failed:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to restore map version',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/subdivisions/ai/detect-boundary — AI Boundary Detection (FR-012, FR-013)
   */
  static async detectAiBoundary(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { imageBase64, imageUrl, cropBox, clickPoint, imageWidth, imageHeight } = req.body;

      const result = await subdivisionAiService.detectLotBoundary({
        imageBase64,
        imageUrl,
        cropBox,
        clickPoint,
        imageWidth,
        imageHeight,
      });

      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      logger.error('[SubdivisionController] detectAiBoundary failed:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to detect boundary with AI',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/subdivisions/ai/recognize-labels — AI Block & Lot OCR Recognition (FR-019)
   */
  static async recognizeAiLabels(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { imageBase64, imageUrl, cropBox } = req.body;

      const result = await subdivisionAiService.recognizeBlockAndLotLabels({
        imageBase64,
        imageUrl,
        cropBox,
      });

      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      logger.error('[SubdivisionController] recognizeAiLabels failed:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to recognize labels with AI',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/subdivisions/:id/ai/auto-layout — AI Whole-Blueprint Auto-Layout (FR-SM-049)
   */
  static async autoLayoutPlan(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const projectId = String(req.params.id);
      const plan = await subdivisionService.getActivePlan(projectId);
      const project = await subdivisionService.getProjectById(projectId);

      const { imageBase64 } = req.body;
      const imageUrl = req.body.imageUrl || plan?.image_url;
      const imageWidth = Number(req.body.imageWidth) || plan?.image_width || 1600;
      const imageHeight = Number(req.body.imageHeight) || plan?.image_height || 1000;

      const result = await subdivisionAiService.autoLayoutSubdivisionPlan({
        imageBase64,
        imageUrl,
        imageWidth,
        imageHeight,
        latitude: project?.latitude || undefined,
        longitude: project?.longitude || undefined,
      });

      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      logger.error('[SubdivisionController] autoLayoutPlan failed:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to auto-layout subdivision plan with AI',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/subdivisions/:id/public-map — Public Interactive Visitor Map (FR-038 to FR-043)
   */
  static async getPublicMap(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const projectId = String(req.params.id);
      const publicMap = await subdivisionService.getPublicPublishedMap(projectId);

      if (!publicMap) {
        res.status(404).json({
          success: false,
          error: 'Subdivision map not found or has not been published',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: publicMap,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      logger.error('[SubdivisionController] getPublicMap failed:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to retrieve public subdivision map',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
