import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { authRateLimiter } from '../middleware/rateLimiter.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { loginSchema, registerSchema } from '../schemas/auth.schema';

const router = Router();

/**
 * POST /api/auth/login
 * Rate limited to 10 attempts/15min, payload validated via Zod loginSchema
 */
router.post('/login', authRateLimiter, validateBody(loginSchema), AuthController.login);

/**
 * POST /api/auth/register
 * Rate limited to 10 attempts/15min, strong password validated via Zod registerSchema
 */
router.post('/register', authRateLimiter, validateBody(registerSchema), AuthController.register);

/**
 * POST /api/auth/logout
 * Invalidate user session
 */
router.post('/logout', AuthController.logout);

/**
 * GET /api/auth/me
 * Protected endpoint returning current user profile
 */
router.get('/me', requireAuth, AuthController.getMe);

export default router;
