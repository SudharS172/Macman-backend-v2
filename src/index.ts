import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';

import { config, isDevelopment } from './config/env';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Import routes
import licenseRoutes from './routes/license.routes';
import updateRoutes from './routes/update.routes';

const app = express();

// Trust proxy for production deployments (Railway, Fly.io, etc.)
if (!isDevelopment) {
  app.set('trust proxy', 1);
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS
app.use(cors({
  origin: config.allowedOrigins,
  credentials: true,
}));

// Request logging
if (isDevelopment) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Stricter rate limiting for license validation
const licenseValidationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20,
  message: 'Too many license validation attempts, please try again later.',
});

app.use('/api/licenses/validate', licenseValidationLimiter);

// Ensure upload directory exists
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
  logger.info(`Created upload directory: ${config.uploadDir}`);
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: config.nodeEnv,
  });
});

// API Routes
app.use('/api/licenses', licenseRoutes);
app.use('/api/v2/updates', updateRoutes);

// Legacy route compatibility (for existing Swift app)
app.post('/api/validate-key', async (_req, res, next) => {
  // Redirect to new endpoint
  _req.url = '/api/licenses/validate';
  return licenseRoutes(_req, res, next);
});

app.get('/api/v2/check-update', async (_req, res, next) => {
  // Redirect to new endpoint
  _req.url = '/api/v2/updates/check';
  return updateRoutes(_req, res, next);
});

// Static files for admin dashboard
app.use(express.static(path.join(__dirname, '../public')));

// Admin dashboard route
app.get('/admin', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// Static files for DMG downloads
app.use('/downloads', express.static(config.uploadDir, {
  setHeaders: (res, filePath) => {
    if (path.extname(filePath) === '.dmg') {
      res.setHeader('Content-Type', 'application/x-apple-diskimage');
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
  },
}));

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    const PORT = config.port;

    app.listen(PORT, () => {
      logger.success(`🚀 MacMan Backend v2 running on port ${PORT}`);
      logger.info(`📊 Environment: ${config.nodeEnv}`);
      logger.info(`🔒 CORS Origins: ${config.allowedOrigins.join(', ')}`);
      logger.info(`📦 Upload Directory: ${config.uploadDir}`);
      logger.info(`🌐 Health Check: http://localhost:${PORT}/health`);
      
      if (isDevelopment) {
        logger.debug(`🔧 Development mode enabled`);
        logger.debug(`📝 API Documentation:`);
        logger.debug(`   - POST /api/licenses/validate`);
        logger.debug(`   - GET  /api/v2/updates/check`);
        logger.debug(`   - GET  /api/v2/updates/download/:version`);
        logger.debug(`   - POST /api/admin/licenses (admin)`);
        logger.debug(`   - GET  /api/admin/updates (admin)`);
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Start the server
startServer();

export default app;

