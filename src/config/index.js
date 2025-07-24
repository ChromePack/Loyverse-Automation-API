const path = require('path');
require('dotenv').config();
const { executablePath } = require('puppeteer');

/**
 * Centralized configuration for the Loyverse Automation API
 * Provides environment-specific settings and validation
 */
class Config {
  constructor() {
    this.validateRequiredEnvVars();
  }

  /**
   * Validates that all required environment variables are present
   * @throws {Error} If required environment variables are missing
   */
  validateRequiredEnvVars() {
    const requiredVars = ['LOYVERSE_USERNAME', 'LOYVERSE_PASSWORD'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}`
      );
    }
  }

  /**
   * Server configuration
   */
  get server() {
    return {
      port: parseInt(process.env.PORT, 10) || 3000,
      env: process.env.NODE_ENV || 'development',
      isDevelopment: process.env.NODE_ENV === 'development',
      isProduction: process.env.NODE_ENV === 'production'
    };
  }

  /**
   * Loyverse credentials and settings
   */
  get loyverse() {
    return {
      username: process.env.LOYVERSE_USERNAME,
      password: process.env.LOYVERSE_PASSWORD,
      baseUrl: process.env.LOYVERSE_BASE_URL || 'https://r.loyverse.com'
    };
  }

  /**
   * Enhanced Puppeteer configuration with anti-detection measures
   */
  /**
   * Enhanced Puppeteer configuration with advanced anti-detection measures
   * Implements Option 1 (Enhanced Manual CAPTCHA + Better Stealth) and Option 2 (Undetected-Chromedriver)
   */
  get puppeteer() {
    return {
      headless: process.env.PUPPETEER_HEADLESS === 'true',
      downloadTimeout: parseInt(process.env.DOWNLOAD_TIMEOUT, 10) || 30000,
      navigationTimeout: parseInt(process.env.NAVIGATION_TIMEOUT, 10) || 30000,
      launchOptions: {
        headless: process.env.PUPPETEER_HEADLESS !== 'false',
        args: [
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          `--disable-extensions-except=${path.join(__dirname, '..', '..', 'CapSolver.Browser.Extension')}`,
          `--load-extension=${path.join(__dirname, '..', '..', 'CapSolver.Browser.Extension')}`
        ],
        slowMo: 50,
        // Use actual Chrome executable instead of Chromium for better fingerprint
        executablePath: executablePath(),
        defaultViewport: null
      }
    };
  }
  get paths() {
    const rootDir = path.resolve(__dirname, '../..');

    return {
      root: rootDir,
      downloads: path.join(rootDir, process.env.DOWNLOAD_PATH || 'downloads'),
      processing: path.join(
        rootDir,
        process.env.PROCESSING_PATH || 'processing'
      ),
      logs: path.join(rootDir, 'logs')
    };
  }

  /**
   * Request timeout and retry configurations
   */
  get timeouts() {
    return {
      download: parseInt(process.env.DOWNLOAD_TIMEOUT, 10) || 30000,
      navigation: parseInt(process.env.NAVIGATION_TIMEOUT, 10) || 30000,
      request: parseInt(process.env.REQUEST_TIMEOUT, 10) || 60000,
      maxRetries: parseInt(process.env.MAX_RETRIES, 10) || 3,
      retryDelay: parseInt(process.env.RETRY_DELAY, 10) || 5000
    };
  }

  /**
   * CORS configuration
   */
  get cors() {
    return {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: process.env.CORS_CREDENTIALS === 'true',
      optionsSuccessStatus: 200
    };
  }

  /**
   * Security configuration
   */
  get security() {
    return {
      // 15 minutes
      rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 900000,
      rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
      requestSizeLimit: process.env.REQUEST_SIZE_LIMIT || '10mb'
    };
  }
}

module.exports = new Config();
