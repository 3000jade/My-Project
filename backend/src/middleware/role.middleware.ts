import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import type { ApiResponse } from '../types/api';

/**
 * Middleware factory for Role-Based Access Control (RBAC)
 * Enforces that the authenticated user possesses at least one of the allowed roles.
 * 'admin' role automatically has global access.
 */
export const requireRole = (allowedRoles: string[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): void => {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized: Authentication required before checking roles.',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const userRole = (user as any).role || user.user_metadata?.role || 'client';

    // Superuser bypass: admin is always permitted
    if (userRole === 'admin') {
      next();
      return;
    }

    if (allowedRoles.includes(userRole)) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      error: `Forbidden: You do not have permission to access this resource. Required role: [${allowedRoles.join(
        ', '
      )}], your role: '${userRole}'.`,
      timestamp: new Date().toISOString(),
    });
  };
};

export default requireRole;
