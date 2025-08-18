const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
// const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha');

// Use stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

// Use reCAPTCHA plugin for enhanced CAPTCHA handling
  // puppeteer.use(RecaptchaPlugin({
  //   provider: {
  //     id: '2captcha',
  //     token: process.env.CAPTCHA_SOLVER_TOKEN || 'MANUAL' // Use 'MANUAL' for manual solving
  //   },
  //   visualFeedback: true // Show visual feedback during solving
  // }));

const fs = require('fs').promises;
const path = require('path');
const config = require('../config');
const { Logger } = require('../utils/logger');

/**
 * BrowserService - Manages Puppeteer browser lifecycle and configuration
 * Handles browser launch, page creation, download setup, and cleanup
 */
class BrowserService {
  constructor() {
    this.browser = null;
    this.pages = new Map();
    this.downloadPath = config.paths.downloads;
    this.isInitialized = false;
  }

  /**
   * Launch browser with configured options
   * @returns {Promise<void>}
   * @throws {Error} If browser launch fails
   */
  async launch() {
    try {
      const isServerEnvironment = !process.env.DISPLAY && process.platform === 'linux';
      
      Logger.info('Launching browser with configuration', {
        headless: config.puppeteer.headless,
        downloadPath: this.downloadPath,
        userDataDir: config.paths.userData,
        serverEnvironment: isServerEnvironment,
        display: process.env.DISPLAY || 'not set'
      });

      // Ensure directories exist
      await this.ensureDownloadDirectory();
      await this.ensureUserDataDirectory();

      // Launch browser with configuration
      this.browser = await puppeteer.launch({
        ...config.puppeteer.launchOptions,
        headless: config.puppeteer.headless
      });

      this.isInitialized = true;
      
      const mode = config.puppeteer.headless ? 'headless' : 'headed';
      Logger.info(`Browser launched successfully in ${mode} mode with session persistence`);

      // Get the first tab (page) and store as default
      const pages = await this.browser.pages();
      let defaultPage = pages[0];
      if (!defaultPage) {
        defaultPage = await this.browser.newPage();
      }
      await this.configurePageDownloads(defaultPage);
      defaultPage.setDefaultTimeout(config.timeouts.navigation);
      defaultPage.setDefaultNavigationTimeout(config.timeouts.navigation);
      this.pages.set('default', defaultPage);
      defaultPage.on('close', () => {
        Logger.info('Page closed: default');
        this.pages.delete('default');
      });

      // Handle browser disconnect
      this.browser.on('disconnected', () => {
        Logger.warn('Browser disconnected unexpectedly');
        this.isInitialized = false;
        this.browser = null;
        this.pages.clear();
      });
    } catch (error) {
      Logger.error('Failed to launch browser', { error: error.message });
      throw new Error(`Browser launch failed: ${error.message}`);
    }
  }

  /**
   * Create a new page with download configuration
   * @param {string} pageId - Unique identifier for the page
   * @returns {Promise<Page>} Puppeteer page instance
   * @throws {Error} If page creation fails
   */
  async createPage(pageId = 'default') {
    try {
      if (!this.isInitialized || !this.browser) {
        await this.launch();
      }

      // Reuse the default page if it exists
      let page = this.pages.get(pageId);
      if (page) {
        Logger.info(`Reusing existing page: ${pageId}`);
        return page;
      }

      // If no page exists, try to get the first available page from the browser
      const pages = await this.browser.pages();
      if (pages.length > 0) {
        page = pages[0];
        await this.configurePageDownloads(page);
        page.setDefaultTimeout(config.timeouts.navigation);
        page.setDefaultNavigationTimeout(config.timeouts.navigation);
        this.pages.set(pageId, page);
        page.on('close', () => {
          Logger.info(`Page closed: ${pageId}`);
          this.pages.delete(pageId);
        });
        Logger.info(`Reusing first browser page as: ${pageId}`);
        return page;
      }

      // As a fallback, create a new page (should rarely happen)
      Logger.info(`No existing page found, creating new page: ${pageId}`);
      page = await this.browser.newPage();
      await this.configurePageDownloads(page);
      page.setDefaultTimeout(config.timeouts.navigation);
      page.setDefaultNavigationTimeout(config.timeouts.navigation);
      this.pages.set(pageId, page);
      page.on('close', () => {
        Logger.info(`Page closed: ${pageId}`);
        this.pages.delete(pageId);
      });
      Logger.info(`Page created successfully: ${pageId}`);
      return page;
    } catch (error) {
      Logger.error(`Failed to create page: ${pageId}`, {
        error: error.message
      });
      throw new Error(`Page creation failed: ${error.message}`);
    }
  }

