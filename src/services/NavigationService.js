const { Logger } = require('../utils/logger');
const {
  SELECTORS,
  LOYVERSE_URLS,
  STORE_CONFIG,
  TIMEOUTS,
  ERROR_CODES,
  DATE_FORMATS
} = require('../constants');

/**
 * NavigationService - Handles page navigation and element interaction
 * Manages navigation to sales reports, store selection, and export functionality
 */
class NavigationService {
  constructor() {
    this.logger = new Logger('NavigationService');
  }

  /**
   * Navigate to sales report page using direct URL approach
   * @param {Object} page - Puppeteer page instance
   * @param {Object} options - Navigation options
   * @param {string} options.date - Date for the report (YYYY-MM-DD format)
   * @param {string} options.storeName - Store name to filter (optional)
   * @returns {Promise<boolean>} Success status
   */
  async navigateToSalesReport(page, options = {}) {
    try {
      this.logger.info('Navigating to sales report page', { options });

      const { date, storeName } = options;

      // Format date for URL parameters
      const urlDate = this.formatDateForUrl(date);

      // Build URL with parameters
      const reportUrl = LOYVERSE_URLS.SALES_REPORT_URL({
        from: `${urlDate} 00:00:00`,
        to: `${urlDate} 23:59:59`,
        outletsIds: storeName ? this.getStoreIdByName(storeName) : 'all',
        merchantsIds: 'all'
      });

      this.logger.debug('Navigating to URL', { url: reportUrl });

      // Navigate to the sales report page
      await page.goto(reportUrl, {
        waitUntil: 'networkidle2',
        timeout: TIMEOUTS.NAVIGATION_TIMEOUT
      });

      // Wait for page to load and filters to be visible
      await this.waitForPageLoad(page);

      this.logger.info('Successfully navigated to sales report page');
      return true;
    } catch (error) {
      this.logger.error('Failed to navigate to sales report page', {
        error: error.message,
        options
      });
      throw new Error(`${ERROR_CODES.NAVIGATION_ERROR}: ${error.message}`);
    }
  }

  /**
   * Select a specific store from the store filter dropdown
   * @param {Object} page - Puppeteer page instance
   * @param {string} storeName - Name of the store to select
   * @returns {Promise<boolean>} Success status
   */
  async selectStore(page, storeName) {
    try {
      this.logger.info('Selecting store', { storeName });

      // Validate store name
      if (!this.isValidStoreName(storeName)) {
        throw new Error(`Invalid store name: ${storeName}`);
      }

      // First, ensure "All stores" is unchecked
      await this.deselectAllStores(page);

      // Open store filter dropdown
      await this.openStoreFilterDropdown(page);

      // Select the specific store
      await this.selectSpecificStore(page, storeName);

      // Close dropdown by clicking outside or pressing escape
      await this.closeStoreFilterDropdown(page);

      // Wait for page to update with new filter
      await this.waitForFilterUpdate(page);

      this.logger.info('Successfully selected store', { storeName });
      return true;
    } catch (error) {
      this.logger.error('Failed to select store', {
        error: error.message,
        storeName
      });
      throw new Error(`${ERROR_CODES.STORE_NOT_FOUND}: ${error.message}`);
    }
  }

  /**
   * Select all stores option
   * @param {Object} page - Puppeteer page instance
   * @returns {Promise<boolean>} Success status
   */
  async selectAllStores(page) {
    try {
      this.logger.info('Selecting all stores');

      // Open store filter dropdown
      await this.openStoreFilterDropdown(page);

      // Click "All stores" checkbox
      const allStoresCheckbox = await page.waitForSelector(
        SELECTORS.SALES_REPORT.ALL_STORES_CHECKBOX,
        { timeout: TIMEOUTS.ELEMENT_WAIT_TIMEOUT }
      );

      await allStoresCheckbox.click();

      // Close dropdown
      await this.closeStoreFilterDropdown(page);

      // Wait for page to update
      await this.waitForFilterUpdate(page);

      this.logger.info('Successfully selected all stores');
      return true;
    } catch (error) {
      this.logger.error('Failed to select all stores', {
        error: error.message
      });
      throw new Error(
        `${ERROR_CODES.INVALID_STORE_SELECTION}: ${error.message}`
      );
    }
  }

  /**
   * Trigger CSV export
   * @param {Object} page - Puppeteer page instance
   * @returns {Promise<boolean>} Success status
   */
  async exportData(page) {
    try {
      this.logger.info('Triggering data export');

      // Wait for export button to be available
      const exportButton = await page.waitForSelector(
        SELECTORS.SALES_REPORT.EXPORT_BUTTON,
        {
          visible: true,
          timeout: TIMEOUTS.ELEMENT_WAIT_TIMEOUT
        }
      );

      // Check if button is enabled
      const isDisabled = await exportButton.evaluate(el => el.disabled);
      if (isDisabled) {
        throw new Error('Export button is disabled');
      }

      // Click export button
      await exportButton.click();

      this.logger.info('Export button clicked successfully');
      return true;
    } catch (error) {
      this.logger.error('Failed to trigger export', { error: error.message });
      throw new Error(`${ERROR_CODES.DOWNLOAD_FAILED}: ${error.message}`);
    }
  }

