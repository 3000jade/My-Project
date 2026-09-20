import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller';
import { optionalAuth } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { updateProfileSchema } from '../schemas/profile.schema';

const router = Router();

/**
 * GET /api/profile
 * Retrieve current user profile (supports ?role=broker or ?role=agent)
 */
router.get('/', optionalAuth, ProfileController.getProfile);

/**
 * PUT /api/profile
 * Update current user profile
 */
router.put('/', optionalAuth, validateBody(updateProfileSchema), ProfileController.updateProfile);

export default router;
