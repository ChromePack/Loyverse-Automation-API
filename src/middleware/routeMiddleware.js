const { Logger } = require('../utils/logger');
const { ERROR_CODES } = require('../constants');

/**
 * Route-specific middleware functions
 * Provides common middleware functionality for route handling
 *
 * Following Clean Code principles:
 * - Single Responsibility: Each middleware has a specific purpose
 * - Open/Closed: Extensible for new middleware functions
 * - Dependency Inversion: Depends on abstractions for logging
 */

/**
 * Request validation middleware
 * Validates common request parameters and headers
 */
const validateRequest = (req, res, next) => {
  // Check Content-Type for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      Logger.warn('Invalid Content-Type header', {
        requestId: req.requestId,
        method: req.method,
        contentType: contentType || 'missing',
        url: req.originalUrl
      });

      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message:
            'Content-Type must be application/json for POST/PUT requests',
          timestamp: new Date().toISOString()
        },
        metadata: {
          request_id: req.requestId,
          api_version: '1.0.0',
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  // Check for request body size (basic check)
  if (req.body && JSON.stringify(req.body).length > 1024 * 1024) {
    // 1MB limit
    Logger.warn('Request body too large', {
      requestId: req.requestId,
      method: req.method,
      bodySize: JSON.stringify(req.body).length,
      url: req.originalUrl
    });

    return res.status(413).json({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Request body too large (max 1MB)',
        timestamp: new Date().toISOString()
      },
      metadata: {
        request_id: req.requestId,
        api_version: '1.0.0',
        timestamp: new Date().toISOString()
      }
    });
  }

  next();
};

/**
 * Rate limiting middleware (basic implementation)
 * Prevents abuse by limiting requests per IP
 */
const rateLimit = (() => {
  const requests = new Map();
  const WINDOW_SIZE = 60 * 1000; // 1 minute
  const MAX_REQUESTS = 100; // per window

  return (req, res, next) => {
    const clientIp = req.ip;
    const now = Date.now();

    // Get or create request history for this IP
    if (!requests.has(clientIp)) {
      requests.set(clientIp, []);
    }

    const clientRequests = requests.get(clientIp);

    // Remove old requests outside the window
    const validRequests = clientRequests.filter(
      timestamp => now - timestamp < WINDOW_SIZE
    );

    // Check if limit exceeded
    if (validRequests.length >= MAX_REQUESTS) {
      Logger.warn('Rate limit exceeded', {
        requestId: req.requestId,
        clientIp,
        requestCount: validRequests.length,
        maxRequests: MAX_REQUESTS
      });

      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Rate limit exceeded. Maximum ${MAX_REQUESTS} requests per minute.`,
          timestamp: new Date().toISOString(),
          retry_after: Math.ceil(WINDOW_SIZE / 1000)
        },
        metadata: {
          request_id: req.requestId,
          api_version: '1.0.0',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Add current request
    validRequests.push(now);
    requests.set(clientIp, validRequests);

    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': MAX_REQUESTS,
      'X-RateLimit-Remaining': Math.max(0, MAX_REQUESTS - validRequests.length),
      'X-RateLimit-Reset': new Date(now + WINDOW_SIZE).toISOString()
    });

    next();
  };
})();

/**
 * Security headers middleware
 * Adds security-related headers to responses
 */
const securityHeaders = (req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'",
    'X-API-Version': '1.0.0'
  });

  next();
};

/**
 * Error handling middleware for routes
 * Catches and formats errors from route handlers
 */
const errorHandler = (error, req, res, next) => {
  Logger.error('Route error occurred', {
    requestId: req.requestId,
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.originalUrl
  });

  // Don't handle if response already sent
  if (res.headersSent) {
    return next(error);
  }

  // Determine error code and status
  let errorCode = ERROR_CODES.INTERNAL_ERROR;
  let statusCode = 500;

  if (error.name === 'ValidationError') {
    errorCode = ERROR_CODES.VALIDATION_ERROR;
    statusCode = 400;
  } else if (error.name === 'UnauthorizedError') {
    errorCode = ERROR_CODES.LOGIN_FAILED;
    statusCode = 401;
  } else if (error.name === 'NotFoundError') {
    errorCode = ERROR_CODES.NOT_FOUND;
    statusCode = 404;
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: error.message || 'An internal error occurred',
      timestamp: new Date().toISOString()
    },
    metadata: {
      request_id: req.requestId,
      api_version: '1.0.0',
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Request sanitization middleware
 * Sanitizes request data to prevent injection attacks
 */
const sanitizeRequest = (req, res, next) => {
  // Basic sanitization for common injection patterns
  const sanitizeValue = value => {
    if (typeof value === 'string') {
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .trim();
    }
    return value;
  };

  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    const sanitizeObject = obj => {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitizeObject(obj[key]);
          } else {
            obj[key] = sanitizeValue(obj[key]);
          }
        }
      }
    };

    sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    for (const key in req.query) {
      if (Object.prototype.hasOwnProperty.call(req.query, key)) {
        req.query[key] = sanitizeValue(req.query[key]);
      }
    }
  }

  next();
};

/**
 * Request timeout middleware
 * Sets a timeout for long-running requests
 */
const requestTimeout = (timeoutMs = 30000) => {
  return (req, res, next) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        Logger.warn('Request timeout', {
          requestId: req.requestId,
          method: req.method,
          url: req.originalUrl,
          timeout: timeoutMs
        });

        res.status(504).json({
          success: false,
          error: {
            code: 'REQUEST_TIMEOUT',
            message: `Request timed out after ${timeoutMs}ms`,
            timestamp: new Date().toISOString()
          },
          metadata: {
            request_id: req.requestId,
            api_version: '1.0.0',
            timestamp: new Date().toISOString()
          }
        });
      }
    }, timeoutMs);

    // Clear timeout when response is sent
    res.on('finish', () => {
      clearTimeout(timeout);
    });

    next();
  };
};

module.exports = {
  validateRequest,
  rateLimit,
  securityHeaders,
  errorHandler,
  sanitizeRequest,
  requestTimeout
};
