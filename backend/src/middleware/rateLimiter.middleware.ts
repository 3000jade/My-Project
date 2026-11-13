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
 * Strict Rate Limiter for File and Document Upload Endpoints
 * Prevents storage exhaustion and DoS via unbounded multipart uploads.
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 25 : 500, // Throttled in production, relaxed for tests
  skip: (req) => process.env.NODE_ENV !== 'production' && (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1'),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    const payload: ApiResponse = {
      success: false,
      error: 'Upload rate limit exceeded. Please wait before uploading more documents.',
      timestamp: new Date().toISOString(),
    };
    res.status(429).json(payload);
  },
});

/**
 * Strict Rate Limiter for AI Chat Concierge Endpoint
 * Guards against LLM API credit exhaustion and volumetric abuse.
 */
export const chatRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 20 : 500,
  skip: (req) => process.env.NODE_ENV !== 'production' && (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1'),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    const payload: ApiResponse = {
      success: false,
      error: 'Too many chat requests. Please wait a few minutes or connect with a licensed agent.',
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
