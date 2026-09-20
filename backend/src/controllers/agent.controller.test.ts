import { describe, it, expect } from 'vitest';
import { AgentController } from './agent.controller';
import { Request, Response } from 'express';

describe('Agent Controller & Service Integration', () => {
  it('list agents returns 200 OK with consultant list', async () => {
    const req = { query: {} } as unknown as Request;
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

    await AgentController.list(req, res as any);

    expect(statusSent).toBe(200);
    expect(jsonSent.success).toBe(true);
    expect(Array.isArray(jsonSent.data)).toBe(true);
    expect(jsonSent.data.length).toBeGreaterThan(0);
    expect(jsonSent.data[0]).toHaveProperty('prc_license_no');
  });

  it('getById returns 404 for non-existent consultant', async () => {
    const req = { params: { id: 'unknown-agent-9999' } } as unknown as Request;
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

    await AgentController.getById(req, res as any);

    expect(statusSent).toBe(404);
    expect(jsonSent.success).toBe(false);
  });

  it('getById returns 200 OK with consultant details for valid ID', async () => {
    const req = { params: { id: 'agent-1' } } as unknown as Request;
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

    await AgentController.getById(req, res as any);

    expect(statusSent).toBe(200);
    expect(jsonSent.success).toBe(true);
    expect(jsonSent.data.name).toBe('Elena Rossi');
    expect(jsonSent.data.verification_status).toBe('VERIFIED');
  });

  it('updateStatus updates verification status and returns 200 OK', async () => {
    const req = {
      params: { id: 'agent-3' },
      body: { verification_status: 'VERIFIED' },
    } as unknown as Request;

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

    await AgentController.updateStatus(req, res as any);

    expect(statusSent).toBe(200);
    expect(jsonSent.success).toBe(true);
    expect(jsonSent.data.verification_status).toBe('VERIFIED');
  });
});
