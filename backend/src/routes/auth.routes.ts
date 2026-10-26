import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { authRateLimiter } from '../middleware/rateLimiter.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { loginSchema, registerSchema, googleAuthSchema, registerAgentSchema } from '../schemas/auth.schema';

const router = Router();

router.post('/google', authRateLimiter, validateBody(googleAuthSchema), AuthController.googleAuth);
router.post('/login', authRateLimiter, validateBody(loginSchema), AuthController.login);
router.post('/register', authRateLimiter, validateBody(registerSchema), AuthController.register);
router.post('/register-agent', authRateLimiter, validateBody(registerAgentSchema), AuthController.registerAgent);
router.post('/logout', AuthController.logout);
router.post('/heartbeat', requireAuth, AuthController.heartbeat);
router.post('/extend-session', requireAuth, AuthController.extendSession);
router.post('/refresh', AuthController.refreshSession);
router.post('/forgot-password', authRateLimiter, AuthController.forgotPassword);
router.post('/reset-password', authRateLimiter, AuthController.resetPassword);
router.post('/resend-verification', authRateLimiter, AuthController.resendVerification);
router.post('/revoke-all', requireAuth, AuthController.revokeAllSessions);
router.get('/sessions', requireAuth, AuthController.listSessions);
router.delete('/sessions/:sessionId', requireAuth, AuthController.revokeSession);
router.get('/me', requireAuth, AuthController.getMe);

export default router;
