const { Logger } = require('../utils/logger');
const config = require('../config');
const { SELECTORS } = require('../constants');

/**
 * AuthService - Handles Loyverse POS authentication
 * Manages login flow, credential validation, and session management
 */
class AuthService {
  constructor(browserService) {
    this.browserService = browserService;
    this.isAuthenticated = false;
    this.loginUrl = 'https://loyverse.com/en/login';
    this.dashboardUrl = 'https://r.loyverse.com';
  }

  /**
   * Authenticate user with Loyverse POS
   * @param {string} pageId - Page identifier for browser service
   * @returns {Promise<boolean>} True if authentication successful
   * @throws {Error} If authentication fails
   */
  async authenticate(pageId = 'auth-page') {
    try {
      Logger.info('Starting Loyverse authentication process');

      // Get or create page
      let page = this.browserService.getPage(pageId);
      if (!page) {
        page = await this.browserService.createPage(pageId);
      }

      // Navigate to login page
      await this.navigateToLogin(page);

      // Fill login form
      await this.fillLoginForm(page);

      // Submit form and wait for response
      const success = await this.submitLoginForm(page);

      if (success) {
        this.isAuthenticated = true;
        Logger.info('Authentication successful');
        return true;
      } else {
        this.isAuthenticated = false;
        Logger.error('Authentication failed');
        return false;
      }
    } catch (error) {
      this.isAuthenticated = false;
      Logger.error('Authentication error', { error: error.message });
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Navigate to login page
   * @param {Page} page - Puppeteer page instance
   * @returns {Promise<void>}
   */
  async navigateToLogin(page) {
    try {
      Logger.info('Navigating to login page', { url: this.loginUrl });

      await page.goto(this.loginUrl, {
        waitUntil: 'networkidle2',
        timeout: config.timeouts.navigation
      });

      // Wait for login form to be visible
      await page.waitForSelector(SELECTORS.LOGIN.LOGIN_FORM, {
        visible: true,
        timeout: config.timeouts.navigation
      });

      Logger.info('Successfully navigated to login page');
    } catch (error) {
      Logger.error('Failed to navigate to login page', {
        error: error.message
      });
      throw new Error(`Navigation failed: ${error.message}`);
    }
  }

  /**
   * Fill login form with credentials
   * @param {Page} page - Puppeteer page instance
   * @returns {Promise<void>}
   */
  async fillLoginForm(page) {
    try {
      Logger.info('Filling login form with credentials');

      // Wait for email input to be visible
      await page.waitForSelector(SELECTORS.LOGIN.EMAIL_INPUT, {
        visible: true,
        timeout: config.timeouts.navigation
      });

      // Clear and fill email field
      await page.click(SELECTORS.LOGIN.EMAIL_INPUT);
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.type(SELECTORS.LOGIN.EMAIL_INPUT, config.loyverse.username);

      // Wait for password input to be visible
      await page.waitForSelector(SELECTORS.LOGIN.PASSWORD_INPUT, {
        visible: true,
        timeout: config.timeouts.navigation
      });

      // Clear and fill password field
      await page.click(SELECTORS.LOGIN.PASSWORD_INPUT);
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.type(SELECTORS.LOGIN.PASSWORD_INPUT, config.loyverse.password);

      // Optional: Check remember me checkbox
      try {
        const rememberMeCheckbox = await page.$(
          SELECTORS.LOGIN.REMEMBER_ME_CHECKBOX
        );
        if (rememberMeCheckbox) {
          const isChecked = await page.evaluate(
            checkbox => checkbox.checked,
            rememberMeCheckbox
          );
          if (!isChecked) {
            await page.click(SELECTORS.LOGIN.REMEMBER_ME_CHECKBOX);
          }
        }
      } catch (checkboxError) {
        Logger.debug('Remember me checkbox not found or already checked');
      }

      Logger.info('Login form filled successfully');
    } catch (error) {
      Logger.error('Failed to fill login form', { error: error.message });
      throw new Error(`Form filling failed: ${error.message}`);
    }
  }

  /**
   * Submit login form and handle response
   * @param {Page} page - Puppeteer page instance
   * @returns {Promise<boolean>} True if login successful
   */
  async submitLoginForm(page) {
    try {
      Logger.info('Submitting login form');

      // Click login button
      await page.click(SELECTORS.LOGIN.LOGIN_BUTTON);

      // Wait for either success (redirect) or error message
      const result = await Promise.race([
        this.waitForLoginSuccess(page),
        this.waitForLoginError(page)
      ]);

      return result.success;
    } catch (error) {
      Logger.error('Failed to submit login form', { error: error.message });
      throw new Error(`Form submission failed: ${error.message}`);
    }
  }

  /**
   * Wait for successful login (redirect to dashboard)
   * @param {Page} page - Puppeteer page instance
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async waitForLoginSuccess(page) {
    try {
      // Wait for URL change or dashboard elements
      await Promise.race([
        page.waitForNavigation({
          waitUntil: 'networkidle2',
          timeout: config.timeouts.navigation
        }),
        page.waitForFunction(
          () => window.location.href.includes('r.loyverse.com'), // eslint-disable-line no-undef
          { timeout: config.timeouts.navigation }
        )
      ]);

      const currentUrl = page.url();

      if (currentUrl.includes('r.loyverse.com')) {
        Logger.info('Login successful - redirected to dashboard', {
          url: currentUrl
        });
        return { success: true, message: 'Login successful' };
      }

      // If we're still on login page, check for dashboard indicators
      try {
        await page.waitForSelector(SELECTORS.DASHBOARD.INDICATOR, {
          visible: true,
          timeout: 5000
        });
        Logger.info('Login successful - dashboard loaded');
        return { success: true, message: 'Login successful' };
      } catch (dashboardError) {
        Logger.debug('Dashboard indicator not found');
      }

      return { success: false, message: 'Login status unclear' };
    } catch (error) {
      Logger.debug('Waiting for login success timed out', {
        error: error.message
      });
      return { success: false, message: 'Login timeout' };
    }
  }

  /**
   * Wait for login error message
   * @param {Page} page - Puppeteer page instance
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async waitForLoginError(page) {
    try {
      await page.waitForSelector(SELECTORS.LOGIN.ERROR_MESSAGE, {
        visible: true,
        timeout: config.timeouts.navigation
      });

      const errorText = await page.evaluate(selector => {
        const element = document.querySelector(selector); // eslint-disable-line no-undef
        return element ? element.textContent.trim() : 'Unknown error';
      }, SELECTORS.LOGIN.ERROR_MESSAGE);

      Logger.error('Login failed with error', { error: errorText });
      return { success: false, message: errorText };
    } catch (error) {
      Logger.debug('No error message found, login might be successful');
      throw error; // Re-throw to let the race condition handle it
    }
  }

  /**
   * Verify current authentication status
   * @param {Page} page - Puppeteer page instance
   * @returns {Promise<boolean>} True if authenticated
   */
  async verifyAuthentication(page) {
    try {
      const currentUrl = page.url();

      // Check if we're on the dashboard
      if (currentUrl.includes('r.loyverse.com')) {
        this.isAuthenticated = true;
        Logger.info('Authentication verified - on dashboard');
        return true;
      }

      // Check for dashboard elements
      try {
        await page.waitForSelector(SELECTORS.DASHBOARD.INDICATOR, {
          visible: true,
          timeout: 5000
        });
        this.isAuthenticated = true;
        Logger.info('Authentication verified - dashboard elements found');
        return true;
      } catch (dashboardError) {
        this.isAuthenticated = false;
        Logger.warn('Authentication verification failed - not on dashboard');
        return false;
      }
    } catch (error) {
      this.isAuthenticated = false;
      Logger.error('Authentication verification error', {
        error: error.message
      });
      return false;
    }
  }

  /**
   * Handle session timeout or logout
   * @param {Page} page - Puppeteer page instance
   * @returns {Promise<void>}
   */
  async handleSessionTimeout(page) {
    try {
      Logger.warn('Handling session timeout');

      this.isAuthenticated = false;

      // Check if we're redirected to login page
      const currentUrl = page.url();
      if (currentUrl.includes('login')) {
        Logger.info('Session expired - redirected to login');
        return;
      }

      // Navigate to login page if not already there
      await this.navigateToLogin(page);
    } catch (error) {
      Logger.error('Error handling session timeout', { error: error.message });
      throw new Error(`Session timeout handling failed: ${error.message}`);
    }
  }

  /**
   * Logout from Loyverse (if needed)
   * @param {Page} page - Puppeteer page instance
   * @returns {Promise<void>}
   */
  async logout(page) {
    try {
      Logger.info('Logging out from Loyverse');

      // Look for logout button or menu
      const logoutSelectors = SELECTORS.DASHBOARD.LOGOUT_BUTTON.split(', ');

      for (const selector of logoutSelectors) {
        try {
          await page.waitForSelector(selector, {
            visible: true,
            timeout: 2000
          });
          await page.click(selector);
          Logger.info('Logout button clicked');
          break;
        } catch (selectorError) {
          Logger.debug(`Logout selector not found: ${selector}`);
        }
      }

      // Wait for redirect to login page
      await page.waitForFunction(
        () => window.location.href.includes('login'), // eslint-disable-line no-undef
        { timeout: config.timeouts.navigation }
      );

      this.isAuthenticated = false;
      Logger.info('Logout successful');
    } catch (error) {
      Logger.error('Logout failed', { error: error.message });
      // Don't throw error for logout operations
    }
  }

  /**
   * Get current authentication status
   * @returns {boolean} True if authenticated
   */
  getAuthenticationStatus() {
    return this.isAuthenticated;
  }

  /**
   * Reset authentication state
   * @returns {void}
   */
  resetAuthenticationState() {
    this.isAuthenticated = false;
    Logger.info('Authentication state reset');
  }

  /**
   * Take screenshot for debugging authentication issues
   * @param {Page} page - Puppeteer page instance
   * @param {string} step - Current step in authentication process
   * @returns {Promise<void>}
   */
  async debugScreenshot(page, step) {
    try {
      const filename = `auth-debug-${step}-${Date.now()}`;
      await this.browserService.takeScreenshot(page, filename);
      Logger.debug(`Debug screenshot taken for step: ${step}`);
    } catch (error) {
      Logger.error('Failed to take debug screenshot', {
        step,
        error: error.message
      });
    }
  }
}

module.exports = AuthService;
