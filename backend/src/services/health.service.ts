export interface HealthStatus {
  status: string;
  uptime: number;
  timestamp: string;
  environment: string;
  memoryUsage: NodeJS.MemoryUsage;
}

export class HealthService {
  public static getHealthStatus(): HealthStatus {
    return {
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      memoryUsage: process.memoryUsage(),
    };
  }
}
