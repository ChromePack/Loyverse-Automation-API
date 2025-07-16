const { createApp, configureGracefulShutdown } = require('./app');
const config = require('./config');

/**
 * Starts the Express server
 * Handles environment validation, server startup, and graceful shutdown
 */
async function startServer() {
  try {
    // Validate environment configuration
    validateEnvironment();

    // Create Express application
    const app = createApp();

    // Start HTTP server
    const server = await createHttpServer(app);

    // Configure graceful shutdown
    configureGracefulShutdown(server);

    // Log server startup information
    logServerStartup();

    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Validates the environment configuration
 * @throws {Error} If environment validation fails
 */
function validateEnvironment() {
  console.log('Validating environment configuration...');

  try {
    // Configuration validation happens in the config constructor
    console.log('✓ Environment variables validated');
    console.log('✓ Configuration loaded successfully');
  } catch (error) {
    console.error('✗ Environment validation failed:', error.message);
    throw error;
  }
}

/**
 * Creates and starts the HTTP server
 * @param {Express} app - Express application instance
 * @returns {Promise<http.Server>} HTTP server instance
 */
function createHttpServer(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(config.server.port, error => {
      if (error) {
        reject(error);
      } else {
        resolve(server);
      }
    });

    // Handle server errors
    server.on('error', error => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${config.server.port} is already in use`);
      } else {
        console.error('Server error:', error);
      }
      reject(error);
    });
  });
}

/**
 * Logs server startup information
 */
function logServerStartup() {
  const { port, env } = config.server;

  console.log('');
  console.log('🚀 Loyverse Automation API Server Started');
  console.log('==========================================');
  console.log(`📍 Port: ${port}`);
  console.log(`🌍 Environment: ${env}`);
  console.log(`🔗 Health Check: http://localhost:${port}/health`);
  console.log(`📖 API Base URL: http://localhost:${port}/api`);
  console.log('');

  if (env === 'development') {
    console.log('🔧 Development mode enabled');
    console.log('📝 Detailed error messages enabled');
    console.log('🔍 Request logging enabled');
    console.log('');
  }

  console.log('✅ Server is ready to accept connections');
  console.log('');
}

/**
 * Handles uncaught exceptions and unhandled rejections
 */
function setupProcessHandlers() {
  process.on('uncaughtException', error => {
    console.error('Uncaught Exception:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise);
    console.error('Reason:', reason);
    // Don't exit the process, just log the error
  });

  process.on('warning', warning => {
    console.warn('Warning:', warning.message);
    console.warn('Stack:', warning.stack);
  });
}

/**
 * Main entry point
 */
async function main() {
  // Setup process handlers
  setupProcessHandlers();

  // Start the server
  await startServer();
}

// Start the server if this file is run directly
if (require.main === module) {
  main().catch(error => {
    console.error('Failed to start application:', error);
    process.exit(1);
  });
}

module.exports = {
  startServer,
  main
};
