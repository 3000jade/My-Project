import { describe, it, expect } from 'vitest';
import { AppointmentController } from './appointment.controller';
import { Request, Response } from 'express';

describe('Appointment Controller & Service Integration', () => {
  it('list appointments returns 200 OK with appointments array', async () => {
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

    await AppointmentController.list(req, res as any);

    expect(statusSent).toBe(200);
    expect(jsonSent.success).toBe(true);
    expect(Array.isArray(jsonSent.data)).toBe(true);
    expect(jsonSent.data.length).toBeGreaterThan(0);
    expect(jsonSent.data[0]).toHaveProperty('appointment_date');
  });

  it('create appointment rejects missing required fields with 400 Bad Request', async () => {
    const req = { body: { client_name: 'Test Client' } } as unknown as Request;
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

    await AppointmentController.create(req, res as any);

    expect(statusSent).toBe(400);
    expect(jsonSent.success).toBe(false);
  });

  it('create appointment successfully books an appointment and returns 201 Created', async () => {
    const req = {
      body: {
        client_name: 'Don Jaime Zobel',
        client_email: 'jaime@ayala.ph',
        client_phone: '+63 917 999 1122',
        property_id: '1',
        property_title: 'Ayala Alabang Estate',
        appointment_date: '2026-10-05',
        appointment_time: '10:00 AM',
        appointment_type: 'Site Visit',
        notes: 'VIP Family inspection',
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

    await AppointmentController.create(req, res as any);

    expect(statusSent).toBe(201);
    expect(jsonSent.success).toBe(true);
    expect(jsonSent.data.client_name).toBe('Don Jaime Zobel');
    expect(jsonSent.data.status).toBe('REQUESTED');
  });

  it('update appointment updates status / schedule and returns 200 OK', async () => {
    // First create an appointment
    const createReq = {
      body: {
        client_name: 'Update Target',
        client_email: 'update@client.ph',
        client_phone: '+63 917 000 1111',
        property_id: '1',
        appointment_date: '2026-10-10',
        appointment_time: '02:00 PM',
        appointment_type: 'Site Visit',
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

    await AppointmentController.create(createReq, createRes as any);

    const updateReq = {
      params: { id: createdId },
      body: { status: 'CONFIRMED' },
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

    await AppointmentController.update(updateReq, updateRes as any);

    expect(updateStatus).toBe(200);
    expect(updateJson.success).toBe(true);
    expect(updateJson.data.status).toBe('CONFIRMED');
  });

  it('getById returns 404 for unknown appointment', async () => {
    const req = { params: { id: 'unknown-apt-9999' } } as unknown as Request;
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

    await AppointmentController.getById(req, res as any);

    expect(statusSent).toBe(404);
    expect(jsonSent.success).toBe(false);
  });
});
