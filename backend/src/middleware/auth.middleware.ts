import { Request, Response, NextFunction } from 'express';
import { User } from '@supabase/supabase-js';
import { supabase, supabaseAdmin } from '../config/supabase';
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

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({
        success: false,
        error: `Unauthorized: ${error?.message || 'Invalid or expired session.'}`,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Authoritative profile loading from database
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('id, role, full_name, email, verification_status')
      .eq('id', data.user.id)
      .single();

    if (profileErr || !profile) {
      res.status(503).json({
        success: false,
        error: 'Service Unavailable: Unable to load authoritative profile.',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const userObj = data.user as any;
    userObj.role = profile.role || 'client';
    userObj.profile = profile;
    userObj.verification_status = profile.verification_status;
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
      const { data } = await supabase.auth.getUser(token);
      if (data?.user) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id, role, full_name, email, verification_status')
          .eq('id', data.user.id)
          .single();

        const userObj = data.user as any;
        userObj.role = profile?.role || 'client';
        userObj.profile = profile;
        userObj.verification_status = profile?.verification_status;
        req.user = userObj;
      }
    }
  } catch {
    // Silently continue for optional auth
  }
  next();
};