  /**
   * Configure page for file downloads
   * @param {Page} page - Puppeteer page instance
   * @returns {Promise<void>}
   */
  async configurePageDownloads(page) {
    try {
      // Get the CDP session
      const client = await page.target().createCDPSession();

      // Set download behavior
      await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: this.downloadPath
      });

      // Set user agent to avoid detection
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      // Set extra headers for stealth
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      });

      // Configure page for better interaction in VNC environment
      await page.evaluateOnNewDocument(() => {
        // Override navigator properties to avoid detection
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });
        
        // Fix viewport and device properties
        Object.defineProperty(screen, 'width', { get: () => 1920 });
        Object.defineProperty(screen, 'height', { get: () => 1080 });
        
        // Ensure proper event handling
        window.addEventListener('DOMContentLoaded', () => {
          document.body.style.cursor = 'default';
        });
      });

      // Enable better mouse interactions for VNC
      await client.send('Input.setIgnoreInputEvents', { ignore: false });

      Logger.debug('Page download configuration completed');
    } catch (error) {
      Logger.error('Failed to configure page downloads', {
        error: error.message
      });
      throw new Error(`Download configuration failed: ${error.message}`);
    }
  }

  /**
   * Ensure page is ready for interaction
   * @param {Page} page - Puppeteer page instance
   * @returns {Promise<void>}
   */
  async ensurePageReady(page) {
    try {
      // Wait for page to be fully loaded
      await page.waitForLoadState?.('networkidle') || page.waitForTimeout(2000);
      
      // Ensure DOM is ready and interactive
      await page.waitForFunction(() => {
        return document.readyState === 'complete' && 
               document.body !== null &&
               window.innerWidth > 0 &&
               window.innerHeight > 0;
      }, { timeout: 10000 });
      
      // Enable cursor and focus
      await page.evaluate(() => {
        if (document.body) {
          document.body.style.cursor = 'default';
          document.body.style.pointerEvents = 'auto';
        }
      });

      Logger.debug('Page is ready for interaction');
    } catch (error) {
      Logger.warn('Page readiness check failed', { error: error.message });
      // Don't throw - continue with interaction attempt
    }
  }

  /**
   * Get existing page by ID
   * @param {string} pageId - Page identifier
   * @returns {Page|null} Puppeteer page instance or null if not found
   */
  getPage(pageId = 'default') {
    return this.pages.get(pageId) || null;
  }

  /**
   * Close specific page
   * @param {string} pageId - Page identifier
   * @returns {Promise<void>}
   */
  async closePage(pageId = 'default') {
    try {
      const page = this.pages.get(pageId);
      if (page) {
        await page.close();
        this.pages.delete(pageId);
        Logger.info(`Page closed: ${pageId}`);
      }
    } catch (error) {
      Logger.error(`Failed to close page: ${pageId}`, { error: error.message });
      // Don't throw error for cleanup operations
    }
  }

  /**
   * Close all pages
   * @returns {Promise<void>}
   */
  async closeAllPages() {
    try {
      const pageIds = Array.from(this.pages.keys());

      for (const pageId of pageIds) {
        await this.closePage(pageId);
      }

      Logger.info('All pages closed');
    } catch (error) {
      Logger.error('Failed to close all pages', { error: error.message });
      // Don't throw error for cleanup operations
    }
  }

  /**
   * Close browser and cleanup resources
   * @returns {Promise<void>}
   */
  async close() {
    try {
      if (this.browser) {
        // Close all pages first
        await this.closeAllPages();

        // Close browser
        await this.browser.close();
        this.browser = null;
        this.isInitialized = false;

        Logger.info('Browser closed successfully');
      }
    } catch (error) {
      Logger.error('Failed to close browser', { error: error.message });
      // Don't throw error for cleanup operations
    }
  }

  /**
   * Check if browser is running and healthy
   * @returns {boolean} True if browser is running
   */
  isRunning() {
    return this.isInitialized && this.browser && this.browser.isConnected();
  }

  /**
   * Get browser instance (for advanced operations)
   * @returns {Browser|null} Puppeteer browser instance
   */
  getBrowser() {
    return this.browser;
  }

  /**
   * Monitor download completion
   * @param {string} expectedFileName - Expected download file name
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<string>} Full path to downloaded file
   * @throws {Error} If download times out or fails
   */
  async waitForDownload(expectedFileName, timeout = config.timeouts.download) {
    return new Promise((resolve, reject) => {
      const filePath = path.join(this.downloadPath, expectedFileName);
      const startTime = Date.now();

      const checkFile = async () => {
        try {
          const stats = await fs.stat(filePath);

          if (stats.isFile() && stats.size > 0) {
            Logger.info(`Download completed: ${expectedFileName}`);
            resolve(filePath);
            return;
          }
        } catch (error) {
          // File doesn't exist yet, continue checking
        }

        // Check timeout
        if (Date.now() - startTime > timeout) {
          Logger.error(`Download timeout: ${expectedFileName}`);
          reject(new Error(`Download timeout: ${expectedFileName}`));
          return;
        }

        // Check again after delay
        setTimeout(checkFile, 1000);
      };

      checkFile();
    });
  }

  /**
   * Take screenshot for debugging
   * @param {Page} page - Puppeteer page instance
   * @param {string} filename - Screenshot filename
   * @returns {Promise<void>}
   */
  async takeScreenshot(page, filename) {
    try {
      if (!page) {
        throw new Error('Page not provided for screenshot');
      }

      const screenshotPath = path.join(config.paths.logs, `${filename}.png`);

      // Ensure logs directory exists
      await fs.mkdir(config.paths.logs, { recursive: true });

      await page.screenshot({
        path: screenshotPath,
        fullPage: true
      });

      Logger.info(`Screenshot saved: ${screenshotPath}`);
    } catch (error) {
      Logger.error('Failed to take screenshot', {
        filename,
        error: error.message
      });
      // Don't throw error for debugging operations
    }
  }

  /**
   * Ensure download directory exists
   * @returns {Promise<void>}
   */
  async ensureDownloadDirectory() {
    try {
      await fs.mkdir(this.downloadPath, { recursive: true });
      Logger.debug(`Download directory ensured: ${this.downloadPath}`);
    } catch (error) {
      Logger.error('Failed to create download directory', {
        path: this.downloadPath,
        error: error.message
      });
      throw new Error(`Download directory creation failed: ${error.message}`);
    }
  }

  /**
   * Ensure user data directory exists
   * @returns {Promise<void>}
   */
  async ensureUserDataDirectory() {
    try {
      await fs.mkdir(config.paths.userData, { recursive: true });
      Logger.debug(`User data directory ensured: ${config.paths.userData}`);
    } catch (error) {
      Logger.error('Failed to create user data directory', {
        path: config.paths.userData,
        error: error.message
      });
      throw new Error(`User data directory creation failed: ${error.message}`);
    }
  }

  /**
   * Get page metrics for monitoring
   * @param {string} pageId - Page identifier
   * @returns {Promise<Object>} Page metrics
   */
  async getPageMetrics(pageId = 'default') {
    try {
      const page = this.pages.get(pageId);
      if (!page) {
        return null;
      }

      const metrics = await page.metrics();
      return {
        pageId,
        timestamp: new Date().toISOString(),
        ...metrics
      };
    } catch (error) {
      Logger.error(`Failed to get page metrics: ${pageId}`, {
        error: error.message
      });
      return null;
    }
  }

  /**
   * Restart browser (useful for recovery)
   * @returns {Promise<void>}
   */
  async restart() {
    try {
      Logger.info('Restarting browser');

      await this.close();
      await this.launch();

      Logger.info('Browser restarted successfully');
    } catch (error) {
      Logger.error('Failed to restart browser', { error: error.message });
      throw new Error(`Browser restart failed: ${error.message}`);
    }
  }
}

module.exports = BrowserService;
