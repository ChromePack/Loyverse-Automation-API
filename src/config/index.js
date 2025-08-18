const path = require('path');
require('dotenv').config({ quiet: true });
const { executablePath } = require('puppeteer');

/**
 * Centralized configuration for the Loyverse Automation API
 * Provides environment-specific settings and validation
 */
class Config {
  constructor() {
    // Detect Chrome executable path based on platform
    this.chromeExecutablePath = this.detectChromeExecutable();
  }

  /**
   * Detect Chrome executable path based on platform
   * @returns {string|undefined} Chrome executable path
   */
  detectChromeExecutable() {
    const platform = process.platform;
    
    if (platform === 'win32') {
      // Windows Chrome paths
      const windowsPaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
      ];
      
      for (const chromePath of windowsPaths) {
        try {
          const fs = require('fs');
          if (fs.existsSync(chromePath)) {
            console.log('🔍 Found Chrome at:', chromePath);
            return chromePath;
          }
        } catch (error) {
          // Continue checking other paths
        }
      }
    } else if (platform === 'linux') {
      // Linux Chrome paths
      const linuxPaths = [
        '/opt/google/chrome/google-chrome',
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/snap/bin/chromium',
        '/usr/bin/chromium-browser'
      ];
      
      for (const chromePath of linuxPaths) {
        try {
          const fs = require('fs');
          if (fs.existsSync(chromePath)) {
            console.log('🔍 Found Chrome at:', chromePath);
            return chromePath;
          }
        } catch (error) {
          // Continue checking other paths
        }
      }
    } else if (platform === 'darwin') {
      // macOS Chrome path
      const macPath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
      try {
        const fs = require('fs');
        if (fs.existsSync(macPath)) {
          console.log('🔍 Found Chrome at:', macPath);
          return macPath;
        }
      } catch (error) {
        // Fall back to default
      }
    }
    
    console.log('⚠️ Chrome executable not found, using default Puppeteer Chromium');
    return undefined; // Let Puppeteer use its bundled Chromium
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
          "--no-first-run",
          "--no-zygote",
          "--disable-blink-features=AutomationControlled",
          "--disable-infobars",
          "--disable-extensions-except=" + extensionPath,
          "--load-extension=" + extensionPath,
          "--allowlisted-extension-id=pgojnojmmhpofjgdmaebadhbocahppod",
          "--disable-web-security",
          "--disable-features=VizDisplayCompositor",
          "--enable-features=NetworkService",
          "--remote-debugging-port=9222",
          "--window-size=1920,1080",
          // Critical for VNC/Xvfb environment
          "--display=" + (process.env.DISPLAY || ":1"),
          "--use-gl=swiftshader",
          "--disable-software-rasterizer",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-renderer-backgrounding",
          "--disable-field-trial-config",
          "--disable-ipc-flooding-protection"
        ],
        defaultViewport: null, // Use natural browser viewport
        slowMo: 100, // Slower for better interactions
        executablePath: this.chromeExecutablePath,
        timeout: 120000, // Increased timeout
        protocolTimeout: 120000,
        ignoreDefaultArgs: ['--enable-automation'],
        ignoreHTTPSErrors: true,
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
