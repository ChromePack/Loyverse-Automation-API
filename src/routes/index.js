const express = require('express');
const router = express.Router();

/**
 * Main API router configuration
 * Registers all API routes and applies route-specific middleware
 */

// Request logging middleware for API routes
router.use((req, res, next) => {
  console.log(
    `[${req.requestId}] API Request: ${req.method} ${req.originalUrl}`
  );
  next();
});

// Health check route (specific to API)
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    api: 'Loyverse Automation API',
    version: '1.0.0'
  });
});

// Sales routes (implemented in Phase 5)
const salesRoutes = require('./sales');
router.use('/sales', salesRoutes);

// Placeholder for future routes
router.use('/stores', (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Store endpoints are not yet implemented',
      timestamp: new Date().toISOString()
    }
  });
});

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    name: 'Loyverse Automation API',
    version: '1.0.0',
    description: 'API for automating Loyverse POS data extraction',
    endpoints: {
      health: '/api/health',
      sales: '/api/sales (not implemented)',
      stores: '/api/stores (not implemented)'
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
