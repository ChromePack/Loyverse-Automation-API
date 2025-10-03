const { Solver } = require('2captcha');
const Config = require('../config');
const { Logger } = require('../utils/Logger');

/**
 * Service for handling CAPTCHA solving using 2captcha
 */
class CaptchaService {
  constructor() {
    this.solver = new Solver(Config.captcha.apiKey);
    this.isEnabled = !!Config.captcha.apiKey;
  }

  /**
   * Solve reCAPTCHA v2
   * @param {Page} page - Puppeteer page instance
   * @param {string} siteKey - Site key for reCAPTCHA
   * @returns {Promise<string|null>} CAPTCHA solution token or null if failed
   */
  async solveRecaptchaV2(page, siteKey) {
    if (!this.isEnabled) {
      Logger.warn('2captcha service is not enabled - no API key provided');
      return null;
    }

    try {
      const pageUrl = page.url();
      Logger.info('Solving reCAPTCHA v2', { siteKey, pageUrl });

      const result = await this.solver.recaptcha({
        googlekey: siteKey,
        pageurl: pageUrl,
        pollingInterval: Config.captcha.pollingInterval,
        retries: Config.captcha.maxRetries
      });

      Logger.info('reCAPTCHA v2 solved successfully', {
        captchaId: result.id,
        pageUrl
      });

      return result.data;
    } catch (error) {
      Logger.error('Failed to solve reCAPTCHA v2', {
        error: error.message,
        siteKey,
        pageUrl: page.url()
      });
      return null;
    }
  }

  /**
   * Solve reCAPTCHA v3
   * @param {Page} page - Puppeteer page instance
   * @param {string} siteKey - Site key for reCAPTCHA
   * @param {string} action - reCAPTCHA action
   * @param {number} minScore - Minimum score (optional)
   * @returns {Promise<string|null>} CAPTCHA solution token or null if failed
   */
  async solveRecaptchaV3(page, siteKey, action = 'submit', minScore = 0.3) {
    if (!this.isEnabled) {
      Logger.warn('2captcha service is not enabled - no API key provided');
      return null;
    }

    try {
      const pageUrl = page.url();
      Logger.info('Solving reCAPTCHA v3', { siteKey, action, minScore, pageUrl });

      const result = await this.solver.recaptcha({
        googlekey: siteKey,
        pageurl: pageUrl,
        version: 'v3',
        action,
        min_score: minScore,
        pollingInterval: Config.captcha.pollingInterval,
        retries: Config.captcha.maxRetries
      });

      Logger.info('reCAPTCHA v3 solved successfully', {
        captchaId: result.id,
        pageUrl
      });

      return result.data;
    } catch (error) {
      Logger.error('Failed to solve reCAPTCHA v3', {
        error: error.message,
        siteKey,
        action,
        pageUrl: page.url()
      });
      return null;
    }
  }

  /**
   * Solve hCaptcha
   * @param {Page} page - Puppeteer page instance
   * @param {string} siteKey - Site key for hCaptcha
   * @returns {Promise<string|null>} CAPTCHA solution token or null if failed
   */
  async solveHCaptcha(page, siteKey) {
    if (!this.isEnabled) {
      Logger.warn('2captcha service is not enabled - no API key provided');
      return null;
    }

    try {
      const pageUrl = page.url();
      Logger.info('Solving hCaptcha', { siteKey, pageUrl });

      const result = await this.solver.hcaptcha({
        sitekey: siteKey,
        pageurl: pageUrl,
        pollingInterval: Config.captcha.pollingInterval,
        retries: Config.captcha.maxRetries
      });

      Logger.info('hCaptcha solved successfully', {
        captchaId: result.id,
        pageUrl
      });

      return result.data;
    } catch (error) {
      Logger.error('Failed to solve hCaptcha', {
        error: error.message,
        siteKey,
        pageUrl: page.url()
      });
      return null;
    }
  }

