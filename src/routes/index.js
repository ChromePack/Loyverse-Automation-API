const express = require('express');
const { Logger } = require('../utils/logger');
const { ERROR_CODES } = require('../constants');
const {
  validateRequest,
  securityHeaders,
  sanitizeRequest,
  requestTimeout
} = require('../middleware/routeMiddleware');

const router = express.Router();

/**
 * Main API router configuration
 * Registers all API routes and applies route-specific middleware
 *
 * Following Clean Code principles:
 * - Single Responsibility: Only handles route registration and middleware
 * - Open/Closed: Extensible for new route modules
 * - Dependency Inversion: Depends on route module abstractions
 */

// Apply security headers to all routes
router.use(securityHeaders);

// Apply request sanitization
router.use(sanitizeRequest);

// Apply request validation
router.use(validateRequest);

// Apply request timeout (60 seconds for API routes)
router.use(requestTimeout(60000));

// Request logging middleware for API routes
router.use((req, res, next) => {
  Logger.info('API Request received', {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Request timing middleware
router.use((req, res, next) => {
  req.startTime = Date.now();

  // Override res.json to add timing information
  const originalJson = res.json;
  res.json = function (data) {
    const processingTime = Date.now() - req.startTime;

    // Add timing to response if it has metadata
    if (data && typeof data === 'object' && data.metadata) {
      data.metadata.processing_time_ms = processingTime;
    }

    Logger.info('API Response sent', {
      requestId: req.requestId,
      statusCode: res.statusCode,
      processingTime,
      responseSize: JSON.stringify(data).length
    });

    return originalJson.call(this, data);
  };

  next();
});

// CORS headers for n8n integration
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Request-ID'
  );

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check routes
const healthRoutes = require('./health');
router.use('/health', healthRoutes);

// Sales routes (implemented in Phase 5)
const salesRoutes = require('./sales');
router.use('/sales', salesRoutes);

// Authentication routes (for CAPTCHA handling)
router.use('/auth', (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: ERROR_CODES.NOT_IMPLEMENTED,
      message: 'Authentication endpoints are not yet implemented',
      timestamp: new Date().toISOString(),
      planned_endpoints: {
        'POST /auth/start': 'Start authentication session',
        'GET /auth/status/:id': 'Check authentication status',
        'POST /auth/solve/:id': 'Signal CAPTCHA solved',
        'GET /auth/screenshot/:id': 'Get CAPTCHA screenshot'
      }
    },
    metadata: {
      request_id: req.requestId,
      api_version: '1.0.0',
      timestamp: new Date().toISOString()
    }
  });
});

// Store management routes (future enhancement)
router.use('/stores', (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: ERROR_CODES.NOT_IMPLEMENTED,
      message: 'Store management endpoints are not yet implemented',
      timestamp: new Date().toISOString(),
      planned_endpoints: {
        'GET /stores': 'List all stores (available in /sales/stores)',
        'GET /stores/:id': 'Get store details',
        'POST /stores': 'Add new store',
        'PUT /stores/:id': 'Update store configuration',
        'DELETE /stores/:id': 'Remove store'
      }
    },
    metadata: {
      request_id: req.requestId,
      api_version: '1.0.0',
      timestamp: new Date().toISOString()
    }
  });
});

// Reports routes (future enhancement)
router.use('/reports', (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: ERROR_CODES.NOT_IMPLEMENTED,
      message: 'Report endpoints are not yet implemented',
      timestamp: new Date().toISOString(),
      planned_endpoints: {
        'GET /reports/summary': 'Get extraction summary',
        'GET /reports/history': 'Get extraction history',
        'GET /reports/analytics': 'Get analytics data',
        'POST /reports/schedule': 'Schedule automated reports'
      }
    },
    metadata: {
      request_id: req.requestId,
      api_version: '1.0.0',
      timestamp: new Date().toISOString()
    }
  });
});

// API documentation endpoint
router.get('/', (req, res) => {
  const apiInfo = {
    name: 'Loyverse Automation API',
    version: '1.0.0',
    description: 'API for automating Loyverse POS data extraction',
    documentation: {
      swagger: '/api/docs',
      postman: '/api/postman.json'
    },
    endpoints: {
      // Core endpoints
      health: {
        path: '/api/health',
        method: 'GET',
        description: 'API health check with system information',
        status: 'implemented'
      },

      // Sales endpoints
      sales: {
        path: '/api/sales',
        methods: ['GET', 'POST'],
        description: 'Sales data extraction endpoints',
        status: 'implemented',
        endpoints: {
          'GET /sales/': 'Sales API information',
          'GET /sales/stores': 'List available stores',
          'POST /sales/extract-daily-sales':
            'Extract daily sales for all/specific stores',
          'POST /sales/extract-store': 'Extract sales for single store'
        }
      },

      // Future endpoints
      auth: {
        path: '/api/auth',
        methods: ['GET', 'POST'],
        description: 'Authentication and CAPTCHA handling',
        status: 'planned'
      },
      stores: {
        path: '/api/stores',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        description: 'Store management endpoints',
        status: 'planned'
      },
      reports: {
        path: '/api/reports',
        methods: ['GET', 'POST'],
        description: 'Reporting and analytics endpoints',
        status: 'planned'
      }
    },
    usage: {
      base_url: process.env.API_BASE_URL || 'http://localhost:3000/api',
      content_type: 'application/json',
      authentication: 'None (internal API)',
      rate_limiting: 'Not implemented',
      cors: 'Enabled for n8n integration'
    },
    response_format: {
      success: {
        success: true,
        data: '{}',
        metadata: {
          request_id: 'string',
          api_version: 'string',
          timestamp: 'ISO 8601 string',
          processing_time_ms: 'number'
        }
      },
      error: {
        success: false,
        error: {
          code: 'string',
          message: 'string',
          timestamp: 'ISO 8601 string'
        },
        metadata: {
          request_id: 'string',
          api_version: 'string',
          timestamp: 'ISO 8601 string'
        }
      }
    },
    metadata: {
      request_id: req.requestId,
      api_version: '1.0.0',
      timestamp: new Date().toISOString()
    }
  };

  res.json(apiInfo);
});

// 404 handler for undefined API routes
router.use('*', (req, res) => {
  Logger.warn('API route not found', {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  });

  res.status(404).json({
    success: false,
    error: {
      code: ERROR_CODES.NOT_FOUND,
      message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
      timestamp: new Date().toISOString(),
      suggestion: 'Visit /api for available endpoints'
    },
    metadata: {
      request_id: req.requestId,
      api_version: '1.0.0',
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = router;
