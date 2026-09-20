import { describe, it, expect, vi } from 'vitest';
import { PropertyController } from './property.controller';
import { ValuationService } from '../services/valuation.service';
import { Request, Response } from 'express';

describe('Property Controller & Services', () => {
  it('listProperties returns paginated list with 200 OK', async () => {
    const req = { query: { page: '1', limit: '2' } } as unknown as Request;
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

    await PropertyController.listProperties(req, res as any);

    expect(statusSent).toBe(200);
    expect(jsonSent.success).toBe(true);
    expect(Array.isArray(jsonSent.data)).toBe(true);
    expect(jsonSent.page).toBe(1);
    expect(jsonSent.limit).toBe(2);
    expect(jsonSent.total).toBeGreaterThan(0);
  });

  it('getProperty returns 404 for non-existent property', async () => {
    const req = { params: { id: 'non-existent-id-9999' } } as unknown as Request;
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

    await PropertyController.getProperty(req, res as any);

    expect(statusSent).toBe(404);
    expect(jsonSent.success).toBe(false);
    expect(jsonSent.error).toMatch(/not found/i);
  });

  it('createProperty rejects with 400 if title is missing', async () => {
    const req = { body: { price: 100000000 } } as unknown as any;
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

    await PropertyController.createProperty(req, res as any);

    expect(statusSent).toBe(400);
    expect(jsonSent.success).toBe(false);
    expect(jsonSent.error).toMatch(/Title and price are required/i);
  });

  it('ValuationService calculates accurate range and confidence score', () => {
    const estimate = ValuationService.calculateEstimate({
      city: 'Makati',
      sqft: 500,
      beds: 4,
      baths: 4,
      finishQuality: 'luxury',
    });

    expect(estimate.estimatedValue).toBeGreaterThan(0);
    expect(estimate.lowRange).toBeLessThan(estimate.estimatedValue);
    expect(estimate.highRange).toBeGreaterThan(estimate.estimatedValue);
    expect(estimate.confidenceScore).toBeGreaterThanOrEqual(80);
    expect(estimate.formattedEstimatedValue).toContain('₱');
  });
});

describe('GET /api/properties/count', () => {
  it('returns a numeric count based on query params', async () => {
    const req = { query: { transactionType: 'For Sale' } } as any;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
    await PropertyController.countProperties(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, count: expect.any(Number) }));
  });
});
