const puppeteer = require('puppeteer');
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
      Logger.info('Launching browser with configuration', {
        headless: config.puppeteer.headless,
        downloadPath: this.downloadPath
      });

      // Ensure download directory exists
      await this.ensureDownloadDirectory();

      // Launch browser with configuration
      this.browser = await puppeteer.launch({
        ...config.puppeteer.launchOptions,
        headless: config.puppeteer.headless
      });

      this.isInitialized = true;
      Logger.info('Browser launched successfully');

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

      Logger.info(`Creating new page: ${pageId}`);

      const page = await this.browser.newPage();

      // Configure download behavior
      await this.configurePageDownloads(page);

      // Set timeouts
      page.setDefaultTimeout(config.timeouts.navigation);
      page.setDefaultNavigationTimeout(config.timeouts.navigation);

      // Store page reference
      this.pages.set(pageId, page);

      // Handle page close
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
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      );

      // Set extra headers
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9'
      });

      Logger.debug('Page download configuration completed');
    } catch (error) {
      Logger.error('Failed to configure page downloads', {
        error: error.message
      });
      throw new Error(`Download configuration failed: ${error.message}`);
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
