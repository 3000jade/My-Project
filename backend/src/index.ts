import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config';
import apiRoutes from './routes';
import { errorHandler } from './middleware/error.middleware';
import logger from './utils/logger';

const app: Express = express();
const port = config.port;

// Global Middleware
app.use(cors({ origin: config.clientOrigin, credentials: true }));
app.use(helmet());
app.use(morgan(config.isProduction ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Master API Routes
app.use('/api', apiRoutes);

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
