import { describe, it, expect } from 'vitest';
import { validateBody } from './validate.middleware';
import { requireRole } from './role.middleware';
import { registerSchema, loginSchema } from '../schemas/auth.schema';
import { Request, Response } from 'express';
import { AuthenticatedRequest } from './auth.middleware';

describe('Security Middlewares (Validation & RBAC)', () => {
  describe('Zod Validation Middleware', () => {
    it('validateBody rejects invalid email with 400', () => {
      const req = {
        body: { email: 'not-an-email', password: 'ValidPassword123!' },
      } as Request;

      let statusSent = 0;
      let jsonSent: any = null;
      const res = {
        status: (code: number) => {
          statusSent = code;
          return res;
        },
        json: (payload: any) => {
          jsonSent = payload;
          return res;
        },
      } as unknown as Response;

      let nextCalled = false;
      const next = () => {
        nextCalled = true;
      };

      const middleware = validateBody(loginSchema);
      middleware(req, res as any, next);

      expect(statusSent).toBe(400);
      expect(jsonSent.success).toBe(false);
      expect(jsonSent.error).toMatch(/Invalid email address format/i);
      expect(nextCalled).toBe(false);
    });

    it('validateBody rejects weak passwords without numbers or special chars with 400', () => {
      const req = {
        body: { email: 'user@pt.com', password: 'weakpassword' },
      } as Request;

      let statusSent = 0;
      let jsonSent: any = null;
      const res = {
        status: (code: number) => {
          statusSent = code;
          return res;
        },
        json: (payload: any) => {
          jsonSent = payload;
          return res;
        },
      } as unknown as Response;

      let nextCalled = false;
      const next = () => {
        nextCalled = true;
      };

      const middleware = validateBody(registerSchema);
      middleware(req, res as any, next);

      expect(statusSent).toBe(400);
      expect(jsonSent.success).toBe(false);
      expect(nextCalled).toBe(false);
    });

    it('validateBody accepts strong password and calls next()', () => {
      const req = {
        body: {
          email: 'valid.agent@pt.com',
          password: 'StrongP@ssword2026!',
          fullName: 'Elena Rossi',
          role: 'agent',
        },
      } as Request;

      const res = {} as Response;
      let nextCalled = false;
      const next = () => {
        nextCalled = true;
      };

      const middleware = validateBody(registerSchema);
      middleware(req, res, next);

      expect(nextCalled).toBe(true);
    });
  });

  describe('RBAC Middleware (requireRole)', () => {
    it('rejects unauthenticated request with 401', () => {
      const req = {} as AuthenticatedRequest;
      let statusSent = 0;
      let jsonSent: any = null;
      const res = {
        status: (code: number) => {
          statusSent = code;
          return res;
        },
        json: (payload: any) => {
          jsonSent = payload;
          return res;
        },
      } as unknown as Response;

      let nextCalled = false;
      const next = () => {
        nextCalled = true;
      };

      const middleware = requireRole(['broker', 'admin']);
      middleware(req, res as any, next);

      expect(statusSent).toBe(401);
      expect(jsonSent.success).toBe(false);
      expect(nextCalled).toBe(false);
    });

    it('rejects agent role when broker is required with 403 Forbidden', () => {
      const req = {
        user: { id: 'agent-1', email: 'agent@pt.com', role: 'agent' },
      } as AuthenticatedRequest;

      let statusSent = 0;
      let jsonSent: any = null;
      const res = {
        status: (code: number) => {
          statusSent = code;
          return res;
        },
        json: (payload: any) => {
          jsonSent = payload;
          return res;
        },
      } as unknown as Response;

      let nextCalled = false;
      const next = () => {
        nextCalled = true;
      };

      const middleware = requireRole(['broker', 'admin']);
      middleware(req, res as any, next);

      expect(statusSent).toBe(403);
      expect(jsonSent.success).toBe(false);
      expect(jsonSent.error).toMatch(/Forbidden/i);
      expect(nextCalled).toBe(false);
    });

    it('permits broker role when broker is required', () => {
      const req = {
        user: { id: 'broker-1', email: 'broker@pt.com', role: 'broker' },
      } as AuthenticatedRequest;

      const res = {} as Response;
      let nextCalled = false;
      const next = () => {
        nextCalled = true;
      };

      const middleware = requireRole(['broker', 'admin']);
      middleware(req, res, next);

      expect(nextCalled).toBe(true);
    });

    it('permits admin role globally even if not in allowedRoles list', () => {
      const req = {
        user: { id: 'admin-1', email: 'admin@pt.com', role: 'admin' },
      } as AuthenticatedRequest;

      const res = {} as Response;
      let nextCalled = false;
      const next = () => {
        nextCalled = true;
      };

      const middleware = requireRole(['client']);
      middleware(req, res, next);

      expect(nextCalled).toBe(true);
    });
  });
});
