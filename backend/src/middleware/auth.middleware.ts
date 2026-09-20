import { Request, Response, NextFunction } from 'express';
import { User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import type { ApiResponse } from '../types/api';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

/**
 * Middleware that requires a valid Supabase Bearer token in the Authorization header.
 */
export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized: Missing or malformed Bearer token.',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Development / mock fallback token handling
    if (token.startsWith('dev-mock-jwt-token')) {
      req.user = {
        id: 'dev-mock-uid-12345',
        email: token.includes('broker') ? 'broker@pt.com' : 'agent@pt.com',
        role: token.includes('broker') ? 'broker' : 'agent',
        user_metadata: {
          role: token.includes('broker') ? 'broker' : 'agent',
        },
      } as any;
      next();
      return;
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({
        success: false,
        error: `Unauthorized: ${error?.message || 'Invalid or expired session.'}`,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const userObj = data.user as any;
    userObj.role = userObj.user_metadata?.role || 'agent';
    req.user = userObj;
    next();
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: `Authentication failed: ${err.message || 'Internal server error'}`,
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Middleware that attaches user to req if a valid token is provided,
 * but does not reject requests without tokens (allows guest access).
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token.startsWith('dev-mock-jwt-token')) {
        req.user = {
          id: token.includes('broker') ? 'user-broker-1' : 'user-agent-1',
          email: token.includes('broker') ? 'broker@pt.com' : 'agent@pt.com',
          role: token.includes('broker') ? 'broker' : 'agent',
          user_metadata: {
            role: token.includes('broker') ? 'broker' : 'agent',
          },
        } as any;
        next();
        return;
      }
      const { data } = await supabase.auth.getUser(token);
      if (data?.user) {
        const userObj = data.user as any;
        userObj.role = userObj.user_metadata?.role || 'agent';
        req.user = userObj;
      }
    }
  } catch {
    // Silently continue for optional auth
  }
  next();
};
