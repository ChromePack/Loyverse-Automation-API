const path = require('path');
require('dotenv').config({ quiet: true });
const { executablePath } = require('puppeteer');

/**
 * Centralized configuration for the Loyverse Automation API
 * Provides environment-specific settings and validation
 */
class Config {
  constructor() {
    // Try multiple Chrome paths for different Ubuntu installations
    this.chromeExecutablePath = "/opt/google/chrome/google-chrome";
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
      username: 'mostafasalehi796@gmail.com',
      password: '4q$qH5F2uWMVQz.',
      baseUrl: process.env.LOYVERSE_BASE_URL || 'https://r.loyverse.com'
    };
  }

  /**
   * Enhanced Puppeteer configuration with advanced anti-detection measures
   * Implements Option 1 (Enhanced Manual CAPTCHA + Better Stealth) and Option 2 (Undetected-Chromedriver)
   */
  get puppeteer() {
    // Detect if running in server environment (no DISPLAY)
    const isServerEnvironment = !process.env.DISPLAY && process.platform === 'linux';
    // Force headed mode when using extensions for better compatibility
    const shouldUseHeadless = isServerEnvironment && process.env.FORCE_HEADLESS === 'true';
    const extensionPath = path.join(__dirname, '..', '..', 'CapSolver.Browser.Extension');
    
    console.log('🔍 Puppeteer Environment Check:', {
      platform: process.platform,
      display: process.env.DISPLAY || 'not set',
      nodeEnv: process.env.NODE_ENV || 'not set',
      isServerEnvironment,
      shouldUseHeadless,
      extensionPath,
      forceHeadless: process.env.FORCE_HEADLESS || 'not set'
    });
    
    return {
      headless: shouldUseHeadless ? 'new' : false,
      downloadTimeout: parseInt(process.env.DOWNLOAD_TIMEOUT, 10) || 30000,
      navigationTimeout: parseInt(process.env.NAVIGATION_TIMEOUT, 10) || 30000,
      launchOptions: {
        headless: shouldUseHeadless ? 'new' : false,
        userDataDir: this.paths.userData,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
          //"--load-extension=" + extensionPath,
          // "--allowlisted-extension-id=pgojnojmmhpofjgdmaebadhbocahppod",
          
          // Enhanced permissions for extension
          //"--enable-features=NetworkService,NetworkServiceLogging",
          // "--disable-features=VizDisplayCompositor"
        ],
        defaultViewport: {
          width: 1920,
          height: 1080,
        }, // Let browser use natural viewport in headed mode
        slowMo: 50, // Slower for extension interactions
        // Use actual Chrome executable instead of Chromium for better fingerprint
        executablePath: this.chromeExecutablePath,
        // Connection settings for stable browser launch
        timeout: 60000, // Increased for extension loading
        protocolTimeout: 60000,
        // Extension-friendly settings
        // ignoreDefaultArgs: ['--enable-automation', '--disable-extensions'],
        // ...(shouldUseHeadless && {
        //   dumpio: false
        // })
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
      logs: path.join(rootDir, 'logs'),
      userData: path.join(rootDir, process.env.USER_DATA_DIR || 'chrome-user-data')
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

  /**
   * Webhook configuration
   */
  get webhook() {
    return {
      url: 'http://localhost:5678/webhook/eb25f31a-326c-4434-a327-eadd26183b51',
      timeout: parseInt(process.env.WEBHOOK_TIMEOUT, 10) || 10000, // 10 seconds
      maxRetries: parseInt(process.env.WEBHOOK_MAX_RETRIES, 10) || 3,
      retryDelay: parseInt(process.env.WEBHOOK_RETRY_DELAY, 10) || 2000, // 2 seconds
      enabled: process.env.WEBHOOK_ENABLED !== 'false' // enabled by default
    };
  }
}

module.exports = new Config();
