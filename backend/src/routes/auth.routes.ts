import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware';
import { authRateLimiter } from '../middleware/rateLimiter.middleware';
import { validateBody } from '../middleware/validate.middleware';
import {
  identifyEmailSchema,
  loginSchema,
  registerSchema,
  googleAuthSchema,
  registerAgentSchema,
  registerInitiateSchema,
  registerVerifyEmailSchema,
  registerCompleteSchema,
  registerVerifyOtpSchema,
  registerResendOtpSchema,
} from '../schemas/auth.schema';

const router = Router();

router.post('/identify', authRateLimiter, validateBody(identifyEmailSchema), AuthController.identifyEmail);
router.post('/google', authRateLimiter, validateBody(googleAuthSchema), AuthController.googleAuth);
router.post('/login', authRateLimiter, validateBody(loginSchema), AuthController.login);
router.post('/register', authRateLimiter, validateBody(registerSchema), AuthController.register);
router.post('/register-otp/initiate', authRateLimiter, validateBody(registerInitiateSchema), AuthController.initiateRegistrationOtp);
router.post('/register-otp/verify-email', authRateLimiter, validateBody(registerVerifyEmailSchema), AuthController.verifyRegistrationEmail);
router.post('/register-otp/complete', authRateLimiter, validateBody(registerCompleteSchema), AuthController.completeRegistration);
router.post('/register-otp/verify', authRateLimiter, validateBody(registerVerifyOtpSchema), AuthController.verifyRegistrationOtp);
router.post('/register-otp/resend', authRateLimiter, validateBody(registerResendOtpSchema), AuthController.resendRegistrationOtp);
router.post('/register-agent', authRateLimiter, validateBody(registerAgentSchema), AuthController.registerAgent);
router.post('/logout', optionalAuth, AuthController.logout);
router.post('/heartbeat', requireAuth, AuthController.heartbeat);
router.post('/extend-session', requireAuth, AuthController.extendSession);
router.post('/refresh', AuthController.refreshSession);
router.post('/forgot-password', authRateLimiter, AuthController.forgotPassword);
router.post('/reset-password', authRateLimiter, AuthController.resetPassword);
router.post('/change-password', requireAuth, authRateLimiter, AuthController.changePassword);
router.post('/resend-verification', authRateLimiter, AuthController.resendVerification);
router.post('/revoke-all', requireAuth, AuthController.revokeAllSessions);
router.get('/sessions', requireAuth, AuthController.listSessions);
router.delete('/sessions/:sessionId', requireAuth, AuthController.revokeSession);
router.get('/me', requireAuth, AuthController.getMe);

export default router;
