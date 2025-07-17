const express = require('express');
const { SalesController } = require('../controllers/SalesController');
const { Logger } = require('../utils/logger');

const router = express.Router();
const salesController = new SalesController();

/**
 * Sales routes configuration
 * Defines all sales-related API endpoints
 *
 * Following Clean Code principles:
 * - Single Responsibility: Only handles sales route definitions
 * - Open/Closed: Extensible for new sales routes
 * - Dependency Inversion: Depends on controller abstraction
 */

// Request logging middleware for sales routes
router.use((req, res, next) => {
  Logger.info('Sales route accessed', {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

/**
 * Extract daily sales data for all stores or specific stores
 * POST /api/sales/extract-daily-sales
 *
 * Request Body:
 * {
 *   "date": "2025-01-15",        // Optional, defaults to today
 *   "stores": ["all"]            // Optional, array of store names or "all"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "extraction_date": "2025-01-15",
 *     "stores": [...]
 *   }
 * }
 */
router.post('/extract-daily-sales', async (req, res) => {
  await salesController.extractDailySales(req, res);
});

/**
 * Extract sales data for a single store
 * POST /api/sales/extract-store
 *
 * Request Body:
 * {
 *   "store_name": "Apung Iska - MAT",  // Required
 *   "date": "2025-01-15"               // Optional, defaults to today
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "extraction_date": "2025-01-15",
 *     "store": {...}
 *   }
 * }
 */
router.post('/extract-store', async (req, res) => {
  await salesController.extractStore(req, res);
});

/**
 * Get available stores
 * GET /api/sales/stores
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "stores": ["Apung Iska - MAT", "Store 2", ...]
 *   }
 * }
 */
router.get('/stores', (req, res) => {
  try {
    Logger.info('Getting available stores', { requestId: req.requestId });

    const { Store } = require('../models/Store');
    const stores = Store.getAllStores();

    res.json({
      success: true,
      data: {
        stores: stores,
        total_count: stores.length
      },
      metadata: {
        request_id: req.requestId,
        api_version: '1.0.0',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    Logger.error('Error getting stores', {
      requestId: req.requestId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve stores',
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
 * Sales API information endpoint
 * GET /api/sales/
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "name": "Sales API",
 *     "endpoints": {...}
 *   }
 * }
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'Loyverse Sales API',
      version: '1.0.0',
      description: 'API endpoints for Loyverse sales data extraction',
      endpoints: {
        'POST /extract-daily-sales':
          'Extract sales data for all stores or specific stores',
        'POST /extract-store': 'Extract sales data for a single store',
        'GET /stores': 'Get list of available stores',
        'GET /': 'API information'
      },
      usage: {
        base_url: '/api/sales',
        content_type: 'application/json',
        authentication: 'None (internal API)'
      }
    },
    metadata: {
      request_id: req.requestId,
      api_version: '1.0.0',
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = router;
