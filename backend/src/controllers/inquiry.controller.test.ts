import { describe, it, expect } from 'vitest';
import { InquiryController } from './inquiry.controller';
import { Request, Response } from 'express';

describe('Inquiry Controller & Service Integration', () => {
  it('create inquiry rejects missing required fields with 400 Bad Request', async () => {
    const req = { body: { name: 'Test' } } as unknown as Request;
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

    await InquiryController.create(req, res as any);

    expect(statusSent).toBe(400);
    expect(jsonSent.success).toBe(false);
    expect(jsonSent.error).toMatch(/required/i);
  });

  it('create inquiry successfully creates lead and returns 201 Created', async () => {
    const req = {
      body: {
        name: 'Sofia Laurel',
        email: 'sofia.laurel@gmail.com',
        phone: '+63 917 111 2233',
        propertyId: 'a1111111-1111-1111-1111-111111111111',
        message: 'Requesting a private weekend tour.',
        type: 'tour',
      },
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

    await InquiryController.create(req, res as any);

    expect(statusSent).toBe(201);
    expect(jsonSent.success).toBe(true);
    expect(jsonSent.data.name).toBe('Sofia Laurel');
    expect(jsonSent.data.email).toBe('sofia.laurel@gmail.com');
    expect(jsonSent.data.status).toBe('new');
  });

  it('list inquiries returns 200 OK with inquiry array', async () => {
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

    await InquiryController.list(req, res as any);

    expect(statusSent).toBe(200);
    expect(jsonSent.success).toBe(true);
    expect(Array.isArray(jsonSent.data)).toBe(true);
    expect(jsonSent.data.length).toBeGreaterThan(0);
  });

  it('getById returns 404 for unknown inquiry ID', async () => {
    const req = { params: { id: 'unknown-inq-9999' } } as unknown as Request;
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

    await InquiryController.getById(req, res as any);

    expect(statusSent).toBe(404);
    expect(jsonSent.success).toBe(false);
  });

  it('update inquiry updates status and returns 200 OK', async () => {
    // First create an inquiry to update
    const createReq = {
      body: {
        name: 'Update Target Client',
        email: 'target@luxury.ph',
        message: 'Initial inquiry message',
      },
    } as unknown as Request;

    let createdId = '';
    const createRes = {
      status: () => createRes,
      json: (p: any) => {
        createdId = p.data.id;
        return createRes;
      },
    } as unknown as Response;

    await InquiryController.create(createReq, createRes as any);

    const updateReq = {
      params: { id: createdId },
      body: { status: 'contacted' },
    } as unknown as Request;

    let updateStatus = 0;
    let updateJson: any = null;

    const updateRes = {
      status: (c: number) => {
        updateStatus = c;
        return updateRes;
      },
      json: (p: any) => {
        updateJson = p;
        return updateRes;
      },
    } as unknown as Response;

    await InquiryController.update(updateReq, updateRes as any);

    expect(updateStatus).toBe(200);
    expect(updateJson.success).toBe(true);
    expect(updateJson.data.status).toBe('contacted');
  });

  it('delete inquiry deletes record and returns 200 OK', async () => {
    const createReq = {
      body: {
        name: 'To Delete Client',
        email: 'delete@luxury.ph',
        message: 'Delete me',
      },
    } as unknown as Request;

    let createdId = '';
    const createRes = {
      status: () => createRes,
      json: (p: any) => {
        createdId = p.data.id;
        return createRes;
      },
    } as unknown as Response;

    await InquiryController.create(createReq, createRes as any);

    const delReq = { params: { id: createdId } } as unknown as Request;
    let delStatus = 0;
    let delJson: any = null;

    const delRes = {
      status: (c: number) => {
        delStatus = c;
        return delRes;
      },
      json: (p: any) => {
        delJson = p;
        return delRes;
      },
    } as unknown as Response;

    await InquiryController.delete(delReq, delRes as any);

    expect(delStatus).toBe(200);
    expect(delJson.success).toBe(true);
  });
});
