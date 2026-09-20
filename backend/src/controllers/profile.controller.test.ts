import { describe, it, expect } from 'vitest';
import { ProfileController } from './profile.controller';
import { Request, Response } from 'express';

function createMockRes() {
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

  return { res, getStatus: () => statusSent, getJson: () => jsonSent };
}

describe('Profile Controller & Service Integration', () => {
  it('getProfile with role=broker returns Alexander Sterling profile', async () => {
    const req = {
      query: { role: 'broker' },
      user: undefined,
    } as unknown as Request;

    const { res, getStatus, getJson } = createMockRes();
    await ProfileController.getProfile(req as any, res as any);

    expect(getStatus()).toBe(200);
    expect(getJson().success).toBe(true);
    expect(getJson().data.name).toBe('Alexander Sterling');
    expect(getJson().data.role).toBe('broker');
    expect(getJson().data).toHaveProperty('prc_license_no');
    expect(getJson().data).toHaveProperty('dhsud_accreditation_no');
  });

  it('getProfile with role=agent returns Elena Rossi profile', async () => {
    const req = {
      query: { role: 'agent' },
      user: undefined,
    } as unknown as Request;

    const { res, getStatus, getJson } = createMockRes();
    await ProfileController.getProfile(req as any, res as any);

    expect(getStatus()).toBe(200);
    expect(getJson().success).toBe(true);
    expect(getJson().data.name).toBe('Elena Rossi');
    expect(getJson().data.role).toBe('agent');
    expect(getJson().data).toHaveProperty('bio');
  });

  it('updateProfile updates agent contact info and bio', async () => {
    const req = {
      query: { role: 'agent' },
      body: {
        name: 'Elena Rossi-Tan',
        phone: '+63 917 999 8888',
        bio: 'Updated luxury real estate consultant bio with 8 years of prestige property advisory.',
      },
      user: { id: 'user-agent-1', role: 'agent' },
    } as unknown as Request;

    const { res, getStatus, getJson } = createMockRes();
    await ProfileController.updateProfile(req as any, res as any);

    expect(getStatus()).toBe(200);
    expect(getJson().success).toBe(true);
    expect(getJson().data.name).toBe('Elena Rossi-Tan');
    expect(getJson().data.phone).toBe('+63 917 999 8888');
    expect(getJson().data.bio).toContain('Updated luxury real estate consultant');
  });

  it('updateProfile updates broker information and firm details', async () => {
    const req = {
      query: { role: 'broker' },
      body: {
        name: 'Alexander Sterling Esq.',
        phone: '+63 918 777 6655',
        firm_name: 'Sterling Precision Realty Partners',
      },
      user: { id: 'user-broker-1', role: 'broker' },
    } as unknown as Request;

    const { res, getStatus, getJson } = createMockRes();
    await ProfileController.updateProfile(req as any, res as any);

    expect(getStatus()).toBe(200);
    expect(getJson().success).toBe(true);
    expect(getJson().data.name).toBe('Alexander Sterling Esq.');
    expect(getJson().data.phone).toBe('+63 918 777 6655');
    expect(getJson().data.firm_name).toBe('Sterling Precision Realty Partners');
  });
});
