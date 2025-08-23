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
    this.loginUrl = 'https://r.loyverse.com';
    this.dashboardUrl = 'https://r.loyverse.com';
  }

  /**
   * Generate human-like delay between actions
   * @param {number} min - Minimum delay in milliseconds
   * @param {number} max - Maximum delay in milliseconds
   * @returns {Promise<void>}
   */
  async humanLikeDelay(min = 100, max = 300) {
    const delay = Math.random() * (max - min) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Type text in a human-like manner with random delays
   * @param {Page} page - Puppeteer page instance
   * @param {string} selector - Element selector
   * @param {string} text - Text to type
   * @returns {Promise<void>}
   */
  async humanLikeTyping(page, selector, text) {
    Logger.debug('⌨️  Starting human-like typing:', {
      selector: selector,
      textLength: text ? text.length : 0,
      textPreview: text ? (text.length > 10 ? text.substring(0, 10) + '...' : text) : 'EMPTY'
    });

    await page.click(selector);
    await this.humanLikeDelay(200, 500);

    // Clear existing text
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    await this.humanLikeDelay(50, 100);

    // Type each character with random delays
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      await page.keyboard.type(char);
      
      // Log progress for long texts
      if (text.length > 20 && (i + 1) % 10 === 0) {
        Logger.debug(`⌨️  Typing progress: ${i + 1}/${text.length} characters`);
      }
      
      await this.humanLikeDelay(50, 150);
    }

    Logger.debug('✅ Human-like typing completed:', {
      totalCharacters: text ? text.length : 0
    });

    await this.humanLikeDelay(100, 200);
  }

  /**
   * Move mouse in a human-like pattern before clicking
   * @param {Page} page - Puppeteer page instance
   * @param {string} selector - Element selector
   * @returns {Promise<void>}
   */
  async humanLikeClick(page, selector) {
    const element = await page.$(selector);
    if (element) {
      const box = await element.boundingBox();
      if (box) {
        // Move mouse to a random position within the element
        const x = box.x + Math.random() * box.width;
        const y = box.y + Math.random() * box.height;

        await page.mouse.move(x, y);
        await this.humanLikeDelay(100, 200);
        await page.mouse.click(x, y);
      } else {
        // Fallback to regular click
        await page.click(selector);
      }
    }
    await this.humanLikeDelay(200, 400);
  }

  /**
   * Authenticate user with Loyverse POS
   * @param {string} pageId - Page identifier for browser service
   * @returns {Promise<boolean>} True if authentication successful
   * @throws {Error} If authentication fails
   */
  /**
   * Apply enhanced anti-detection measures to a page
   * Implements Option 1 and Option 2 enhancements
   * @param {Page} page - Puppeteer page instance
   * @returns {Promise<void>}
   */
  async applyEnhancedAntiDetection(page) {
    try {
      Logger.info('Applying enhanced anti-detection measures');

      // Set realistic user agent (Chrome instead of HeadlessChrome)
      const userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
      await page.setUserAgent(userAgent);

      // Set realistic viewport
      await page.setViewport({
        width: 1366,
        height: 768,
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false,
        isLandscape: true
      });

      // Set realistic headers
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Cache-Control': 'max-age=0',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1'
      });

      // Inject comprehensive anti-detection scripts
      await page.evaluateOnNewDocument(() => {
        // Override webdriver property
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false,
          configurable: true
        });

        // Override plugins to match real Chrome
        Object.defineProperty(navigator, 'plugins', {
          get: () => [
            {
              name: 'Chrome PDF Plugin',
              filename: 'internal-pdf-viewer',
              description: 'Portable Document Format',
              length: 1
            },
            {
              name: 'Chrome PDF Viewer',
              filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
              description: 'Portable Document Format',
              length: 1
            },
            {
              name: 'Native Client',
              filename: 'internal-nacl-plugin',
              description: 'Native Client',
              length: 2
            }
          ],
          configurable: true
        });

        // Override languages to match real user
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
          configurable: true
        });

        // Override language
        Object.defineProperty(navigator, 'language', {
          get: () => 'en-US',
          configurable: true
        });

        // Override permissions
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
          parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
        );

        // Override chrome object to match real Chrome
        if (!window.chrome) {
          window.chrome = {
            runtime: {},
            loadTimes: function() {
              return {
                commitLoadTime: Date.now() / 1000 - Math.random() * 100,
                finishDocumentLoadTime: Date.now() / 1000 - Math.random() * 100,
                finishLoadTime: Date.now() / 1000 - Math.random() * 100,
                firstPaintAfterLoadTime: 0,
                firstPaintTime: Date.now() / 1000 - Math.random() * 100,
                navigationType: 'Other',
                numTabs: Math.floor(Math.random() * 10) + 1,
                requestTime: Date.now() / 1000 - Math.random() * 100,
                startLoadTime: Date.now() / 1000 - Math.random() * 100,
                wasAlternateProtocolAvailable: false,
                wasFetchedViaSpdy: false,
                wasNpnNegotiated: false
              };
            },
            csi: function() {
              return {
                pageT: Date.now() / 1000 - Math.random() * 100,
                startE: Date.now() / 1000 - Math.random() * 100,
                tran: 15
              };
            }
          };
        }

        // Add realistic mouse movements
        let mouseX = Math.random() * window.innerWidth;
        let mouseY = Math.random() * window.innerHeight;
        
        setInterval(() => {
          mouseX += (Math.random() - 0.5) * 20;
          mouseY += (Math.random() - 0.5) * 20;
          
          // Keep mouse within viewport
          mouseX = Math.max(0, Math.min(window.innerWidth, mouseX));
          mouseY = Math.max(0, Math.min(window.innerHeight, mouseY));
          
          // Dispatch mouse move event
          document.dispatchEvent(new MouseEvent('mousemove', {
            clientX: mouseX,
            clientY: mouseY,
            bubbles: true
          }));
        }, 2000 + Math.random() * 3000);

        // Override console methods to prevent CDP detection
        const originalConsole = window.console;
        const handler = {
          get(target, propKey, receiver) {
            if (['debug', 'error', 'info', 'log', 'warn'].includes(propKey)) {
              return (...args) => {
                // Silently ignore to prevent CDP detection
                return undefined;
              };
            }
            return Reflect.get(target, propKey, receiver);
          }
        };
        
        // Apply proxy only if not already applied
        if (!window.console._isProxied) {
          window.console = new Proxy(originalConsole, handler);
          window.console._isProxied = true;
        }
      });

      Logger.info('Enhanced anti-detection measures applied successfully');
    } catch (error) {
      Logger.error('Failed to apply enhanced anti-detection measures', {
        error: error.message
      });
      // Don't throw error, continue with authentication
    }
  }

  async authenticate(pageId = 'auth-page') {
    try {
      Logger.info('🚀 Starting Loyverse authentication process');

      // Log detailed credentials information
      this.logCredentialsInfo();

      // Log authentication attempt
      Logger.info('🔍 Authentication attempt details:', {
        username: 'mostafasalehi796@gmail.com',
        hasPassword: true,
        passwordLength: 15,
        pageId: pageId
      });

      // Get or create page
      let page = this.browserService.getPage(pageId);
      if (!page) {
        page = await this.browserService.createPage(pageId);
      }

      // Apply enhanced anti-detection measures
      await this.applyEnhancedAntiDetection(page);

      // First, check if we're already authenticated (session persistence)
      const isAlreadyAuthenticated = await this.verifyAuthentication(page);
      if (isAlreadyAuthenticated) {
        this.isAuthenticated = true;
        Logger.info('✅ Already authenticated - session persisted, skipping login');
        return true;
      }

      Logger.info('🔒 Not authenticated - proceeding with login flow');
      
      // Navigate to login page
      await this.navigateToLogin(page);

      // Fill login form
      await this.fillLoginForm(page);

      // Submit form and wait for response
      const success = await this.submitLoginForm(page);

      if (success) {
        this.isAuthenticated = true;
        Logger.info('✅ Authentication successful - session will be persisted');
        return true;
      } else {
        this.isAuthenticated = false;
        Logger.error('❌ Authentication failed');
        return false;
      }
    } catch (error) {
      this.isAuthenticated = false;
      Logger.error('❌ Authentication error', { error: error.message });
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

      // Ensure page is ready for interaction
      await this.browserService.ensurePageReady(page);

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
  /**
   * Fill login form with credentials using human-like behavior
   * @param {Page} page - Puppeteer page instance
   * @returns {Promise<void>}
   */
  async fillLoginForm(page) {
    try {
      Logger.info(
        'Filling login form with credentials using human-like behavior'
      );

      // Log credentials for debugging
      Logger.info('🔐 Login credentials:', {
        username: 'mostafasalehi796@gmail.com',
        password: '***z.'
      });

      // Wait for email input to be visible with human-like delay
      await page.waitForSelector(SELECTORS.LOGIN.EMAIL_INPUT, {
        visible: true,
        timeout: config.timeouts.navigation
      });
      await this.humanLikeDelay(300, 600);

      // Fill email field with human-like typing
      Logger.info('📝 Filling username field:', { username: 'mostafasalehi796@gmail.com' });
      await this.humanLikeTyping(
        page,
        SELECTORS.LOGIN.EMAIL_INPUT,
        'mostafasalehi796@gmail.com'
      );

      // Wait for password input to be visible with human-like delay
      await page.waitForSelector(SELECTORS.LOGIN.PASSWORD_INPUT, {
        visible: true,
        timeout: config.timeouts.navigation
      });
      await this.humanLikeDelay(200, 400);

      // Fill password field with human-like typing
      Logger.info('🔑 Filling password field:', { 
        password: '***z.',
        passwordLength: 15
      });
      await this.humanLikeTyping(
        page,
        SELECTORS.LOGIN.PASSWORD_INPUT,
        '4q$qH5F2uWMVQz.'
      );

      // Optional: Check remember me checkbox with human-like behavior
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
            await this.humanLikeDelay(300, 500);
            await this.humanLikeClick(
              page,
              SELECTORS.LOGIN.REMEMBER_ME_CHECKBOX
            );
          }
        }
      } catch (checkboxError) {
        Logger.debug('Remember me checkbox not found or already checked');
      }

      Logger.info('✅ Login form filled successfully with human-like behavior');
    } catch (error) {
      Logger.error('❌ Failed to fill login form', { error: error.message });
      throw new Error(`Form filling failed: ${error.message}`);
    }
  }

  /**
   * Handle cookie consent dialog if present
   */
  async handleCookieConsent(page) {
    const cookieButtonSelector = '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll';
    try {
      const button = await page.$(cookieButtonSelector);
      if (button) {
        console.log('🍪 Cookie consent button found. Clicking to allow all cookies...');
        await button.click();
        // Wait for the dialog to disappear
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log('✅ Cookie consent accepted.');
      } else {
        console.log('🍪 No cookie consent dialog found.');
      }
    } catch (error) {
      console.log('⚠️  Error handling cookie consent:', error.message);
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

      // Handle cookie consent before login
      await this.handleCookieConsent(page);

      // Debug login button before clicking
      //await this.debugLoginButton(page);

      //Logger.info('Click on login Button');
      // Click login button with enhanced debugging
      //await this.clickLoginButtonWithDebug(page);
      await this.humanLikeClick(page, SELECTORS.LOGIN.LOGIN_BUTTON);

      Logger.info('Waiting for login success');

      // Check for CAPTCHA immediately after clicking login
      // const captchaDetected = await this.detectCaptcha(page);
      // if (captchaDetected) {
      //   Logger.warn(
      //     'CAPTCHA detected! Skipping manual solving wait.'
      //   );
      //   console.log(
      //     '\n🤖 CAPTCHA DETECTED! Skipping manual solving wait.\n'
      //   );
      //   // Removed manual wait for CAPTCHA solving
      // }

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
   * Detect if CAPTCHA is present on the page
   * @param {Page} page - Puppeteer page instance
   * @returns {Promise<boolean>} True if CAPTCHA is detected
   */
  // async detectCaptcha(page) {
  //   try {
  //     // Common CAPTCHA selectors
  //     const captchaSelectors = [
  //       '.g-recaptcha', // Google reCAPTCHA
  //       '#captcha', // Generic CAPTCHA
  //       '.captcha', // Generic CAPTCHA class
  //       'iframe[src*="recaptcha"]', // reCAPTCHA iframe
  //       'iframe[title*="recaptcha"]', // reCAPTCHA iframe with title
  //       '.recaptcha-checkbox', // reCAPTCHA checkbox
  //       '.h-captcha', // hCaptcha
  //       '.cf-turnstile', // Cloudflare Turnstile
  //       '[data-sitekey]' // Any element with data-sitekey (common for CAPTCHAs)
  //     ];

  //     for (const selector of captchaSelectors) {
  //       try {
  //         const element = await page.$(selector);
  //         if (element) {
  //           // Check if element is visible
  //           const isVisible = await page.evaluate(el => {
  //             const style = window.getComputedStyle(el); // eslint-disable-line no-undef
  //             return (
  //               style.display !== 'none' &&
  //               style.visibility !== 'hidden' &&
  //               style.opacity !== '0'
  //             );
  //           }, element);

  //           if (isVisible) {
  //             Logger.info(`CAPTCHA detected with selector: ${selector}`);
  //             return true;
  //           }
  //         }
  //       } catch (selectorError) {
  //         // Continue checking other selectors
  //         Logger.debug(`CAPTCHA selector not found: ${selector}`);
  //       }
  //     }

  //     // Additional check for reCAPTCHA iframe content
  //     try {
  //       const frames = await page.frames();
  //       for (const frame of frames) {
  //         const frameUrl = frame.url();
  //         if (frameUrl.includes('recaptcha') || frameUrl.includes('captcha')) {
  //           Logger.info(`CAPTCHA detected in iframe: ${frameUrl}`);
  //           return true;
  //         }
  //       }
  //     } catch (frameError) {
  //       Logger.debug('Error checking frames for CAPTCHA', {
  //         error: frameError.message
  //       });
  //     }

  //     return false;
  //   } catch (error) {
  //     Logger.error('Error detecting CAPTCHA', { error: error.message });
  //     return false;
  //   }
  // }

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
   * Verify current authentication status by navigating to main site first
   * @param {Page} page - Puppeteer page instance
   * @returns {Promise<boolean>} True if authenticated
   */
  async verifyAuthentication(page) {
    try {
      Logger.info('🔍 Checking existing session by navigating to main site');
      
      // First, navigate to the main Loyverse URL
      await page.goto('https://r.loyverse.com/', {
        waitUntil: 'networkidle2',
        timeout: config.timeouts.navigation
      });

      // Wait a moment for any redirects to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      const currentUrl = page.url();
      Logger.info('🌐 After navigation, current URL:', { url: currentUrl });

      // If we get redirected to login page, we're not authenticated
      if (currentUrl.includes('/login') || currentUrl.includes('loyverse.com/en/login')) {
        this.isAuthenticated = false;
        Logger.info('🔒 Session expired - redirected to login page');
        return false;
      }

      // If we stay on r.loyverse.com (dashboard), we're authenticated
      if (currentUrl.includes('r.loyverse.com')) {
        this.isAuthenticated = true;
        Logger.info('✅ Session valid - already authenticated on dashboard');
        return true;
      }

      // Additional check for dashboard elements as fallback
      try {
        await page.waitForSelector(SELECTORS.DASHBOARD.INDICATOR, {
          visible: true,
          timeout: 5000
        });
        this.isAuthenticated = true;
        Logger.info('✅ Session valid - dashboard elements found');
        return true;
      } catch (dashboardError) {
        this.isAuthenticated = false;
        Logger.warn('🔒 Session verification failed - no dashboard elements found');
        return false;
      }
    } catch (error) {
      this.isAuthenticated = false;
      Logger.error('❌ Session verification error', {
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

      // Apply enhanced anti-detection measures
      await this.applyEnhancedAntiDetection(page);

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
   * Log credentials information for debugging
   * @returns {void}
   */
  logCredentialsInfo() {
    Logger.info('🔐 Credentials Information:', {
      username: 'mostafasalehi796@gmail.com',
      usernameLength: 25,
      hasPassword: true,
      passwordLength: 15,
      passwordPreview: '***z.',
      isAuthenticated: this.isAuthenticated
    });
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
   * Debug login button state and properties
   * @param {Page} page - Puppeteer page instance
   * @returns {Promise<void>}
   */
  async debugLoginButton(page) {
    try {
      Logger.info('🔍 Debugging login button state...');
      
      const selector = SELECTORS.LOGIN.LOGIN_BUTTON;
      const button = await page.$(selector);
      
      if (button) {
        const buttonInfo = await page.evaluate(btn => ({
          text: btn.textContent?.trim(),
          type: btn.type,
          disabled: btn.disabled,
          className: btn.className,
          id: btn.id,
          offsetWidth: btn.offsetWidth,
          offsetHeight: btn.offsetHeight,
          style: btn.style.cssText
        }), button);
        
        const boundingBox = await button.boundingBox();
        const isVisible = await button.isIntersectingViewport();
        
        Logger.info('🔘 Login button details:', {
          found: true,
          visible: isVisible,
          position: boundingBox,
          properties: buttonInfo
        });
        
        // Check if button is covered
        if (boundingBox) {
          const centerX = boundingBox.x + boundingBox.width / 2;
          const centerY = boundingBox.y + boundingBox.height / 2;
          
          const elementAtCenter = await page.evaluate((x, y) => {
            const el = document.elementFromPoint(x, y);
            return el ? {
              tagName: el.tagName,
              className: el.className,
              id: el.id
            } : null;
          }, centerX, centerY);
          
          Logger.info('🎯 Element at button center:', elementAtCenter);
        }
        
      } else {
        Logger.error('❌ Login button not found with selector:', selector);
        
        // Find all buttons on page for debugging
        const allButtons = await page.$$eval('button', buttons => 
          buttons.map(btn => ({
            text: btn.textContent?.trim(),
            type: btn.type,
            className: btn.className,
            id: btn.id
          }))
        );
        
        Logger.info('🔘 All buttons on page:', allButtons);
      }
      
    } catch (error) {
      Logger.error('Login button debug failed:', error.message);
    }
  }

  /**
   * Click login button with enhanced debugging and multiple methods
   * @param {Page} page - Puppeteer page instance
   * @returns {Promise<void>}
   */
  async clickLoginButtonWithDebug(page) {
    try {
      const selector = SELECTORS.LOGIN.LOGIN_BUTTON;
      const button = await page.$(selector);
      
      if (!button) {
        throw new Error('Login button not found');
      }
      
      // Method 1: Enhanced VNC-compatible click with focus
      Logger.info('🔘 Attempting Method 1: Enhanced VNC click');
      try {
        // Ensure button is in viewport
        await button.scrollIntoView();
        await page.waitForTimeout(500);
        
        // Focus on the button first
        await page.evaluate((sel) => {
          const btn = document.querySelector(sel);
          if (btn) {
            btn.focus();
            btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, selector);
        
        await page.waitForTimeout(500);
        
        // Get button position and click with coordinates
        const box = await button.boundingBox();
        if (box) {
          const x = box.x + box.width / 2;
          const y = box.y + box.height / 2;
          
          Logger.info('🖱️ Clicking at coordinates:', { x, y });
          
          // Move mouse to button and click
          await page.mouse.move(x, y);
          await page.waitForTimeout(200);
          await page.mouse.click(x, y);
          await page.waitForTimeout(1000);
          
          // Check for response
          const urlChanged = page.url() !== 'https://loyverse.com/en/login';
          const hasError = await page.$(SELECTORS.LOGIN.ERROR_MESSAGE);
          
          Logger.info('🔘 Method 1 result:', { urlChanged, hasError: !!hasError });
          
          if (urlChanged || hasError) {
            Logger.info('✅ Method 1 successful - got response');
            return;
          }
        }
      } catch (error) {
        Logger.warn('🔘 Method 1 failed:', error.message);
      }
      
      // Method 2: Direct element click
      Logger.info('🔘 Attempting Method 2: Direct click');
      try {
        await button.click();
        await page.waitForTimeout(1000);
        
        const urlChanged = page.url() !== 'https://loyverse.com/en/login';
        const hasError = await page.$(SELECTORS.LOGIN.ERROR_MESSAGE);
        
        Logger.info('🔘 Method 2 result:', { urlChanged, hasError: !!hasError });
        
        if (urlChanged || hasError) {
          Logger.info('✅ Method 2 successful - got response');
          return;
        }
      } catch (error) {
        Logger.warn('🔘 Method 2 failed:', error.message);
      }
      
      // Method 3: Try JavaScript click
      Logger.info('🔘 Attempting Method 3: JavaScript click');
      try {
        await page.evaluate(btn => btn.click(), button);
        await page.waitForTimeout(1000);
        
        const urlChanged = page.url() !== 'https://loyverse.com/en/login';
        const hasError = await page.$(SELECTORS.LOGIN.ERROR_MESSAGE);
        
        Logger.info('🔘 Method 3 result:', { urlChanged, hasError: !!hasError });
        
        if (urlChanged || hasError) {
          Logger.info('✅ Method 3 successful - got response');
          return;
        }
      } catch (error) {
        Logger.warn('🔘 Method 3 failed:', error.message);
      }
      
      // Method 4: Try form submission
      Logger.info('🔘 Attempting Method 4: Form submission');
      try {
        await page.evaluate(() => {
          const form = document.querySelector('form[name="loginForm"]');
          if (form) {
            form.submit();
          }
        });
        await page.waitForTimeout(1000);
        
        const urlChanged = page.url() !== 'https://loyverse.com/en/login';
        const hasError = await page.$(SELECTORS.LOGIN.ERROR_MESSAGE);
        
        Logger.info('🔘 Method 4 result:', { urlChanged, hasError: !!hasError });
        
        if (urlChanged || hasError) {
          Logger.info('✅ Method 4 successful - got response');
          return;
        }
      } catch (error) {
        Logger.warn('🔘 Method 4 failed:', error.message);
      }
      
      Logger.error('❌ All click methods failed');
      
    } catch (error) {
      Logger.error('Enhanced login button click failed:', error.message);
      throw error;
    }
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
