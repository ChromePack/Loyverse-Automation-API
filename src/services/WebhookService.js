const fetch = require('node-fetch');
const { URL } = require('url');
const { Logger } = require('../utils/logger');
const config = require('../config');

/**
 * WebhookService - Handles webhook notifications with retry logic and error handling
 */
class WebhookService {
  constructor() {
    this.config = config.webhook;
  }

  /**
   * Sends a webhook notification with retry logic
   * @param {Object} payload - The payload to send
   * @param {string} jobId - The job ID for logging
   * @returns {Promise<boolean>} - Whether the webhook was successful
   */
  async sendWebhook(payload, jobId) {
    if (!this.config.enabled || !this.config.url) {
      Logger.info('Webhook disabled or URL not configured', { jobId });
      return false;
    }

    Logger.info('Sending webhook notification', { 
      jobId, 
      webhookUrl: this.config.url,
      payload: { success: payload.success, status: payload.status }
    });

    let attempt = 0;
    let lastError = null;

    while (attempt < this.config.maxRetries) {
      attempt++;
      let timeoutId = null;
      
      try {
        // Use setTimeout for timeout instead of AbortController for better compatibility
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error(`Timeout after ${this.config.timeout}ms`));
          }, this.config.timeout);
        });

        const fetchPromise = fetch(this.config.url, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'User-Agent': 'Loyverse-Automation-API/1.0.0'
          },
          body: JSON.stringify(payload)
        });

        const response = await Promise.race([fetchPromise, timeoutPromise]);
        clearTimeout(timeoutId);

        if (response.ok) {
          Logger.info(`Webhook POST succeeded on attempt ${attempt}`, { 
            jobId, 
            webhookUrl: this.config.url,
            statusCode: response.status 
          });
          return true;
        } else {
          const errorText = await response.text().catch(() => 'Unable to read response body');
          Logger.error(`Webhook POST failed with status ${response.status} on attempt ${attempt}`, { 
            jobId, 
            webhookUrl: this.config.url,
            statusCode: response.status,
            responseText: errorText
          });
          lastError = new Error(`HTTP ${response.status}: ${errorText}`);
        }
      } catch (err) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        Logger.error(`Webhook POST error on attempt ${attempt}: ${err.message}`, { 
          jobId, 
          webhookUrl: this.config.url,
          errorType: err.name,
          errorCode: err.code
        });
        lastError = err;
      }

      // Wait before retry (except on last attempt)
      if (attempt < this.config.maxRetries) {
        Logger.info(`Waiting ${this.config.retryDelay}ms before retry ${attempt + 1}`, { jobId });
        await this.sleep(this.config.retryDelay);
      }
    }

    Logger.error(`Webhook POST failed after ${this.config.maxRetries} attempts`, { 
      jobId, 
      webhookUrl: this.config.url,
      lastError: lastError?.message 
    });

    return false;
  }

  /**
   * Sleep utility function
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validates webhook configuration
   * @returns {Object} - Validation result
   */
  validateConfig() {
    const issues = [];
    
    if (!this.config.enabled) {
      issues.push('Webhook is disabled');
    }
    
    if (!this.config.url) {
      issues.push('Webhook URL is not configured');
    } else {
      try {
        new URL(this.config.url);
      } catch (err) {
        issues.push('Webhook URL is invalid');
      }
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }
}

module.exports = { WebhookService }; 