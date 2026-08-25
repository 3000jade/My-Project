import { Request, Response } from 'express';

export const checkHealth = (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Backend server is healthy and running smoothly.',
    timestamp: new Date().toISOString(),
  });
};
