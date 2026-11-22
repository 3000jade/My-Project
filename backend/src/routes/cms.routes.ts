import { Router } from 'express';
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

// Public read-only endpoints (PUBLISHED items only)
router.get('/public/:type', CmsController.listPublicContents);
router.get('/public/:type/:slug', CmsController.getPublicContentBySlug);

// Super Admin CMS endpoints
router.use('/admin', requireAuth, requireRole(['admin']));

router.get('/admin/contents', validateQuery(queryCmsContentSchema), CmsController.listAdminContents);
router.post('/admin/contents', validateBody(createCmsContentSchema), CmsController.createContent);
router.patch('/admin/contents/:id', validateBody(updateCmsContentSchema), CmsController.updateContent);
router.delete('/admin/contents/:id', CmsController.deleteContent);

export default router;
