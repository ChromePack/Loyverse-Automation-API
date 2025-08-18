/**
 * 🔍 Login Debug Tool
 * This script provides detailed debugging for the login process
 */

const BrowserService = require('./src/services/BrowserService');
const AuthService = require('./src/services/AuthService');
const { SELECTORS } = require('./src/constants');
const { Logger } = require('./src/utils/logger');

class LoginDebugger {
  constructor() {
    this.browserService = new BrowserService();
    this.authService = new AuthService(this.browserService);
    this.page = null;
  }

  async initialize() {
    Logger.info('🔍 Initializing login debugger...');
    await this.browserService.launch();
    this.page = await this.browserService.createPage('debug');
    
    // Apply anti-detection measures
    await this.authService.applyEnhancedAntiDetection(this.page);
    
    return this.page;
  }

  async debugLoginProcess() {
    try {
      Logger.info('🚀 Starting comprehensive login debug...');

      // Navigate to login page
      await this.navigateToLogin();
      
      // Debug page state before filling form
      await this.debugPageState('Before filling form');
      
      // Fill form
      await this.debugFillForm();
      
      // Debug page state after filling form
      await this.debugPageState('After filling form');
      
      // Debug cookie consent
      await this.debugCookieConsent();
      
      // Debug page state after cookie consent
      await this.debugPageState('After cookie consent');
      
      // Debug login button
      await this.debugLoginButton();
      
      // Attempt login with detailed monitoring
      await this.attemptLoginWithMonitoring();
      
    } catch (error) {
      Logger.error('Debug process failed:', error);
      throw error;
    }
  }