  /**
   * Wait for page to load completely
   * @param {Object} page - Puppeteer page instance
   * @returns {Promise<void>}
   */
  async waitForPageLoad(page) {
    try {
      this.logger.debug('Waiting for page to load');

      // Wait for filters container to be visible
      await page.waitForSelector(SELECTORS.SALES_REPORT.FILTERS_CONTAINER, {
        visible: true,
        timeout: TIMEOUTS.PAGE_LOAD_TIMEOUT
      });

      // Wait for any loading indicators to disappear
      await page.waitForFunction(
        () => {
          // eslint-disable-next-line no-undef
          const loadingElements = document.querySelectorAll(
            '.loading, .md-progress-circular, .spinner'
          );
          return (
            loadingElements.length === 0 ||
            Array.from(loadingElements).every(el => el.style.display === 'none')
          );
        },
        { timeout: TIMEOUTS.ELEMENT_WAIT_TIMEOUT }
      );

      // Additional wait for Angular to settle
      await page.waitForTimeout(1000);

      this.logger.debug('Page loaded successfully');
    } catch (error) {
      this.logger.error('Page load timeout', { error: error.message });
      throw new Error(`${ERROR_CODES.PAGE_LOAD_TIMEOUT}: ${error.message}`);
    }
  }

  /**
   * Open store filter dropdown
   * @param {Object} page - Puppeteer page instance
   * @returns {Promise<void>}
   */
  async openStoreFilterDropdown(page) {
    try {
      this.logger.debug('Opening store filter dropdown');

      const filterButton = await page.waitForSelector(
        SELECTORS.SALES_REPORT.STORE_FILTER_BUTTON,
        {
          visible: true,
          timeout: TIMEOUTS.ELEMENT_WAIT_TIMEOUT
        }
      );

      await filterButton.click();

      // Wait for dropdown menu to appear
      await page.waitForSelector(SELECTORS.SALES_REPORT.STORE_FILTER_MENU, {
        visible: true,
        timeout: TIMEOUTS.ELEMENT_WAIT_TIMEOUT
      });

      this.logger.debug('Store filter dropdown opened');
    } catch (error) {
      this.logger.error('Failed to open store filter dropdown', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Close store filter dropdown
   * @param {Object} page - Puppeteer page instance
   * @returns {Promise<void>}
   */
  async closeStoreFilterDropdown(page) {
    try {
      this.logger.debug('Closing store filter dropdown');

      // Click outside the dropdown to close it
      await page.click('body');

      // Wait for dropdown to close
      await page.waitForFunction(
        () => {
          // eslint-disable-next-line no-undef
          const menu = document.querySelector('#menu_container_10');
          return !menu || menu.style.display === 'none';
        },
        { timeout: TIMEOUTS.ELEMENT_WAIT_TIMEOUT }
      );

      this.logger.debug('Store filter dropdown closed');
    } catch (error) {
      this.logger.debug('Dropdown may already be closed', {
        error: error.message
      });
      // Non-critical error, continue execution
    }
  }

  /**
   * Deselect all stores option
   * @param {Object} page - Puppeteer page instance
   * @returns {Promise<void>}
   */
  async deselectAllStores(page) {
    try {
      this.logger.debug('Deselecting all stores');

      // Open dropdown
      await this.openStoreFilterDropdown(page);

      // Check if "All stores" is currently selected
      const allStoresCheckbox = await page.$(
        SELECTORS.SALES_REPORT.ALL_STORES_CHECKBOX
      );

      if (allStoresCheckbox) {
        const isChecked = await allStoresCheckbox.evaluate(
          el => el.getAttribute('aria-checked') === 'true'
        );

        if (isChecked) {
          await allStoresCheckbox.click();
          this.logger.debug('All stores option deselected');
        }
      }
    } catch (error) {
      this.logger.debug('Failed to deselect all stores', {
        error: error.message
      });
      // Non-critical error, continue execution
    }
  }

  /**
   * Select a specific store checkbox
   * @param {Object} page - Puppeteer page instance
   * @param {string} storeName - Name of the store to select
   * @returns {Promise<void>}
   */
  async selectSpecificStore(page, storeName) {
    try {
      this.logger.debug('Selecting specific store', { storeName });

      // Try to select by aria-label first
      const storeCheckboxSelector =
        SELECTORS.SALES_REPORT.STORE_CHECKBOX_BY_LABEL(storeName);
      let storeCheckbox = await page.$(storeCheckboxSelector);

      // If not found by label, try by store ID
      if (!storeCheckbox) {
        const storeId = this.getStoreIdByName(storeName);
        if (storeId) {
          const storeCheckboxByIdSelector =
            SELECTORS.SALES_REPORT.STORE_CHECKBOX_BY_ID(storeId);
          storeCheckbox = await page.$(storeCheckboxByIdSelector);
        }
      }

      if (!storeCheckbox) {
        throw new Error(`Store checkbox not found for: ${storeName}`);
      }

      // Check if already selected
      const isChecked = await storeCheckbox.evaluate(
        el => el.getAttribute('aria-checked') === 'true'
      );

      if (!isChecked) {
        await storeCheckbox.click();
        this.logger.debug('Store selected', { storeName });
      } else {
        this.logger.debug('Store already selected', { storeName });
      }
    } catch (error) {
      this.logger.error('Failed to select specific store', {
        error: error.message,
        storeName
      });
      throw error;
    }
  }

  /**
   * Wait for filter update to complete
   * @param {Object} page - Puppeteer page instance
   * @returns {Promise<void>}
   */
  async waitForFilterUpdate(page) {
    try {
      this.logger.debug('Waiting for filter update');

      // Wait for any loading indicators
      await page.waitForFunction(
        () => {
          // eslint-disable-next-line no-undef
          const loadingElements = document.querySelectorAll(
            '.loading, .md-progress-circular'
          );
          return (
            loadingElements.length === 0 ||
            Array.from(loadingElements).every(el => el.style.display === 'none')
          );
        },
        { timeout: TIMEOUTS.ELEMENT_WAIT_TIMEOUT }
      );

      // Additional wait for data to update
      await page.waitForTimeout(2000);

      this.logger.debug('Filter update completed');
    } catch (error) {
      this.logger.debug('Filter update timeout', { error: error.message });
      // Non-critical error, continue execution
    }
  }

  /**
   * Format date for URL parameters
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {string} Formatted date for URL
   */
  formatDateForUrl(date) {
    if (!date) {
      // Default to today
      const today = new Date();
      return today.toISOString().split('T')[0];
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD`);
    }

    return date;
  }

  /**
   * Get store ID by store name
   * @param {string} storeName - Name of the store
   * @returns {string|null} Store ID or null if not found
   */
  getStoreIdByName(storeName) {
    return STORE_CONFIG.STORE_IDS[storeName] || null;
  }

  /**
   * Validate store name
   * @param {string} storeName - Name of the store to validate
   * @returns {boolean} True if valid store name
   */
  isValidStoreName(storeName) {
    return (
      STORE_CONFIG.STORE_NAMES.includes(storeName) ||
      storeName === STORE_CONFIG.ALL_STORES_OPTION
    );
  }

  /**
   * Get current page URL
   * @param {Object} page - Puppeteer page instance
   * @returns {Promise<string>} Current page URL
   */
  async getCurrentUrl(page) {
    return await page.url();
  }

  /**
   * Take screenshot for debugging
   * @param {Object} page - Puppeteer page instance
   * @param {string} filename - Screenshot filename
   * @returns {Promise<void>}
   */
  async takeScreenshot(page, filename = 'navigation-debug.png') {
    try {
      await page.screenshot({
        path: filename,
        fullPage: true
      });
      this.logger.debug('Screenshot taken', { filename });
    } catch (error) {
      this.logger.error('Failed to take screenshot', {
        error: error.message,
        filename
      });
    }
  }

  /**
   * Check if element exists and is visible
   * @param {Object} page - Puppeteer page instance
   * @param {string} selector - CSS selector
   * @returns {Promise<boolean>} True if element exists and is visible
   */
  async isElementVisible(page, selector) {
    try {
      const element = await page.$(selector);
      if (!element) return false;

      const isVisible = await element.isIntersectingViewport();
      return isVisible;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get available store names from the page
   * @param {Object} page - Puppeteer page instance
   * @returns {Promise<string[]>} Array of available store names
   */
  async getAvailableStores(page) {
    try {
      this.logger.debug('Getting available stores from page');

      // Open store filter dropdown
      await this.openStoreFilterDropdown(page);

      // Get all store checkboxes
      const storeElements = await page.$$(
        'md-menu-item .listCheckbox md-checkbox'
      );
      const storeNames = [];

      for (const element of storeElements) {
        const label = await element.evaluate(el =>
          el.getAttribute('aria-label')
        );
        if (label && label !== 'All stores') {
          storeNames.push(label);
        }
      }

      // Close dropdown
      await this.closeStoreFilterDropdown(page);

      this.logger.debug('Available stores retrieved', { stores: storeNames });
      return storeNames;
    } catch (error) {
      this.logger.error('Failed to get available stores', {
        error: error.message
      });
      return STORE_CONFIG.STORE_NAMES; // Return default list as fallback
    }
  }
}

module.exports = NavigationService;
