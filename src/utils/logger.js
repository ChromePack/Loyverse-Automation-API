const { LOG_LEVELS } = require('../constants');
const config = require('../config');

/**
 * Logger utility class
 * Provides structured logging with different levels and formatting
 */
class Logger {
  /**
   * Logs an error message
   * @param {string} message - Error message
   * @param {Error|Object} error - Error object or additional data
   * @param {string} requestId - Request ID for tracking
   */
  static error(message, error = null, requestId = null) {
    const logEntry = this.createLogEntry(
      LOG_LEVELS.ERROR,
      message,
      error,
      requestId
    );
    console.error(this.formatLogEntry(logEntry));
  }

  /**
   * Logs a warning message
   * @param {string} message - Warning message
   * @param {Object} data - Additional data
   * @param {string} requestId - Request ID for tracking
   */
  static warn(message, data = null, requestId = null) {
    const logEntry = this.createLogEntry(
      LOG_LEVELS.WARN,
      message,
      data,
      requestId
    );
    console.warn(this.formatLogEntry(logEntry));
  }

  /**
   * Logs an info message
   * @param {string} message - Info message
   * @param {Object} data - Additional data
   * @param {string} requestId - Request ID for tracking
   */
  static info(message, data = null, requestId = null) {
    const logEntry = this.createLogEntry(
      LOG_LEVELS.INFO,
      message,
      data,
      requestId
    );
    console.log(this.formatLogEntry(logEntry));
  }

  /**
   * Logs a debug message (only in development)
   * @param {string} message - Debug message
   * @param {Object} data - Additional data
   * @param {string} requestId - Request ID for tracking
   */
  static debug(message, data = null, requestId = null) {
    if (config.server.isDevelopment) {
      const logEntry = this.createLogEntry(
        LOG_LEVELS.DEBUG,
        message,
        data,
        requestId
      );
      console.debug(this.formatLogEntry(logEntry));
    }
  }

  /**
   * Logs HTTP request information
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {number} statusCode - Response status code
   * @param {number} responseTime - Response time in milliseconds
   * @param {string} requestId - Request ID for tracking
   */
  static httpRequest(method, url, statusCode, responseTime, requestId) {
    const message = `${method} ${url} ${statusCode} ${responseTime}ms`;
    const data = {
      method,
      url,
      statusCode,
      responseTime,
      type: 'http_request'
    };
    this.info(message, data, requestId);
  }

  /**
   * Logs application startup information
   * @param {number} port - Server port
   * @param {string} environment - Environment name
   */
  static startup(port, environment) {
    const message = `Server started on port ${port} in ${environment} mode`;
    const data = {
      port,
      environment,
      type: 'startup'
    };
    this.info(message, data);
  }

  /**
   * Logs application shutdown information
   * @param {string} signal - Shutdown signal
   */
  static shutdown(signal) {
    const message = `Server shutting down (${signal})`;
    const data = {
      signal,
      type: 'shutdown'
    };
    this.info(message, data);
  }

  /**
   * Logs database operation
   * @param {string} operation - Database operation
   * @param {string} collection - Collection/table name
   * @param {number} duration - Operation duration in milliseconds
   * @param {string} requestId - Request ID for tracking
   */
  static database(operation, collection, duration, requestId) {
    const message = `Database ${operation} on ${collection} took ${duration}ms`;
    const data = {
      operation,
      collection,
      duration,
      type: 'database'
    };
    this.debug(message, data, requestId);
  }

  /**
   * Logs authentication events
   * @param {string} event - Authentication event
   * @param {string} username - Username
   * @param {boolean} success - Whether authentication was successful
   * @param {string} requestId - Request ID for tracking
   */
  static auth(event, username, success, requestId) {
    const message = `Authentication ${event} for ${username}: ${success ? 'SUCCESS' : 'FAILED'}`;
    const data = {
      event,
      username,
      success,
      type: 'authentication'
    };

    if (success) {
      this.info(message, data, requestId);
    } else {
      this.warn(message, data, requestId);
    }
  }

  /**
   * Logs performance metrics
   * @param {string} operation - Operation name
   * @param {number} duration - Duration in milliseconds
   * @param {Object} metrics - Additional metrics
   * @param {string} requestId - Request ID for tracking
   */
  static performance(operation, duration, metrics = {}, requestId) {
    const message = `Performance: ${operation} took ${duration}ms`;
    const data = {
      operation,
      duration,
      ...metrics,
      type: 'performance'
    };
    this.debug(message, data, requestId);
  }

  /**
   * Creates a structured log entry
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   * @param {string} requestId - Request ID for tracking
   * @returns {Object} Structured log entry
   */
  static createLogEntry(level, message, data = null, requestId = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(requestId && { requestId }),
      ...(data && { data })
    };

    // Add error stack trace if data is an Error object
    if (data instanceof Error) {
      entry.error = {
        name: data.name,
        message: data.message,
        stack: data.stack
      };
      delete entry.data;
    }

    return entry;
  }

  /**
   * Formats log entry for console output
   * @param {Object} logEntry - Log entry object
   * @returns {string} Formatted log string
   */
  static formatLogEntry(logEntry) {
    const { timestamp, level, message, requestId, data, error } = logEntry;

    let formatted = `[${timestamp}] ${level.toUpperCase()}`;

    if (requestId) {
      formatted += ` [${requestId}]`;
    }

    formatted += `: ${message}`;

    if (config.server.isDevelopment) {
      if (data) {
        formatted += `\nData: ${JSON.stringify(data, null, 2)}`;
      }

      if (error) {
        formatted += `\nError: ${error.name}: ${error.message}`;
        formatted += `\nStack: ${error.stack}`;
      }
    }

    return formatted;
  }

  /**
   * Logs with custom level
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   * @param {string} requestId - Request ID for tracking
   */
  static log(level, message, data = null, requestId = null) {
    switch (level) {
      case LOG_LEVELS.ERROR:
        this.error(message, data, requestId);
        break;
      case LOG_LEVELS.WARN:
        this.warn(message, data, requestId);
        break;
      case LOG_LEVELS.INFO:
        this.info(message, data, requestId);
        break;
      case LOG_LEVELS.DEBUG:
        this.debug(message, data, requestId);
        break;
      default:
        this.info(message, data, requestId);
    }
  }

  /**
   * Creates a child logger with preset request ID
   * @param {string} requestId - Request ID
   * @returns {Object} Child logger with bound request ID
   */
  static child(requestId) {
    return {
      error: (message, data = null) => this.error(message, data, requestId),
      warn: (message, data = null) => this.warn(message, data, requestId),
      info: (message, data = null) => this.info(message, data, requestId),
      debug: (message, data = null) => this.debug(message, data, requestId),
      httpRequest: (method, url, statusCode, responseTime) =>
        this.httpRequest(method, url, statusCode, responseTime, requestId),
      database: (operation, collection, duration) =>
        this.database(operation, collection, duration, requestId),
      auth: (event, username, success) =>
        this.auth(event, username, success, requestId),
      performance: (operation, duration, metrics = {}) =>
        this.performance(operation, duration, metrics, requestId)
    };
  }
}

module.exports = {
  Logger
};
