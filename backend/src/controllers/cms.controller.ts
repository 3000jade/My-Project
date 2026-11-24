import { Request, Response } from 'express';
import { CmsService } from '../services/cms.service';
import { GoogleDriveService } from '../services/googleDrive.service';
import { cmsContentTypeEnum } from '../schemas/cms.schema';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import type { ApiResponse } from '../types/api';

const ALLOWED_CMS_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

function ok<T>(res: Response<ApiResponse>, data: T, message: string, status = 200) {
  res.status(status).json({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  });
}

function fail(res: Response<ApiResponse>, err: unknown, status = 500) {
  const message = err instanceof Error ? err.message : 'Unexpected server error.';
  res.status(status).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
  });
}

export class CmsController {
  public static async listPublicContents(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const parsed = cmsContentTypeEnum.safeParse(req.params.type);
      if (!parsed.success) {
        fail(res, new Error('Invalid content type.'), 400);
        return;
      }
      const items = await CmsService.listPublicContents(parsed.data);
      ok(res, { items }, 'Public content loaded.');
    } catch (err) {
      fail(res, err);
    }
  }

  public static async getPublicContentBySlug(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const parsed = cmsContentTypeEnum.safeParse(req.params.type);
      if (!parsed.success) {
        fail(res, new Error('Invalid content type.'), 400);
        return;
      }
      const slug = String(req.params.slug || '');
      const item = await CmsService.getPublicContentBySlug(parsed.data, slug);
      if (!item) {
        fail(res, new Error('Published content not found.'), 404);
        return;
      }
      ok(res, { item }, 'Public content loaded.');
    } catch (err) {
      fail(res, err);
    }
  }

  public static async listAdminContents(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const items = await CmsService.listAdminContents(req.query as any);
      ok(res, { items }, 'Admin CMS contents loaded.');
    } catch (err) {
      fail(res, err);
    }
  }

  public static async createContent(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const actorId = req.user?.id || 'admin';
      const item = await CmsService.createContent(actorId, req.body);
      ok(res, { item }, 'Content item created.', 201);
    } catch (err) {
      fail(res, err, 400);
    }
  }

  public static async updateContent(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const item = await CmsService.updateContent(String(req.params.id), req.body);
      ok(res, { item }, 'Content item updated.');
    } catch (err) {
      fail(res, err, 400);
    }
  }

  public static async deleteContent(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      await CmsService.deleteContent(String(req.params.id));
      ok(res, null, 'Content item deleted.');
    } catch (err) {
      fail(res, err, 400);
    }
  }

  public static async uploadMedia(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const file = req.file;
      if (!file) {
        fail(res, new Error('Please attach an image file to upload.'), 400);
        return;
      }

      if (!ALLOWED_CMS_IMAGE_TYPES.has(file.mimetype)) {
        fail(
          res,
          new Error('Unsupported file type. Please upload a JPG, PNG, WebP, or GIF image.'),
          400
        );
        return;
      }

      const uploaded = await GoogleDriveService.uploadListingFile('cms-media', file, 'Photos');
      const uploadedWithProxy = uploaded as typeof uploaded & { proxyUrl?: string };
      const url =
        uploadedWithProxy.proxyUrl ||
        (uploaded.fileId ? `/api/drive/media/${uploaded.fileId}` : uploaded.directImageUrl);

      ok(
        res,
        {
          url,
          fileId: uploaded.fileId,
          fileName: uploaded.fileName || file.originalname,
        },
        'CMS image uploaded.',
        201
      );
    } catch (err) {
      fail(res, err);
    }
  }
}
