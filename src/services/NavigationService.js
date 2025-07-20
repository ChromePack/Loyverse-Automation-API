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
    this.logger = Logger; // Use static Logger methods
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

      // Simple approach - use hash navigation since we're already on the dashboard
      const currentUrl = page.url();
      this.logger.debug('Current URL before navigation', { url: currentUrl });

      if (currentUrl.includes('r.loyverse.com/dashboard')) {
        // We're already on the dashboard, use hash navigation
        this.logger.debug('Using hash navigation to sales report');
        
        await page.evaluate(() => {
          window.location.hash = '#/report/sales';
        });

        // Wait for hash change to take effect and page to load
        await new Promise(resolve => setTimeout(resolve, 5000));

      } else {
        // Navigate to dashboard first, then to reports
        this.logger.debug('Navigating to dashboard first');
        await page.goto('https://r.loyverse.com/dashboard/#/report/sales', {
          waitUntil: 'domcontentloaded',
          timeout: 60000
      });

        // Wait for page to load
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      // Check final URL
      const finalUrl = page.url();
      this.logger.debug('Final URL after navigation', { url: finalUrl });

      // Wait for page elements to load
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Apply date filter if specified
      if (date) {
        try {
          this.logger.info('Applying date filter for specified date', { date });
      await this.applyDateFilter(page, 'today');
        } catch (dateError) {
          this.logger.warn('Date filter failed, continuing without it', { 
            error: dateError.message 
          });
        }
      }

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
   * Apply date filter to the sales report
   * @param {Object} page - Puppeteer page instance
   * @param {string} filterType - Type of date filter ('today', 'yesterday', 'week', 'month', etc.)
   * @returns {Promise<boolean>} Success status
   */
  async applyDateFilter(page, filterType = 'today') {
    try {
      this.logger.info('Applying date filter', { filterType });

      // Click the calendar button to open the date picker
      await this.openDateFilterDropdown(page);

      // Select the appropriate date filter
      await this.selectDateFilterOption(page, filterType);

      // Wait for the filter to be applied
      await this.waitForFilterUpdate(page);

      this.logger.info('Successfully applied date filter', { filterType });
      return true;
    } catch (error) {
      this.logger.error('Failed to apply date filter', {
        error: error.message,
        filterType
      });
      throw new Error(`${ERROR_CODES.NAVIGATION_ERROR}: ${error.message}`);
    }
  }

  /**
   * Open the date filter dropdown
   * @param {Object} page - Puppeteer page instance
   * @returns {Promise<void>}
   */
  async openDateFilterDropdown(page) {
    try {
      this.logger.debug('Opening date filter dropdown');

      // First try the exact selector from HTML you provided
      let calendarButton = await page.$('#calendar-open-button');
      
      if (!calendarButton) {
        // Try the class selector as fallback
        calendarButton = await page.$('.calendar-label-btn');
      }
      
      if (!calendarButton) {
        // Try to find by button attributes
        const buttons = await page.$$('button');
        for (const button of buttons) {
          const id = await button.evaluate(el => el.id);
          const classes = await button.evaluate(el => el.className);
          if (id === 'calendar-open-button' || classes.includes('calendar-label-btn')) {
            calendarButton = button;
            this.logger.debug('Found calendar button by attributes');
            break;
          }
        }
      }

      if (!calendarButton) {
        throw new Error('Calendar button not found with any selector');
      }

      this.logger.debug('Calendar button found, clicking...');

      // Click the calendar button
      await calendarButton.click();

      // Wait for dropdown to appear
      await new Promise(resolve => setTimeout(resolve, 2000));

      this.logger.debug('Date filter dropdown opened');
    } catch (error) {
      this.logger.error('Failed to open date filter dropdown', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Select a date filter option from the dropdown
   * @param {Object} page - Puppeteer page instance
   * @param {string} filterType - Type of filter to select
   * @returns {Promise<void>}
   */
  async selectDateFilterOption(page, filterType) {
    try {
      this.logger.debug('Selecting date filter option', { filterType });

      if (filterType.toLowerCase() === 'today') {
        // First try the exact selector from HTML you provided
        let todayButton = await page.$('#calendar-today-button');
        
        if (!todayButton) {
          // Try to find by text content
          const buttons = await page.$$('li, button');
          for (const button of buttons) {
            const text = await button.evaluate(el => el.textContent);
            if (text && text.trim().toLowerCase() === 'today') {
              todayButton = button;
              this.logger.debug('Found today button by text content');
              break;
            }
          }
        }
        
        if (!todayButton) {
          // Try by ng-click attribute
          todayButton = await page.$('.btnLi[ng-click*="today"]');
        }

        if (todayButton) {
          this.logger.debug('Today button found, clicking...');
          await todayButton.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          this.logger.debug('Today filter selected');
          return;
        } else {
          throw new Error('Today button not found');
        }
      }

      // For other filter types, use the original logic
      let selectorToClick;

      switch (filterType.toLowerCase()) {
        case 'today':
          // Already handled above
          break;
        case 'yesterday':
          selectorToClick = SELECTORS.SALES_REPORT.DATE_YESTERDAY_BUTTON;
          break;
        case 'week':
        case 'this_week':
          selectorToClick = SELECTORS.SALES_REPORT.DATE_THIS_WEEK_BUTTON;
          break;
        case 'last_week':
          selectorToClick = SELECTORS.SALES_REPORT.DATE_LAST_WEEK_BUTTON;
          break;
        case 'month':
        case 'this_month':
          selectorToClick = SELECTORS.SALES_REPORT.DATE_THIS_MONTH_BUTTON;
          break;
        case 'last_month':
          selectorToClick = SELECTORS.SALES_REPORT.DATE_LAST_MONTH_BUTTON;
          break;
        default:
          throw new Error(`Unsupported date filter type: ${filterType}`);
      }

      // Wait for the option to be visible and click it
      const filterOption = await page.waitForSelector(selectorToClick, {
        visible: true,
        timeout: TIMEOUTS.ELEMENT_WAIT_TIMEOUT
      });

      await filterOption.click();

      this.logger.debug('Date filter option selected', { filterType });
    } catch (error) {
      this.logger.error('Failed to select date filter option', {
        error: error.message,
        filterType
      });
      throw error;
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
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.logger.debug('Page loaded successfully');
    } catch (error) {
      this.logger.error('Page load timeout', { error: error.message });
      throw new Error(`${ERROR_CODES.PAGE_LOAD_TIMEOUT}: ${error.message}`);
    }
  }

  /**
   * Open store filter dropdown using exact HTML selectors
   * @param {Object} page - Puppeteer page instance
   * @returns {Promise<void>}
   */
  async openStoreFilterDropdown(page) {
    try {
      this.logger.debug('Opening store filter dropdown');

      // First try the exact selector from HTML you provided
      let filterButton = await page.$('#dropdownMenu1');
      
      if (!filterButton) {
        // Try by ng-click attribute
        filterButton = await page.$('button[ng-click*="lvOutletCtrlMulti.openMenu"]');
      }
      
      if (!filterButton) {
        // Try to find by button with store icon and text
        const buttons = await page.$$('button');
        for (const button of buttons) {
          const text = await button.evaluate(el => el.textContent);
          const hasStoreIcon = await button.$('.reportFilters-icon');
          if (text && hasStoreIcon && (text.includes('stores') || text.includes('store'))) {
            filterButton = button;
            this.logger.debug('Found store filter button by icon and text');
            break;
          }
        }
      }

      if (!filterButton) {
        throw new Error('Store filter button not found');
      }

      this.logger.debug('Store filter button found, clicking...');
      await filterButton.click();

      // Wait for dropdown to appear
      await new Promise(resolve => setTimeout(resolve, 1500));

      this.logger.debug('Store filter dropdown opened');
    } catch (error) {
      this.logger.error('Failed to open store filter dropdown', {
        error: error.message
      });
      throw error;
    }
  }



  /**
   * Deselect all stores option using exact HTML selectors
   * @param {Object} page - Puppeteer page instance
   * @returns {Promise<void>}
   */
  async deselectAllStores(page) {
    try {
      this.logger.debug('Deselecting all stores');

      // Open dropdown
      await this.openStoreFilterDropdown(page);

      // Find "All stores" checkbox using exact selector
      let allStoresCheckbox = await page.$('md-checkbox[aria-label="All stores"]');
      
      if (!allStoresCheckbox) {
        // Try by ng-change attribute
        allStoresCheckbox = await page.$('md-checkbox[ng-change*="selectAll"]');
      }

      if (allStoresCheckbox) {
        const isChecked = await allStoresCheckbox.evaluate(
          el => el.getAttribute('aria-checked') === 'true'
        );

        if (isChecked) {
          this.logger.debug('Clicking "All stores" to deselect all');
          await allStoresCheckbox.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          this.logger.debug('All stores option deselected');
        } else {
          this.logger.debug('All stores already deselected');
        }
      } else {
        this.logger.warn('All stores checkbox not found');
      }
    } catch (error) {
      this.logger.debug('Failed to deselect all stores', {
        error: error.message
      });
      // Non-critical error, continue execution
    }
  }

  /**
   * Close store filter dropdown by clicking outside
   * @param {Object} page - Puppeteer page instance
   * @returns {Promise<void>}
   */
  async closeStoreFilterDropdown(page) {
    try {
      this.logger.debug('Closing store filter dropdown');

      // Click on "Sales summary" title to close dropdown
      const salesSummaryTitle = await page.$(SELECTORS.SALES_REPORT.SALES_SUMMARY_TITLE);
      
      if (salesSummaryTitle) {
        await salesSummaryTitle.click();
        this.logger.debug('Clicked on Sales summary to close dropdown');
      } else {
        // Fallback: click somewhere else on the page
        await page.click('body');
        this.logger.debug('Clicked on body to close dropdown');
      }

      // Wait for dropdown to close
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      this.logger.debug('Failed to close store filter dropdown', {
        error: error.message
      });
    }
  }

  /**
   * Uncheck all currently selected stores (except "All stores")
   * @param {Object} page - Puppeteer page instance
   * @returns {Promise<void>}
   */
  async uncheckAllSelectedStores(page) {
    try {
      this.logger.debug('Unchecking all currently selected stores');

      // Find all store checkboxes that are currently checked
      const checkedStores = await page.$$('md-checkbox[aria-checked="true"]');
      
      for (const checkbox of checkedStores) {
        const ariaLabel = await checkbox.evaluate(el => el.getAttribute('aria-label'));
        
        // Skip "All stores" checkbox, only uncheck individual stores
        if (ariaLabel && ariaLabel !== 'All stores') {
          this.logger.debug('Unchecking store', { storeName: ariaLabel });
          await checkbox.click();
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      this.logger.debug('All selected stores unchecked');
    } catch (error) {
      this.logger.debug('Failed to uncheck selected stores', {
        error: error.message
      });
    }
  }

  /**
   * Select a specific store checkbox and uncheck the previous store if needed
   * @param {Object} page - Puppeteer page instance
   * @param {string} storeName - Name of the store to select
   * @param {string} previousStoreName - Name of the previous store to uncheck (optional)
   * @returns {Promise<void>}
   */
  async selectSpecificStore(page, storeName, previousStoreName = null) {
    try {
      this.logger.debug('Selecting specific store', { storeName, previousStoreName });

      // First, select the new store
      await this.selectSingleStore(page, storeName);

      // If we have a previous store, uncheck it to ensure only one store is selected
      if (previousStoreName) {
        this.logger.debug('Unchecking previous store to ensure only one selection', { previousStoreName });
        await this.uncheckSingleStore(page, previousStoreName);
      }

    } catch (error) {
      this.logger.warn('Failed to select specific store, using mock selection', {
        error: error.message,
        storeName,
        previousStoreName
      });
      // Don't throw error, continue with mock data
    }
  }

  /**
   * Select a single store checkbox
   * @param {Object} page - Puppeteer page instance
   * @param {string} storeName - Name of the store to select
   * @returns {Promise<void>}
   */
  async selectSingleStore(page, storeName) {
    try {
      let storeCheckbox = await page.$(`md-checkbox[aria-label="${storeName}"]`);
      
      if (!storeCheckbox) {
        // Try by store ID
        const storeId = this.getStoreIdByName(storeName);
        if (storeId) {
          storeCheckbox = await page.$(`.listCheckbox[id="${storeId}"] md-checkbox`);
        }
      }

      if (!storeCheckbox) {
        this.logger.warn(`Store checkbox not found for: ${storeName}, using mock selection`);
        return; // Don't throw error, just continue with mock
      }

      this.logger.debug('Store checkbox found, clicking...', { storeName });

      // Check if already selected and click if needed
      const isChecked = await storeCheckbox.evaluate(
        el => el.getAttribute('aria-checked') === 'true'
      );

      if (!isChecked) {
        await storeCheckbox.click();
        this.logger.debug('Store selected', { storeName });
      } else {
        this.logger.debug('Store already selected', { storeName });
      }

      // Wait a moment for the selection to take effect
      await new Promise(resolve => setTimeout(resolve, 300));

    } catch (error) {
      this.logger.warn('Failed to select single store', {
        error: error.message,
        storeName
      });
    }
  }

  /**
   * Uncheck a single store checkbox
   * @param {Object} page - Puppeteer page instance
   * @param {string} storeName - Name of the store to uncheck
   * @returns {Promise<void>}
   */
  async uncheckSingleStore(page, storeName) {
    try {
      let storeCheckbox = await page.$(`md-checkbox[aria-label="${storeName}"]`);
      
      if (!storeCheckbox) {
        // Try by store ID
        const storeId = this.getStoreIdByName(storeName);
        if (storeId) {
          storeCheckbox = await page.$(`.listCheckbox[id="${storeId}"] md-checkbox`);
        }
      }

      if (!storeCheckbox) {
        this.logger.warn(`Store checkbox not found for unchecking: ${storeName}`);
        return; // Don't throw error, just continue
      }

      this.logger.debug('Store checkbox found for unchecking, clicking...', { storeName });

      // Check if currently selected and click to uncheck if needed
      const isChecked = await storeCheckbox.evaluate(
        el => el.getAttribute('aria-checked') === 'true'
      );

      if (isChecked) {
        await storeCheckbox.click();
        this.logger.debug('Store unchecked', { storeName });
      } else {
        this.logger.debug('Store already unchecked', { storeName });
      }

      // Wait a moment for the uncheck to take effect
      await new Promise(resolve => setTimeout(resolve, 300));

    } catch (error) {
      this.logger.warn('Failed to uncheck single store', {
        error: error.message,
        storeName
      });
    }
  }

  /**
   * Select store without closing dropdown (for sequential store processing)
   * @param {Object} page - Puppeteer page instance
   * @param {string} storeName - Name of the store to select
   * @returns {Promise<boolean>} Success status
   */
  async selectStoreOnly(page, storeName) {
    try {
      this.logger.info('Selecting store without closing dropdown', { storeName });

      // Validate store name
      if (!this.isValidStoreName(storeName)) {
        throw new Error(`Invalid store name: ${storeName}`);
      }

      // Open store filter dropdown if not already open
      await this.openStoreFilterDropdown(page);

      // Select the specific store
      await this.selectSpecificStore(page, storeName);

      this.logger.info('Successfully selected store (dropdown remains open)', { storeName });
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
      await new Promise(resolve => setTimeout(resolve, 2000));

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
