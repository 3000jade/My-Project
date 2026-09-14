"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkHealth = void 0;
const health_service_1 = require("../services/health.service");
const checkHealth = (req, res) => {
    const healthData = health_service_1.HealthService.getHealthStatus();
    res.status(200).json({
        status: 'success',
        data: healthData,
        message: 'Backend server is healthy and running smoothly.',
        timestamp: healthData.timestamp,
    });
};
exports.checkHealth = checkHealth;
