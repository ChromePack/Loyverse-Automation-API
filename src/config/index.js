const path = require('path');
require('dotenv').config();

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
        // Use actual Chrome executable instead of Chromium for better fingerprint
        executablePath: process.env.CHROME_EXECUTABLE_PATH || 
          (process.platform === 'linux' ? '/usr/bin/google-chrome' : 
           process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : 
           undefined),
        args: [
          // Core security settings
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          
          // Primary anti-detection: Remove automation indicators
          '--disable-blink-features=AutomationControlled',
          '--exclude-switches=enable-automation',
          '--disable-extensions-except=',
          '--disable-plugins-discovery',
          '--disable-default-apps',
          
          // Advanced fingerprinting countermeasures
          '--disable-features=VizDisplayCompositor,TranslateUI,BlinkGenPropertyTrees',
          '--disable-web-security',
          '--disable-features=site-per-process',
          '--disable-ipc-flooding-protection',
          '--enable-features=NetworkService,NetworkServiceInProcess',
          
          // Language and locale settings for realistic fingerprint
          '--lang=en-US,en',
          '--accept-lang=en-US,en;q=0.9',
          
          // Behavioral detection countermeasures
          '--disable-background-networking',
          '--disable-background-timer-throttling',
          '--disable-renderer-backgrounding',
          '--disable-backgrounding-occluded-windows',
          '--disable-client-side-phishing-detection',
          '--disable-component-update',
          '--disable-domain-reliability',
          '--disable-sync',
          '--disable-translate',
          '--disable-hang-monitor',
          '--disable-popup-blocking',
          '--disable-prompt-on-repost',
          '--disable-component-extensions-with-background-pages',
          '--disable-background-mode',
          '--disable-breakpad',
          '--metrics-recording-only',
          '--no-default-browser-check',
          '--no-pings',
          '--password-store=basic',
          '--use-mock-keychain',
          '--mute-audio',
          
          // Memory and performance optimizations
          '--memory-pressure-off',
          '--max_old_space_size=4096',
          
          // Additional stealth measures to avoid detection
          '--disable-accelerated-2d-canvas',
          '--disable-accelerated-jpeg-decoding',
          '--disable-accelerated-mjpeg-decode',
          '--disable-accelerated-video-decode',
          '--disable-app-list-dismiss-on-blur',
          '--disable-canvas-aa',
          '--disable-2d-canvas-clip-aa',
          '--disable-gl-drawing-for-tests',
          '--disable-threaded-animation',
          '--disable-threaded-scrolling',
          '--disable-checker-imaging',
          '--disable-new-bookmark-apps',
          '--disable-office-editing-component-app',
          '--disable-reading-from-canvas',
          '--run-all-compositor-stages-before-draw',
          
          // Simulate real browser environment
          '--enable-logging',
          '--log-level=3',
          '--disable-logging',
          '--disable-dev-shm-usage'
        ],
        defaultViewport: {
          width: 1366, // More common resolution
          height: 768,
          deviceScaleFactor: 1,
          isMobile: false,
          hasTouch: false,
          isLandscape: true
        },
        ignoreDefaultArgs: [
          '--enable-automation',
          '--enable-blink-features=IdleDetection',
          '--disable-extensions'
        ],
        ignoreHTTPSErrors: true,
        slowMo: 150, // Increased for more human-like behavior
        devtools: false
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
