import rateLimit from 'express-rate-limit';
import type { ApiResponse } from '../types/api';

/**
 * Strict Rate Limiter for Authentication Endpoints (Login, Register)
 * Prevents brute-force credential stuffing and password guessing.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 10 : 1000, // Relaxed in development/testing
  skip: (req) => process.env.NODE_ENV !== 'production' && (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1'),
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (_req, res) => {
    const payload: ApiResponse = {
      success: false,
      error: 'Too many authentication attempts. Please try again after 15 minutes.',
      timestamp: new Date().toISOString(),
    };
    res.status(429).json(payload);
  },
});

/**
 * General API Rate Limiter
 * Guards public and protected API routes against volumetric abuse.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  skip: (req) => process.env.NODE_ENV !== 'production' && (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1'),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    const payload: ApiResponse = {
      success: false,
      error: 'API rate limit exceeded. Please throttle your requests.',
      timestamp: new Date().toISOString(),
    };
    res.status(429).json(payload);
  },
});
