import rateLimit from 'express-rate-limit';
import type { ApiResponse } from '../types/api';

/**
 * Strict Rate Limiter for Authentication Endpoints (Login, Register)
 * Prevents brute-force credential stuffing and password guessing.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per window
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