  /**
   * Auto-detect and solve CAPTCHA on current page
   * @param {Page} page - Puppeteer page instance
   * @returns {Promise<boolean>} True if CAPTCHA was detected and solved
   */
  async autoSolve(page) {
    if (!this.isEnabled) {
      Logger.warn('2captcha service is not enabled - no API key provided');
      return false;
    }

    try {
      // Check for reCAPTCHA v2
      const recaptchaV2 = await page.evaluate(() => {
        const iframe = document.querySelector('iframe[src*="recaptcha"]');
        if (iframe) {
          const container = iframe.closest('[data-sitekey]');
          return container ? container.getAttribute('data-sitekey') : null;
        }
        return null;
      });

      if (recaptchaV2) {
        Logger.info('Detected reCAPTCHA v2', { siteKey: recaptchaV2 });
        const token = await this.solveRecaptchaV2(page, recaptchaV2);
        if (token) {
          await this.injectRecaptchaToken(page, token);
          return true;
        }
      }

      // Check for reCAPTCHA v3
      const recaptchaV3 = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script'));
        for (const script of scripts) {
          if (script.src && script.src.includes('recaptcha') && script.src.includes('render=')) {
            const match = script.src.match(/render=([^&]+)/);
            return match ? match[1] : null;
          }
        }
        return null;
      });

      if (recaptchaV3) {
        Logger.info('Detected reCAPTCHA v3', { siteKey: recaptchaV3 });
        const token = await this.solveRecaptchaV3(page, recaptchaV3);
        if (token) {
          await this.injectRecaptchaToken(page, token);
          return true;
        }
      }

      // Check for hCaptcha
      const hcaptcha = await page.evaluate(() => {
        const container = document.querySelector('[data-sitekey][data-hcaptcha-widget-id]');
        return container ? container.getAttribute('data-sitekey') : null;
      });

      if (hcaptcha) {
        Logger.info('Detected hCaptcha', { siteKey: hcaptcha });
        const token = await this.solveHCaptcha(page, hcaptcha);
        if (token) {
          await this.injectHCaptchaToken(page, token);
          return true;
        }
      }

      return false;
    } catch (error) {
      Logger.error('Error in auto-solve CAPTCHA', {
        error: error.message,
        pageUrl: page.url()
      });
      return false;
    }
  }

  /**
   * Inject reCAPTCHA token into the page
   * @param {Page} page - Puppeteer page instance
   * @param {string} token - CAPTCHA solution token
   */
  async injectRecaptchaToken(page, token) {
    await page.evaluate((token) => {
      const textarea = document.querySelector('textarea[name="g-recaptcha-response"]');
      if (textarea) {
        textarea.value = token;
        const event = document.createEvent('Event');
        event.initEvent('input', true, true);
        textarea.dispatchEvent(event);
      }

      // Trigger callback if available
      if (window.grecaptcha && window.grecaptcha.getResponse) {
        try {
          const widgetId = 0; // Default widget ID
          if (window.grecaptcha.execute) {
            window.grecaptcha.execute(widgetId);
          }
        } catch (e) {
          // Could not execute grecaptcha callback
        }
      }
    }, token);
  }

  /**
   * Inject hCaptcha token into the page
   * @param {Page} page - Puppeteer page instance
   * @param {string} token - CAPTCHA solution token
   */
  async injectHCaptchaToken(page, token) {
    await page.evaluate((token) => {
      const textarea = document.querySelector('textarea[name="h-captcha-response"]');
      if (textarea) {
        textarea.value = token;
        const event = document.createEvent('Event');
        event.initEvent('input', true, true);
        textarea.dispatchEvent(event);
      }

      // Trigger callback if available
      if (window.hcaptcha && window.hcaptcha.getResponse) {
        try {
          const widgetId = Object.keys(window.hcaptcha.getWidgets())[0];
          if (widgetId && window.hcaptcha.execute) {
            window.hcaptcha.execute(widgetId);
          }
        } catch (e) {
          // Could not execute hcaptcha callback
        }
      }
    }, token);
  }

  /**
   * Get account balance from 2captcha
   * @returns {Promise<number|null>} Account balance or null if failed
   */
  async getBalance() {
    if (!this.isEnabled) {
      return null;
    }

    try {
      const balance = await this.solver.balance();
      Logger.info('2captcha account balance', { balance });
      return balance;
    } catch (error) {
      Logger.error('Failed to get 2captcha balance', {
        error: error.message
      });
      return null;
    }
  }
}

module.exports = CaptchaService;