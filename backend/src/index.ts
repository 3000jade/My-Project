import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config';
import apiRoutes from './routes';
import { errorHandler } from './middleware/error.middleware';
import { apiRateLimiter } from './middleware/rateLimiter.middleware';
import logger from './utils/logger';

const app: Express = express();
const port = config.port;

// Global Middleware
const allowedOrigins = Array.isArray(config.clientOrigin)
  ? config.clientOrigin
  : [config.clientOrigin];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile apps, Postman)
      if (!origin) return callback(null, true);

      // Allowed origins from config / environment
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Automatically allow all Vercel deployments (preview & production)
      if (/^https:\/\/.*\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }

      // Allow local development origins
      if (/^http:\/\/localhost(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }

      logger.warn(`CORS blocked for origin: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan(config.isProduction ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Master API Routes (Rate limited to 300 req / 15 min per IP)
app.use('/api', apiRateLimiter, apiRoutes);

// Direct Alias: Support endpoints called without /api prefix (e.g., /auth/login)
app.use(apiRateLimiter, apiRoutes);

// Base Root Route
app.get('/', (req: Request, res: Response) => {
  res.send('CP_kerby Backend API is running...');
});

// Error handling middleware
app.use(errorHandler);

app.listen(port, () => {
  logger.info(`Server is running at http://localhost:${port} in ${config.nodeEnv} mode`);
});

export default app;
