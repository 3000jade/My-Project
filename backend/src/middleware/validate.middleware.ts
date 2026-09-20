import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import type { ApiResponse } from '../types/api';

/**
 * Middleware factory that validates request body against a Zod schema
 */
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map(
          (issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`
        );
        res.status(400).json({
          success: false,
          error: errorMessages.join(' | '),
          data: { issues: error.issues },
          timestamp: new Date().toISOString(),
        });
        return;
      }
      res.status(400).json({
        success: false,
        error: 'Invalid request payload format.',
        timestamp: new Date().toISOString(),
      });
    }
  };
};

/**
 * Middleware factory that validates request query params against a Zod schema
 */
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.query);
      Object.defineProperty(req, 'query', {
        value: parsed,
        writable: true,
        configurable: true,
        enumerable: true,
      });
      next();
    } catch (error: any) {
      if (error instanceof ZodError || error?.name === 'ZodError') {
        const issues = error.issues || [];
        const errorMessages = issues.map(
          (issue: any) => `${issue.path?.join('.') || 'query'}: ${issue.message}`
        );
        res.status(400).json({
          success: false,
          error: errorMessages.join(' | ') || 'Validation error',
          data: { issues },
          timestamp: new Date().toISOString(),
        });
        return;
      }
      next(error);
    }
  };
};
