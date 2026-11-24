import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { CmsController } from '../controllers/cms.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validateBody, validateQuery } from '../middleware/validate.middleware';
import {
  createCmsContentSchema,
  updateCmsContentSchema,
  queryCmsContentSchema,
} from '../schemas/cms.schema';

const router = Router();

const cmsImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

function handleCmsImageUpload(req: Request, res: Response, next: NextFunction): void {
  cmsImageUpload.single('file')(req, res, (err: unknown) => {
    if (!err) {
      next();
      return;
    }

    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        error: 'Image file is too large. Maximum size is 10 MB.',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const message = err instanceof Error ? err.message : 'Image upload failed.';
    res.status(400).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    });
  });
}

// Public read-only endpoints (PUBLISHED items only)
router.get('/public/:type', CmsController.listPublicContents);
router.get('/public/:type/:slug', CmsController.getPublicContentBySlug);

// Super Admin CMS endpoints
router.use('/admin', requireAuth, requireRole(['admin']));

router.get('/admin/contents', validateQuery(queryCmsContentSchema), CmsController.listAdminContents);
router.post('/admin/contents', validateBody(createCmsContentSchema), CmsController.createContent);
router.post('/admin/upload', handleCmsImageUpload, CmsController.uploadMedia);
router.patch('/admin/contents/:id', validateBody(updateCmsContentSchema), CmsController.updateContent);
router.delete('/admin/contents/:id', CmsController.deleteContent);

export default router;
