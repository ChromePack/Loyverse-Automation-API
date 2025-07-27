const express = require('express');
const { WebhookService } = require('../services/WebhookService');
const { Logger } = require('../utils/logger');
const { ERROR_CODES } = require('../constants');

const router = express.Router();
const webhookService = new WebhookService();

/**
 * Health check routes
 * Provides comprehensive health monitoring and system status
 *
 * Following Clean Code principles:
 * - Single Responsibility: Only handles health check operations
 * - Open/Closed: Extensible for new health checks
 * - Dependency Inversion: Depends on service abstractions
 */

// Request logging middleware for health routes
router.use((req, res, next) => {
  Logger.info('Health check accessed', {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

/**
 * Health check endpoint
 * GET /api/health
 */
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

/**
 * Webhook health check endpoint
 * GET /api/health/webhook
 */
router.get('/webhook', (req, res) => {
  const validation = webhookService.validateConfig();
  
  res.json({
    status: validation.isValid ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    webhook: {
      enabled: webhookService.config.enabled,
      url: webhookService.config.url,
      timeout: webhookService.config.timeout,
      maxRetries: webhookService.config.maxRetries,
      retryDelay: webhookService.config.retryDelay,
      validation: validation
    }
  });
});

/**
 * Test webhook endpoint
 * POST /api/health/webhook/test
 */
router.post('/webhook/test', async (req, res) => {
  const requestId = req.requestId;
  Logger.info('Testing webhook connectivity', { requestId });

  const testPayload = {
    success: true,
    jobId: 'test-' + Date.now(),
    status: 'test',
    result: { message: 'This is a test webhook call' },
    error: null,
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString()
  };

  try {
    const success = await webhookService.sendWebhook(testPayload, testPayload.jobId);
    
    res.json({
      success,
      message: success ? 'Webhook test successful' : 'Webhook test failed',
      timestamp: new Date().toISOString(),
      requestId
    });
  } catch (error) {
    Logger.error('Webhook test failed', { requestId, error: error.message });
    res.status(500).json({
      success: false,
      message: 'Webhook test failed',
      error: error.message,
      timestamp: new Date().toISOString(),
      requestId
    });
  }
});

/**
 * Detailed health check endpoint
 * GET /api/health/detailed
 *
 * Returns comprehensive system health information
 */
router.get('/detailed', async (req, res) => {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    const config = require('../config');

    // Check file system access
    const checkFileSystem = async () => {
      try {
        await fs.access(config.paths.downloads);
        await fs.access(config.paths.processing);
        return { status: 'healthy', message: 'File system accessible' };
      } catch (error) {
        return {
          status: 'unhealthy',
          message: 'File system access failed',
          error: error.message
        };
      }
    };

    // Check environment variables
    const checkEnvironment = () => {
      const requiredEnvVars = [
        'LOYVERSE_USERNAME',
        'LOYVERSE_PASSWORD',
        'PORT'
      ];
      const missing = requiredEnvVars.filter(varName => !process.env[varName]);

      if (missing.length > 0) {
        return {
          status: 'warning',
          message: `Missing environment variables: ${missing.join(', ')}`,
          missing_vars: missing
        };
      }

      return {
        status: 'healthy',
        message: 'All required environment variables present'
      };
    };

    // Check disk space (simplified)
    const checkDiskSpace = async () => {
      try {
        const stats = await fs.stat(process.cwd());
        return {
          status: 'healthy',
          message: 'Disk space check completed',
          details: 'Detailed disk space monitoring not implemented'
        };
      } catch (error) {
        return {
          status: 'warning',
          message: 'Disk space check failed',
          error: error.message
        };
      }
    };

    // Perform all health checks
    const [fileSystemHealth, environmentHealth, diskSpaceHealth] =
      await Promise.all([
        checkFileSystem(),
        checkEnvironment(),
        checkDiskSpace()
      ]);

    // Determine overall health status
    const healthChecks = [fileSystemHealth, environmentHealth, diskSpaceHealth];
    const hasUnhealthy = healthChecks.some(
      check => check.status === 'unhealthy'
    );
    const hasWarning = healthChecks.some(check => check.status === 'warning');

    const overallStatus = hasUnhealthy
      ? 'unhealthy'
      : hasWarning
        ? 'warning'
        : 'healthy';

    const detailedHealthData = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      api: 'Loyverse Automation API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: {
        seconds: process.uptime(),
        human: formatUptime(process.uptime())
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        usage_percentage: Math.round(
          (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) *
            100
        )
      },
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        pid: process.pid,
        arch: process.arch,
        cpus: require('os').cpus().length,
        loadavg: require('os').loadavg(),
        freemem: Math.round(require('os').freemem() / 1024 / 1024),
        totalmem: Math.round(require('os').totalmem() / 1024 / 1024)
      },
      checks: {
        filesystem: fileSystemHealth,
        environment: environmentHealth,
        disk_space: diskSpaceHealth
      },
      services: {
        browser_service: {
          status: 'not_checked',
          message: 'Browser service health check not implemented'
        },
        auth_service: {
          status: 'not_checked',
          message: 'Auth service health check not implemented'
        },
        data_extraction: {
          status: 'not_checked',
          message: 'Data extraction service health check not implemented'
        }
      },
      metadata: {
        request_id: req.requestId,
        api_version: '1.0.0',
        timestamp: new Date().toISOString()
      }
    };

    // Set appropriate HTTP status code
    const statusCode = overallStatus === 'unhealthy' ? 503 : 200;
    res.status(statusCode).json(detailedHealthData);
  } catch (error) {
    Logger.error('Detailed health check failed', {
      requestId: req.requestId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Health check failed',
        timestamp: new Date().toISOString()
      },
      metadata: {
        request_id: req.requestId,
        api_version: '1.0.0',
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * Readiness check endpoint
 * GET /api/health/ready
 *
 * Returns whether the API is ready to handle requests
 */
router.get('/ready', (req, res) => {
  // Check if all required services are available
  const isReady = checkReadiness();

  const readinessData = {
    ready: isReady,
    timestamp: new Date().toISOString(),
    api: 'Loyverse Automation API',
    version: '1.0.0',
    checks: {
      environment:
        process.env.LOYVERSE_USERNAME && process.env.LOYVERSE_PASSWORD,
      file_system: true, // Simplified check
      services: true // Simplified check
    },
    metadata: {
      request_id: req.requestId,
      api_version: '1.0.0',
      timestamp: new Date().toISOString()
    }
  };

  const statusCode = isReady ? 200 : 503;
  res.status(statusCode).json(readinessData);
});

/**
 * Liveness check endpoint
 * GET /api/health/live
 *
 * Returns whether the API is alive and responsive
 */
router.get('/live', (req, res) => {
  const livenessData = {
    alive: true,
    timestamp: new Date().toISOString(),
    api: 'Loyverse Automation API',
    version: '1.0.0',
    uptime: process.uptime(),
    metadata: {
      request_id: req.requestId,
      api_version: '1.0.0',
      timestamp: new Date().toISOString()
    }
  };

  res.json(livenessData);
});

/**
 * Health check information endpoint
 * GET /api/health/info
 *
 * Returns information about available health check endpoints
 */
router.get('/info', (req, res) => {
  const healthInfo = {
    name: 'Health Check API',
    version: '1.0.0',
    description: 'Health monitoring endpoints for Loyverse Automation API',
    endpoints: {
      'GET /': 'Basic health check',
      'GET /detailed': 'Comprehensive health check with system information',
      'GET /ready': 'Readiness check for load balancers',
      'GET /live': 'Liveness check for container orchestration',
      'GET /info': 'Health check API information'
    },
    usage: {
      monitoring:
        'Use /ready for readiness probes and /live for liveness probes',
      troubleshooting: 'Use /detailed for comprehensive system diagnostics',
      basic: 'Use / for simple health status'
    },
    metadata: {
      request_id: req.requestId,
      api_version: '1.0.0',
      timestamp: new Date().toISOString()
    }
  };

  res.json(healthInfo);
});

/**
 * Helper function to format uptime in human-readable format
 * @param {number} seconds - Uptime in seconds
 * @returns {string} Human-readable uptime
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (remainingSeconds > 0) parts.push(`${remainingSeconds}s`);

  return parts.join(' ') || '0s';
}

/**
 * Helper function to check overall readiness
 * @returns {boolean} Whether the API is ready
 */
function checkReadiness() {
  // Check environment variables
  const hasCredentials =
    process.env.LOYVERSE_USERNAME && process.env.LOYVERSE_PASSWORD;

  // Add more readiness checks as needed
  return hasCredentials;
}

module.exports = router;
