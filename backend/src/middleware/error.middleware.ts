import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err.stack);
  const isProd = process.env.NODE_ENV === 'production';
  res.status(500).json({
    status: 'error',
    message: isProd ? 'Internal Server Error' : (err.message || 'Internal Server Error'),
  });
};
