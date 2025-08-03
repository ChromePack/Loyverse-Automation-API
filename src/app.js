const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');

/**
 * Creates and configures the Express application
 * @returns {Express} Configured Express application
 */
function createApp() {
  const app = express();

  // Security middleware
  configureSecurityMiddleware(app);

  // Logging middleware
  configureLoggingMiddleware(app);

  // Request parsing middleware
  configureParsingMiddleware(app);

  // Route handlers
  configureRoutes(app);

  // Error handling middleware (must be last)
  configureErrorHandling(app);

  return app;
}

/**
 * Configures security-related middleware
 * @param {Express} app - Express application instance
 */
function configureSecurityMiddleware(app) {
  // Basic security headers with less restrictive settings for Cloud Run
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disable CSP for API
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" }
    })
  );

  // CORS configuration
  app.use(cors(config.cors));

  // Request size limits
  app.use(express.json({ limit: config.security.requestSizeLimit }));
  app.use(
    express.urlencoded({
      extended: true,
      limit: config.security.requestSizeLimit
    })
  );
}

/**
 * Configures logging middleware
 * @param {Express} app - Express application instance
 */
function configureLoggingMiddleware(app) {
  // HTTP request logging
  const logFormat = config.server.isDevelopment ? 'dev' : 'combined';

  app.use(morgan(logFormat));

  // Request ID middleware for tracking
  app.use((req, res, next) => {
    req.requestId = generateRequestId();
    res.setHeader('X-Request-ID', req.requestId);
    next();
  });
}

/**
 * Configures request parsing middleware
 * @param {Express} app - Express application instance
 */
function configureParsingMiddleware(app) {
  // Parse JSON requests
  app.use(express.json());

  // Parse URL-encoded requests
  app.use(express.urlencoded({ extended: true }));
}

/**
 * Configures application routes
 * @param {Express} app - Express application instance
 */
function configureRoutes(app) {
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: config.server.env
    });
  });

  // API routes
  app.use('/api', require('./routes'));

  // Handle 404 errors
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${req.method} ${req.originalUrl} not found`,
        timestamp: new Date().toISOString()
      }
    });
  });
}

/**
 * Configures global error handling middleware
 * @param {Express} app - Express application instance
 */
function configureErrorHandling(app) {
  // Global error handler
  app.use((error, req, res, _next) => {
    console.error(`[${req.requestId}] Error:`, error);

    // Handle different error types
    const errorResponse = createErrorResponse(error, req.requestId);

    res.status(errorResponse.statusCode).json({
      success: false,
      error: errorResponse.error
    });
  });

  // Unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  // Uncaught exceptions
  process.on('uncaughtException', error => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
  });
}

/**
 * Creates standardized error response
 * @param {Error} error - The error object
 * @param {string} requestId - Request ID for tracking
 * @returns {Object} Formatted error response
 */
function createErrorResponse(error, requestId) {
  const timestamp = new Date().toISOString();

  // Default error response
  const defaultResponse = {
    statusCode: 500,
    errorCode: 'INTERNAL_SERVER_ERROR',
    message: 'An internal server error occurred'
  };

  let { statusCode, errorCode, message } = defaultResponse;

  // Handle known error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = error.message;
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    errorCode = 'UNAUTHORIZED';
    message = 'Authentication required';
  } else if (error.code === 'ENOENT') {
    statusCode = 404;
    errorCode = 'FILE_NOT_FOUND';
    message = 'Requested file not found';
  } else if (error.message && config.server.isDevelopment) {
    // Show detailed error messages in development
    message = error.message;
  }

  return {
    statusCode,
    error: {
      code: errorCode,
      message,
      timestamp,
      requestId,
      ...(config.server.isDevelopment && { stack: error.stack })
    }
  };
}

/**
 * Generates a unique request ID for tracking
 * @returns {string} Unique request ID
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Graceful shutdown handler
 * @param {http.Server} server - HTTP server instance
 */
function configureGracefulShutdown(server) {
  const gracefulShutdown = signal => {
    console.log(`Received ${signal}. Starting graceful shutdown...`);

    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });

    // Force close after timeout
    setTimeout(() => {
      console.error(
        'Could not close connections in time, forcefully shutting down'
      );
      process.exit(1);
    }, 10000);
  };

  // Listen for termination signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

module.exports = {
  createApp,
  configureGracefulShutdown
};
