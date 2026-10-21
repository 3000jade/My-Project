import { Request, Response } from 'express';
import { AppointmentService } from '../services/appointment.service';
import { GmailService } from '../services/gmail.service';
import logger from '../utils/logger';
import type { ApiResponse } from '../types/api';

export class AppointmentController {
  /**
   * GET /api/appointments
   */
  public static async list(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;
      const propertyId = req.query.propertyId as string | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      let agentId = req.query.agentId as string | undefined;
      let clientId = req.query.clientId as string | undefined;
      let clientEmail: string | undefined;
      let brokerageId: string | undefined;

      const user = (req as any).user;
      if (user) {
        if (user.role === 'agent') {
          agentId = user.id || agentId || 'agent-1';
          if (user.brokerage_id) brokerageId = user.brokerage_id;
        } else if (user.role === 'broker' || user.role === 'admin') {
          if (user.brokerage_id) brokerageId = user.brokerage_id;
        } else if (user.role === 'client') {
          clientId = user.id;
          clientEmail = user.email;
        }
      }

      const appointments = await AppointmentService.listAppointments({
        status,
        agentId,
        clientId,
        clientEmail,
        brokerageId,
        propertyId,
        startDate,
        endDate,
        search,
      });

      const data =
        user && user.role === 'client'
          ? appointments.map((a) => AppointmentService.sanitizeForClient(a))
          : appointments;

      res.status(200).json({
        success: true,
        data,
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

      const user = (req as any).user;
      if (user) {
        if (user.role === 'agent' && appointment.agent_id !== user.id) {
          res.status(403).json({
            success: false,
            error: 'Agents may only view appointments assigned to them.',
            timestamp: new Date().toISOString(),
          });
          return;
        }
        if (
          (user.role === 'broker' || user.role === 'admin') &&
          user.brokerage_id &&
          appointment.brokerage_id &&
          appointment.brokerage_id !== user.brokerage_id
        ) {
          res.status(403).json({
            success: false,
            error: 'Cross-brokerage appointment access is forbidden.',
            timestamp: new Date().toISOString(),
          });
          return;
        }
      }

      const data =
        user && user.role === 'client'
          ? AppointmentService.sanitizeForClient(appointment)
          : appointment;

      res.status(200).json({
        success: true,
        data,
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

      const user = (req as any).user;
      const payload = { ...req.body };
      if (user && user.role === 'client' && !payload.client_id) {
        payload.client_id = user.id;
      }

      const appointment = await AppointmentService.createAppointment(payload, { actor: user });

      // Asynchronous notification dispatch via Gmail API
      void GmailService.sendTourConfirmation({
        clientName: appointment.client_name,
        clientEmail: req.body.client_email || 'client@luxuryrealty.test',
        propertyTitle: appointment.property_title || 'Exclusive Residence',
        address: appointment.property_address || 'Metropolitan Luxury Cadastre',
        appointmentTime: `${appointment_date}T${appointment_time}`,
        agentName: appointment.agent_name || 'Estate Concierge',
      }).catch((err) => logger.warn('[AppointmentController] Gmail tour confirmation warning:', err.message));

      res.status(201).json({
        success: true,
        data:
          user && user.role === 'client'
            ? AppointmentService.sanitizeForClient(appointment)
            : appointment,
        message: 'Appointment booked successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const isConflict = /conflict|overlap|buffer|working hours|blocked|blackout|unavailable/i.test(
        err.message || ''
      );
      res.status(isConflict ? 409 : 500).json({
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
      const existing = await AppointmentService.getAppointmentById(id);

      if (!existing) {
        res.status(404).json({
          success: false,
          error: `Appointment with ID "${id}" was not found.`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const user = (req as any).user;
      if (user) {
        if (user.role === 'agent' && existing.agent_id !== user.id) {
          res.status(403).json({
            success: false,
            error: 'Agents can only modify appointments assigned to them.',
            timestamp: new Date().toISOString(),
          });
          return;
        }
        if (
          user.role === 'client' &&
          existing.client_id !== user.id &&
          (!user.email || existing.client_email.toLowerCase() !== user.email.toLowerCase())
        ) {
          res.status(403).json({
            success: false,
            error: 'Clients can only modify their own appointments.',
            timestamp: new Date().toISOString(),
          });
          return;
        }
        if (
          (user.role === 'broker' || user.role === 'admin') &&
          user.brokerage_id &&
          existing.brokerage_id &&
          existing.brokerage_id !== user.brokerage_id
        ) {
          res.status(403).json({
            success: false,
            error: 'Cross-brokerage appointment modification is forbidden.',
            timestamp: new Date().toISOString(),
          });
          return;
        }
      }

      const updated = await AppointmentService.updateAppointment(id, req.body, user);

      res.status(200).json({
        success: true,
        data:
          user && user.role === 'client' && updated
            ? AppointmentService.sanitizeForClient(updated)
            : updated,
        message: 'Appointment updated successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const isConflictOrCutoff = /conflict|overlap|buffer|working hours|blocked|blackout|2 hours|cutoff/i.test(
        err.message || ''
      );
      res.status(isConflictOrCutoff ? 400 : 500).json({
        success: false,
        error: err.message || 'Error updating appointment.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * PATCH /api/appointments/:id/reassign
   */
  public static async reassign(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const id = String(req.params.id);
      const user = (req as any).user;

      if (user && user.role !== 'broker' && user.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Only Brokers or Admins can reassign appointments.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const existing = await AppointmentService.getAppointmentById(id);
      if (!existing) {
        res.status(404).json({
          success: false,
          error: `Appointment with ID "${id}" was not found.`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (
        user?.brokerage_id &&
        existing.brokerage_id &&
        existing.brokerage_id !== user.brokerage_id
      ) {
        res.status(403).json({
          success: false,
          error: 'Cross-brokerage appointment reassignment is forbidden.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const updated = await AppointmentService.reassignAppointment(
        id,
        {
          target_agent_id: req.body.target_agent_id ?? null,
          reason: req.body.reason || 'Broker reassignment',
        },
        user
      );

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Appointment reassigned successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Error reassigning appointment.',
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