  async navigateToLogin() {
    Logger.info('📍 Navigating to login page...');
    await this.page.goto('https://loyverse.com/en/login', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for form to load
    await this.page.waitForSelector(SELECTORS.LOGIN.LOGIN_FORM, {
      visible: true,
      timeout: 10000
    });
    
    Logger.info('✅ Login page loaded');
  }

  async debugPageState(stage) {
    Logger.info(`\n🔍 === PAGE STATE DEBUG: ${stage} ===`);
    
    // Current URL
    const url = this.page.url();
    Logger.info(`📍 Current URL: ${url}`);
    
    // Page title
    const title = await this.page.title();
    Logger.info(`📝 Page title: ${title}`);
    
    // Check for login form elements
    await this.checkElement(SELECTORS.LOGIN.EMAIL_INPUT, 'Email Input');
    await this.checkElement(SELECTORS.LOGIN.PASSWORD_INPUT, 'Password Input');
    await this.checkElement(SELECTORS.LOGIN.LOGIN_BUTTON, 'Login Button');
    await this.checkElement(SELECTORS.LOGIN.REMEMBER_ME_CHECKBOX, 'Remember Me Checkbox');
    
    // Check for cookie consent
    await this.checkElement('#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll', 'Cookie Consent Button');
    
    // Check for any error messages
    await this.checkElement(SELECTORS.LOGIN.ERROR_MESSAGE, 'Error Messages');
    
    // Check for loading indicators
    await this.checkElement(SELECTORS.LOGIN.LOADING_INDICATOR, 'Loading Indicators');
    
    // Check form validity
    const formValid = await this.page.evaluate(() => {
      const form = document.querySelector('form[name="loginForm"]');
      if (form) {
        return {
          checkValidity: form.checkValidity(),
          action: form.action,
          method: form.method
        };
      }
      return null;
    });
    Logger.info(`📋 Form validity: ${JSON.stringify(formValid)}`);
    
    Logger.info(`=== END PAGE STATE: ${stage} ===\n`);
  }

  async checkElement(selector, name) {
    try {
      const element = await this.page.$(selector);
      if (element) {
        const isVisible = await element.isIntersectingViewport();
        const isEnabled = await this.page.evaluate(el => !el.disabled, element);
        const rect = await element.boundingBox();
        
        Logger.info(`✅ ${name}: Found, visible=${isVisible}, enabled=${isEnabled}, position=${JSON.stringify(rect)}`);
        
        // Get element details
        const details = await this.page.evaluate(el => ({
          tagName: el.tagName,
          type: el.type,
          className: el.className,
          id: el.id,
          disabled: el.disabled,
          style: el.style.cssText,
          innerHTML: el.innerHTML.substring(0, 100)
        }), element);
        
        Logger.info(`📝 ${name} details: ${JSON.stringify(details)}`);
      } else {
        Logger.warn(`❌ ${name}: Not found with selector "${selector}"`);
      }
    } catch (error) {
      Logger.error(`❌ ${name} check failed:`, error.message);
    }
  }

  async debugFillForm() {
    Logger.info('📝 Debugging form filling...');
    
    // Fill email
    Logger.info('🔤 Filling email field...');
    await this.page.waitForSelector(SELECTORS.LOGIN.EMAIL_INPUT, { visible: true });
    await this.page.click(SELECTORS.LOGIN.EMAIL_INPUT);
    await this.page.keyboard.down('Control');
    await this.page.keyboard.press('KeyA');
    await this.page.keyboard.up('Control');
    await this.page.type(SELECTORS.LOGIN.EMAIL_INPUT, 'mostafasalehi796@gmail.com');
    
    // Verify email was filled
    const emailValue = await this.page.$eval(SELECTORS.LOGIN.EMAIL_INPUT, el => el.value);
    Logger.info(`✅ Email filled: "${emailValue}"`);
    
    // Small delay
    await (this.page.waitForTimeout ? this.page.waitForTimeout(500) : new Promise(resolve => setTimeout(resolve, 500)));
    
    // Fill password
    Logger.info('🔑 Filling password field...');
    await this.page.click(SELECTORS.LOGIN.PASSWORD_INPUT);
    await this.page.keyboard.down('Control');
    await this.page.keyboard.press('KeyA');
    await this.page.keyboard.up('Control');
    await this.page.type(SELECTORS.LOGIN.PASSWORD_INPUT, '4q$qH5F2uWMVQz.');
    
    // Verify password was filled (without logging the actual password)
    const passwordValue = await this.page.$eval(SELECTORS.LOGIN.PASSWORD_INPUT, el => el.value);
    Logger.info(`✅ Password filled: ${passwordValue.length} characters`);
    
    // Check remember me checkbox if it exists
    try {
      const rememberMe = await this.page.$(SELECTORS.LOGIN.REMEMBER_ME_CHECKBOX);
      if (rememberMe) {
        const isChecked = await this.page.evaluate(el => el.checked, rememberMe);
        if (!isChecked) {
          await this.page.click(SELECTORS.LOGIN.REMEMBER_ME_CHECKBOX);
          Logger.info('✅ Remember me checkbox checked');
        }
      }
    } catch (error) {
      Logger.debug('Remember me checkbox not found or not clickable');
    }
  }

  async debugCookieConsent() {
    Logger.info('🍪 Debugging cookie consent...');
    
    const cookieSelector = '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll';
    
    try {
      const cookieButton = await this.page.$(cookieSelector);
      if (cookieButton) {
        const isVisible = await cookieButton.isIntersectingViewport();
        Logger.info(`🍪 Cookie consent button found, visible: ${isVisible}`);
        
        if (isVisible) {
          Logger.info('🍪 Clicking cookie consent button...');
          await cookieButton.click();
          await this.page.waitForTimeout ? this.page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000));
          Logger.info('✅ Cookie consent button clicked');
          
          // Verify it's gone
          const stillVisible = await this.page.$(cookieSelector);
          Logger.info(`🍪 Cookie button still present: ${!!stillVisible}`);
        }
      } else {
        Logger.info('🍪 No cookie consent button found');
      }
    } catch (error) {
      Logger.error('🍪 Cookie consent error:', error.message);
    }
  }

  async debugLoginButton() {
    Logger.info('\n🔘 === LOGIN BUTTON DETAILED DEBUG ===');
    
    const selector = SELECTORS.LOGIN.LOGIN_BUTTON;
    
    // Find all potential login buttons
    const allButtons = await this.page.$$('button');
    Logger.info(`🔘 Total buttons on page: ${allButtons.length}`);
    
    for (let i = 0; i < allButtons.length; i++) {
      const button = allButtons[i];
      const buttonInfo = await this.page.evaluate(btn => ({
        text: btn.textContent?.trim(),
        type: btn.type,
        className: btn.className,
        id: btn.id,
        disabled: btn.disabled,
        form: btn.form?.name,
        onclick: btn.onclick?.toString(),
        attributes: Array.from(btn.attributes).map(attr => `${attr.name}="${attr.value}"`).join(' ')
      }), button);
      
      Logger.info(`🔘 Button ${i}: ${JSON.stringify(buttonInfo)}`);
    }
    
    // Check the specific login button selector
    const loginButton = await this.page.$(selector);
    if (loginButton) {
      const buttonRect = await loginButton.boundingBox();
      const isVisible = await loginButton.isIntersectingViewport();
      const isEnabled = await this.page.evaluate(btn => !btn.disabled, loginButton);
      
      Logger.info(`🔘 Login button found: visible=${isVisible}, enabled=${isEnabled}`);
      Logger.info(`🔘 Login button position: ${JSON.stringify(buttonRect)}`);
      
      // Check if button is covered by other elements
      const elementAtPoint = await this.page.evaluate((x, y) => {
        const element = document.elementFromPoint(x, y);
        return {
          tagName: element?.tagName,
          className: element?.className,
          id: element?.id
        };
      }, buttonRect.x + buttonRect.width/2, buttonRect.y + buttonRect.height/2);
      
      Logger.info(`🔘 Element at button center: ${JSON.stringify(elementAtPoint)}`);
      
    } else {
      Logger.error('❌ Login button not found with selector:', selector);
      
      // Try alternative selectors
      const alternatives = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:contains("Login")',
        'button:contains("Sign in")',
        '.login-button',
        '#login-button',
        '[data-test="login-button"]'
      ];
      
      for (const altSelector of alternatives) {
        const altButton = await this.page.$(altSelector);
        if (altButton) {
          Logger.info(`✅ Alternative login button found: ${altSelector}`);
          const altInfo = await this.page.evaluate(btn => btn.textContent?.trim(), altButton);
          Logger.info(`🔘 Alternative button text: "${altInfo}"`);
        }
      }
    }
    
    Logger.info('=== END LOGIN BUTTON DEBUG ===\n');
  }

  async attemptLoginWithMonitoring() {
    Logger.info('🚀 Attempting login with detailed monitoring...');
    
    // Set up network monitoring
    const responses = [];
    this.page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        headers: response.headers(),
        timestamp: new Date().toISOString()
      });
    });
    
    // Set up console monitoring
    this.page.on('console', msg => {
      Logger.info(`🖥️  Console ${msg.type()}: ${msg.text()}`);
    });
    
    // Set up error monitoring
    this.page.on('pageerror', error => {
      Logger.error('📄 Page error:', error.message);
    });
    
    try {
      // Click login button
      Logger.info('🔘 Clicking login button...');
      const loginButton = await this.page.$(SELECTORS.LOGIN.LOGIN_BUTTON);
      
      if (loginButton) {
        // Try multiple click methods
        Logger.info('🔘 Method 1: Regular click');
        await loginButton.click();
        await (this.page.waitForTimeout ? this.page.waitForTimeout(1000) : new Promise(resolve => setTimeout(resolve, 1000)));
        
        // Check for immediate changes
        await this.checkForChanges();
        
        // Try force click if needed
        Logger.info('🔘 Method 2: Force click with coordinates');
        const rect = await loginButton.boundingBox();
        await this.page.mouse.click(rect.x + rect.width/2, rect.y + rect.height/2);
        await (this.page.waitForTimeout ? this.page.waitForTimeout(1000) : new Promise(resolve => setTimeout(resolve, 1000)));
        
        // Check for changes again
        await this.checkForChanges();
        
        // Try JavaScript click
        Logger.info('🔘 Method 3: JavaScript click');
        await this.page.evaluate(btn => btn.click(), loginButton);
        await (this.page.waitForTimeout ? this.page.waitForTimeout(1000) : new Promise(resolve => setTimeout(resolve, 1000)));
        
        // Final check
        await this.checkForChanges();
        
      } else {
        Logger.error('❌ Login button not found for clicking');
      }
      
      // Wait for potential navigation or response
      Logger.info('⏳ Waiting for response...');
      
      try {
        await Promise.race([
          this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }),
          this.page.waitForSelector(SELECTORS.DASHBOARD.INDICATOR, { timeout: 10000 }),
          this.page.waitForSelector(SELECTORS.LOGIN.ERROR_MESSAGE, { timeout: 10000 }),
          this.page.waitForTimeout(10000)
        ]);
      } catch (waitError) {
        Logger.warn('⏰ Wait timeout reached');
      }
      
      // Analyze responses
      Logger.info('\n📡 === NETWORK RESPONSES ===');
      responses.forEach((response, index) => {
        Logger.info(`📡 Response ${index}: ${response.status} ${response.url}`);
      });
      
      // Final page state
      await this.debugPageState('After login attempt');
      
    } catch (error) {
      Logger.error('🚀 Login attempt failed:', error);
    }
  }

  async checkForChanges() {
    const url = this.page.url();
    const title = await this.page.title();
    const errorElement = await this.page.$(SELECTORS.LOGIN.ERROR_MESSAGE);
    const dashboardElement = await this.page.$(SELECTORS.DASHBOARD.INDICATOR);
    
    Logger.info(`🔍 Quick check - URL: ${url}, Title: ${title}, Error: ${!!errorElement}, Dashboard: ${!!dashboardElement}`);
  }

  async takeDebugScreenshot(name) {
    try {
      const screenshotPath = `./logs/debug-${name}-${Date.now()}.png`;
      await this.page.screenshot({ 
        path: screenshotPath, 
        fullPage: true 
      });
      Logger.info(`📸 Screenshot saved: ${screenshotPath}`);
    } catch (error) {
      Logger.error('📸 Screenshot failed:', error.message);
    }
  }

  async cleanup() {
    Logger.info('🧹 Cleaning up debugger...');
    if (this.browserService) {
      await this.browserService.close();
    }
  }
}

// Main execution
async function runLoginDebug() {
  const loginDebugger = new LoginDebugger();
  
  try {
    await loginDebugger.initialize();
    await loginDebugger.debugLoginProcess();
  } catch (error) {
    Logger.error('Debug failed:', error);
  } finally {
    await loginDebugger.cleanup();
  }
}

// Run if called directly
if (require.main === module) {
  runLoginDebug().catch(console.error);
}

module.exports = LoginDebugger;