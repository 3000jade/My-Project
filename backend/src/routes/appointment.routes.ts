import { Router } from 'express';
import { AppointmentController } from '../controllers/appointment.controller';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validateBody, validateQuery } from '../middleware/validate.middleware';
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  queryAppointmentSchema,
} from '../schemas/appointment.schema';

const router = Router();

// Booking route: works for both public prospective leads (optionalAuth) and authenticated users
router.post(
  '/',
  optionalAuth,
  validateBody(createAppointmentSchema),
  AppointmentController.create
);

// Authenticated list: agents see assigned, brokers see firm-wide
router.get(
  '/',
  requireAuth,
  validateQuery(queryAppointmentSchema),
  AppointmentController.list
);

// Authenticated detail lookup
router.get('/:id', requireAuth, AppointmentController.getById);

// Update status / reschedule appointment
router.put(
  '/:id',
  requireAuth,
  validateBody(updateAppointmentSchema),
  AppointmentController.update
);

// Delete appointment (Brokers & Admins)
router.delete(
  '/:id',
  requireAuth,
  requireRole(['broker', 'admin']),
  AppointmentController.delete
);

export default router;
