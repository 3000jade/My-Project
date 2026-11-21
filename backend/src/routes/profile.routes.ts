import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { updateProfileSchema } from '../schemas/profile.schema';

const router = Router();

/**
 * GET /api/profile
 * Retrieve current user profile
 */
router.get('/', requireAuth, ProfileController.getProfile);

/**
 * PUT /api/profile
 * Update current user profile
 */
router.put('/', requireAuth, validateBody(updateProfileSchema), ProfileController.updateProfile);

export default router;
