import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import propertyRoutes from './property.routes';
import valuationRoutes from './valuation.routes';
import inquiryRoutes from './inquiry.routes';
import agentRoutes from './agent.routes';
import appointmentRoutes from './appointment.routes';
import chatRoutes from './chat.routes';
import profileRoutes from './profile.routes';

const router = Router();

// Master API Routes Table
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/properties', propertyRoutes);
router.use('/valuations', valuationRoutes);
router.use('/inquiries', inquiryRoutes);
router.use('/agents', agentRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/chat', chatRoutes);
router.use('/profile', profileRoutes);

export default router;
