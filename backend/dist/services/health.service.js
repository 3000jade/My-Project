"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthService = void 0;
class HealthService {
    static getHealthStatus() {
        return {
            status: 'UP',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            memoryUsage: process.memoryUsage(),
        };
    }
}
exports.HealthService = HealthService;
