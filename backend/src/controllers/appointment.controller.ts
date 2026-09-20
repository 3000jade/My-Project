import { Request, Response } from 'express';
import { AppointmentService } from '../services/appointment.service';
import type { ApiResponse } from '../types/api';

export class AppointmentController {
  /**
   * GET /api/appointments
   */
  public static async list(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;
      let agentId = req.query.agentId as string | undefined;

      // Role check: If authenticated user is an agent, filter to their own appointments unless explicitly specified
      const user = (req as any).user;
      if (user && user.role === 'agent' && !agentId) {
        agentId = user.id || 'agent-1';
      }

      const appointments = await AppointmentService.listAppointments({
        status,
        agentId,
        search,
      });

      res.status(200).json({
        success: true,
        data: appointments,
        message: 'Appointments retrieved successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error retrieving appointments.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/appointments/:id
   */
  public static async getById(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = String(req.params.id);
      const appointment = await AppointmentService.getAppointmentById(id);

      if (!appointment) {
        res.status(404).json({
          success: false,
          error: `Appointment with ID "${id}" was not found.`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: appointment,
        message: 'Appointment retrieved successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error retrieving appointment.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/appointments
   */
  public static async create(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { client_name, client_phone, property_id, appointment_date, appointment_time } = req.body;

      if (!client_name || !client_phone || !property_id || !appointment_date || !appointment_time) {
        res.status(400).json({
          success: false,
          error: 'client_name, client_phone, property_id, appointment_date, and appointment_time are required.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const appointment = await AppointmentService.createAppointment(req.body);

      res.status(201).json({
        success: true,
        data: appointment,
        message: 'Appointment booked successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error booking appointment.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * PUT /api/appointments/:id
   */
  public static async update(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = String(req.params.id);
      const updated = await AppointmentService.updateAppointment(id, req.body);

      if (!updated) {
        res.status(404).json({
          success: false,
          error: `Appointment with ID "${id}" was not found.`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Appointment updated successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error updating appointment.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * DELETE /api/appointments/:id
   */
  public static async delete(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = String(req.params.id);
      const success = await AppointmentService.deleteAppointment(id);

      res.status(200).json({
        success,
        message: 'Appointment deleted successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error deleting appointment.',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export default AppointmentController;
