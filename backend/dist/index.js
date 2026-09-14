"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const config_1 = __importDefault(require("./config"));
const routes_1 = __importDefault(require("./routes"));
const error_middleware_1 = require("./middleware/error.middleware");
const logger_1 = __importDefault(require("./utils/logger"));
const app = (0, express_1.default)();
const port = config_1.default.port;
// Global Middleware
app.use((0, cors_1.default)({ origin: config_1.default.clientOrigin, credentials: true }));
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)(config_1.default.isProduction ? 'combined' : 'dev'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Master API Routes
app.use('/api', routes_1.default);
// Base Root Route
app.get('/', (req, res) => {
    res.send('CP_kerby Backend API is running...');
});
// Error handling middleware
app.use(error_middleware_1.errorHandler);
app.listen(port, () => {
    logger_1.default.info(`Server is running at http://localhost:${port} in ${config_1.default.nodeEnv} mode`);
});
exports.default = app;
