const path = require('path');
require('dotenv').config({ quiet: true });
const { executablePath } = require('puppeteer');

/**
 * Centralized configuration for the Loyverse Automation API
 * Provides environment-specific settings and validation
 */
class Config {
  constructor() {
    this.validateRequiredEnvVars();
    // Try multiple Chrome paths for different Ubuntu installations
    this.chromeExecutablePath = this.getChromeExecutablePath();
  }

  /**
   * Get Chrome executable path for Ubuntu
   * @returns {string} Chrome executable path
   */
  getChromeExecutablePath() {
    const possiblePaths = [
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/opt/google/chrome/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium'
    ];

    // Check if any of these paths exist
    for (const path of possiblePaths) {
      try {
        const fs = require('fs');
        if (fs.existsSync(path)) {
          console.log(`✅ Found Chrome at: ${path}`);
          return path;
        }
      } catch (error) {
        continue;
      }
    }

    console.warn('⚠️ Chrome not found in standard paths, using default');
    return '/usr/bin/google-chrome-stable';
  }

  /**
   * Validates that all required environment variables are present
   * @throws {Error} If required environment variables are missing
   */
  validateRequiredEnvVars() {
    // Credentials are now hardcoded, no validation needed
    console.log('✅ Credentials validation skipped - using hardcoded values');
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
   * Enhanced Puppeteer configuration with anti-detection measures
   */
  /**
   * Enhanced Puppeteer configuration with advanced anti-detection measures
   * Implements Option 1 (Enhanced Manual CAPTCHA + Better Stealth) and Option 2 (Undetected-Chromedriver)
   */
  get puppeteer() {
    // Detect if running in server environment (no DISPLAY)
    const isServerEnvironment = !process.env.DISPLAY && process.platform === 'linux';
    const shouldUseHeadless = isServerEnvironment || process.env.NODE_ENV === 'production';
    
    console.log('🔍 Puppeteer Environment Check:', {
      platform: process.platform,
      display: process.env.DISPLAY || 'not set',
      nodeEnv: process.env.NODE_ENV || 'not set',
      isServerEnvironment,
      shouldUseHeadless
    });
    
    return {
      headless: shouldUseHeadless ? 'new' : false,
      downloadTimeout: parseInt(process.env.DOWNLOAD_TIMEOUT, 10) || 30000,
      navigationTimeout: parseInt(process.env.NAVIGATION_TIMEOUT, 10) || 30000,
      launchOptions: {
        headless: shouldUseHeadless ? 'new' : false,
        userDataDir: this.paths.userData,
        args: [
          // Essential headless arguments
          "--no-sandbox",
          "--disable-setuid-sandbox", 
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--no-first-run",
          "--no-zygote",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-renderer-backgrounding",
          "--disable-field-trial-config",
          "--disable-ipc-flooding-protection",
          "--disable-hang-monitor",
          "--disable-prompt-on-repost",
          "--disable-client-side-phishing-detection",
          "--disable-component-extensions-with-background-pages",
          "--disable-default-apps",
          "--disable-sync",
          "--disable-translate",
          "--hide-scrollbars",
          "--mute-audio",
          "--no-default-browser-check",
          "--safebrowsing-disable-auto-update",
          "--disable-background-networking",
          "--disable-breakpad",
          "--password-store=basic",
          "--use-mock-keychain",
          
          // Server-specific arguments
          ...(shouldUseHeadless ? [
            "--headless=new",
            "--disable-gpu-sandbox",
            "--disable-software-rasterizer",
            "--disable-extensions",
            "--disable-plugins",
            "--disable-images",
            "--disable-background-networking",
            "--disable-default-apps",
            "--disable-sync",
            "--disable-translate",
            "--disable-features=TranslateUI,BlinkGenPropertyTrees,VizDisplayCompositor",
            "--run-all-compositor-stages-before-draw",
            "--disable-threaded-animation",
            "--disable-threaded-scrolling",
            "--disable-checker-imaging",
            "--disable-new-content-rendering-timeout",
            "--disable-image-animation-resync",
            "--virtual-time-budget=5000"
          ] : [
            "--disable-web-security",
            "--disable-features=VizDisplayCompositor",
            "--disable-accelerated-2d-canvas",
            "--enable-features=NetworkService,NetworkServiceLogging",
            "--force-color-profile=srgb",
            "--metrics-recording-only",
            "--disable-extensions-except=" + path.join(__dirname, '..', '..', 'CapSolver.Browser.Extension'),
            "--load-extension=" + path.join(__dirname, '..', '..', 'CapSolver.Browser.Extension')
          ])
        ],
        defaultViewport: {
          width: 1920,
          height: 1080,
        },
        slowMo: shouldUseHeadless ? 0 : 50,
        // Use actual Chrome executable instead of Chromium for better fingerprint
        executablePath: this.chromeExecutablePath,
        // Force headless mode for server environment
        ...(shouldUseHeadless && {
          pipe: true,
          dumpio: false
        })
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
