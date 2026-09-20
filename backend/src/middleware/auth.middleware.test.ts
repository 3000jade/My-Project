import { describe, it, expect } from 'vitest';
import { requireAuth, optionalAuth, AuthenticatedRequest } from './auth.middleware';
import { Response } from 'express';

describe('Backend Auth Middleware', () => {
  it('requireAuth should reject with 401 when Authorization header is missing', async () => {
    const req = { headers: {} } as AuthenticatedRequest;
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

    await requireAuth(req, res as any, next);

    expect(statusSent).toBe(401);
    expect(jsonSent?.success).toBe(false);
    expect(jsonSent?.error).toMatch(/Missing or malformed Bearer token/);
    expect(nextCalled).toBe(false);
  });

  it('requireAuth should reject with 401 when Authorization header does not start with Bearer', async () => {
    const req = { headers: { authorization: 'Basic 12345' } } as AuthenticatedRequest;
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

    await requireAuth(req, res as any, next);

    expect(statusSent).toBe(401);
    expect(jsonSent?.success).toBe(false);
    expect(nextCalled).toBe(false);
  });

  it('optionalAuth should call next() and succeed when no token is present', async () => {
    const req = { headers: {} } as AuthenticatedRequest;
    const res = {} as Response;
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    await optionalAuth(req, res, next);

    expect(nextCalled).toBe(true);
    expect(req.user).toBeUndefined();
  });
});
