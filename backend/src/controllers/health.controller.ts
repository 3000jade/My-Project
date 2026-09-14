import { Request, Response } from 'express';
import { HealthService } from '../services/health.service';

export const checkHealth = (req: Request, res: Response): void => {
  const healthData = HealthService.getHealthStatus();
  res.status(200).json({
    status: 'success',
    data: healthData,
    message: 'Backend server is healthy and running smoothly.',
    timestamp: healthData.timestamp,
  });
};
