const { Logger } = require('../utils/logger');
const { ERROR_CODES, STORE_CONFIG, DATE_FORMATS } = require('../constants');

/**
 * ValidationService - Comprehensive data validation service
 *
 * Responsibilities:
 * - Required field validation for essential data
 * - Numeric field validation with range checking
 * - Date format validation with multiple format support
 * - Store name validation against configured stores
 * - Comprehensive error reporting and logging
 *
 * Following Clean Code principles:
 * - Single Responsibility: Only handles data validation
 * - Open/Closed: Extensible for new validation rules
 * - Dependency Inversion: Depends on abstractions for logging
 */
class ValidationService {
  constructor() {
    this.logger = Logger;
    this.validationRules = this.initializeValidationRules();
    this.errorCollector = [];
  }

  /**
   * Validate a single data record
   * @param {Object} record - Data record to validate
   * @param {Object} options - Validation options
   * @param {string} options.recordType - Type of record ('item', 'hourly', 'daily')
   * @param {boolean} options.strict - Whether to use strict validation
   * @param {Array<string>} options.requiredFields - Custom required fields
   * @returns {Object} Validation result with errors
   */
  validateRecord(record, options = {}) {
    try {
      this.logger.debug('Starting record validation', { record, options });

      // Set default options
      const validationOptions = {
        recordType: 'item',
        strict: true,
        requiredFields: null,
        ...options
      };

      // Clear previous errors
      this.errorCollector = [];

      // Determine validation rules based on record type
      const rules = this.getValidationRules(validationOptions.recordType);

      // Validate required fields
      this.validateRequiredFields(
        record,
        rules.requiredFields,
        validationOptions
      );

      // Validate numeric fields
      this.validateNumericFields(
        record,
        rules.numericFields,
        validationOptions
      );

      // Validate date fields
      this.validateDateFields(record, rules.dateFields, validationOptions);

      // Validate store name if present
      if (record.storeBranch || record.store_branch) {
        this.validateStoreName(
          record.storeBranch || record.store_branch,
          validationOptions
        );
      }

      // Validate item-specific fields
      if (validationOptions.recordType === 'item') {
        this.validateItemFields(record, validationOptions);
      }

      // Validate time-based fields
      if (
        validationOptions.recordType === 'hourly' ||
        validationOptions.recordType === 'daily'
      ) {
        this.validateTimeFields(record, validationOptions);
      }

      const isValid = this.errorCollector.length === 0;
      const result = {
        isValid,
        errors: [...this.errorCollector],
        record,
        validationOptions
      };

      this.logger.debug('Record validation completed', {
        isValid,
        errorCount: this.errorCollector.length
      });

      return result;
    } catch (error) {
      this.logger.error('Record validation failed', { error: error.message });
      return {
        isValid: false,
        errors: [
          {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: `Validation failed: ${error.message}`,
            field: 'unknown',
            value: null
          }
        ],
        record,
        validationOptions: options
      };
    }
  }

  /**
   * Validate multiple records in batch
   * @param {Array<Object>} records - Array of records to validate
   * @param {Object} options - Validation options
   * @returns {Object} Batch validation results
   */
  validateBatch(records, options = {}) {
    try {
      this.logger.info('Starting batch validation', {
        recordCount: records.length,
        options
      });

      const results = records.map((record, index) => {
        const result = this.validateRecord(record, options);
        return {
          index,
          ...result
        };
      });

      const validRecords = results.filter(r => r.isValid);
      const invalidRecords = results.filter(r => !r.isValid);
      const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

      const batchResult = {
        totalRecords: records.length,
        validRecords: validRecords.length,
        invalidRecords: invalidRecords.length,
        totalErrors,
        validationRate: (validRecords.length / records.length) * 100,
        results,
        summary: this.generateValidationSummary(results)
      };

      this.logger.info('Batch validation completed', {
        totalRecords: batchResult.totalRecords,
        validRecords: batchResult.validRecords,
        invalidRecords: batchResult.invalidRecords,
        validationRate: batchResult.validationRate.toFixed(2) + '%'
      });

      return batchResult;
    } catch (error) {
      this.logger.error('Batch validation failed', { error: error.message });
      throw new Error(`Batch validation failed: ${error.message}`);
    }
  }

  /**
   * Required field validation
   * @param {Object} record - Record to validate
   * @param {Array<string>} requiredFields - Required field names
   * @param {Object} options - Validation options
   */
  validateRequiredFields(record, requiredFields, options) {
    requiredFields.forEach(field => {
      const value = record[field];

      if (value === undefined || value === null) {
        this.addError(
          ERROR_CODES.VALIDATION_ERROR,
          `Required field '${field}' is missing`,
          field,
          value
        );
      } else if (typeof value === 'string' && value.trim() === '') {
        this.addError(
          ERROR_CODES.VALIDATION_ERROR,
          `Required field '${field}' is empty`,
          field,
          value
        );
      }
    });
  }

  /**
   * Numeric field validation
   * @param {Object} record - Record to validate
   * @param {Object} numericFields - Numeric field configurations
   * @param {Object} options - Validation options
   */
  validateNumericFields(record, numericFields, options) {
    Object.keys(numericFields).forEach(field => {
      const value = record[field];
      const config = numericFields[field];

      if (value !== undefined && value !== null) {
        // Check if value is numeric
        const numericValue = Number(value);

        if (isNaN(numericValue)) {
          this.addError(
            ERROR_CODES.DATA_VALIDATION_ERROR,
            `Field '${field}' must be a number`,
            field,
            value
          );
          return;
        }

        // Check minimum value
        if (config.min !== undefined && numericValue < config.min) {
          this.addError(
            ERROR_CODES.DATA_VALIDATION_ERROR,
            `Field '${field}' must be at least ${config.min}`,
            field,
            value
          );
        }

        // Check maximum value
        if (config.max !== undefined && numericValue > config.max) {
          this.addError(
            ERROR_CODES.DATA_VALIDATION_ERROR,
            `Field '${field}' must be at most ${config.max}`,
            field,
            value
          );
        }

        // Check decimal places
        if (config.decimals !== undefined) {
          const decimalPlaces = (numericValue.toString().split('.')[1] || '')
            .length;
          if (decimalPlaces > config.decimals) {
            this.addError(
              ERROR_CODES.DATA_VALIDATION_ERROR,
              `Field '${field}' can have at most ${config.decimals} decimal places`,
              field,
              value
            );
          }
        }
      }
    });
  }

  /**
   * Date format validation
   * @param {Object} record - Record to validate
   * @param {Array<string>} dateFields - Date field names
   * @param {Object} options - Validation options
   */
  validateDateFields(record, dateFields, options) {
    dateFields.forEach(field => {
      const value = record[field];

      if (value !== undefined && value !== null) {
        if (!this.isValidDate(value)) {
          this.addError(
            ERROR_CODES.DATA_VALIDATION_ERROR,
            `Field '${field}' must be a valid date`,
            field,
            value
          );
        }
      }
    });
  }

  /**
   * Store name validation
   * @param {string} storeName - Store name to validate
   * @param {Object} options - Validation options
   */
  validateStoreName(storeName, options) {
    if (!storeName || typeof storeName !== 'string') {
      this.addError(
        ERROR_CODES.STORE_NOT_FOUND,
        'Store name is required',
        'storeBranch',
        storeName
      );
      return;
    }

    const normalizedStoreName = storeName.trim();
    const validStores = STORE_CONFIG.STORE_NAMES;

    if (!validStores.includes(normalizedStoreName)) {
      this.addError(
        ERROR_CODES.STORE_NOT_FOUND,
        `Invalid store name '${normalizedStoreName}'. Valid stores: ${validStores.join(', ')}`,
        'storeBranch',
        storeName
      );
    }
  }

  /**
   * Item-specific field validation
   * @param {Object} record - Record to validate
   * @param {Object} options - Validation options
   */
  validateItemFields(record, options) {
    // Item name validation
    if (record.itemName !== undefined) {
      this.validateItemName(record.itemName);
    }

    // Category validation
    if (record.category !== undefined) {
      this.validateCategory(record.category);
    }

    // Sales amount validation
    if (record.grossSales !== undefined) {
      this.validateSalesAmount(record.grossSales, 'grossSales');
    }

    // Quantity validation
    if (record.itemsSold !== undefined) {
      this.validateQuantity(record.itemsSold, 'itemsSold');
    }
  }

  /**
   * Time-based field validation for hourly/daily reports
   * @param {Object} record - Record to validate
   * @param {Object} options - Validation options
   */
  validateTimeFields(record, options) {
    // Time field validation
    if (record.Time !== undefined) {
      this.validateTimeFormat(record.Time);
    }

    // Sales fields validation
    ['Gross sales', 'Net sales', 'Refunds', 'Discounts', 'Taxes'].forEach(
      field => {
        if (record[field] !== undefined) {
          this.validateSalesAmount(record[field], field);
        }
      }
    );
  }

  /**
   * Item name validation
   * @param {string} itemName - Item name to validate
   */
  validateItemName(itemName) {
    if (!itemName || typeof itemName !== 'string') {
      this.addError(
        ERROR_CODES.DATA_VALIDATION_ERROR,
        'Item name is required',
        'itemName',
        itemName
      );
      return;
    }

    const trimmedName = itemName.trim();

    if (trimmedName.length === 0) {
      this.addError(
        ERROR_CODES.DATA_VALIDATION_ERROR,
        'Item name cannot be empty',
        'itemName',
        itemName
      );
    } else if (trimmedName.length > 255) {
      this.addError(
        ERROR_CODES.DATA_VALIDATION_ERROR,
        'Item name cannot exceed 255 characters',
        'itemName',
        itemName
      );
    }
  }

  /**
   * Category validation
   * @param {string} category - Category to validate
   */
  validateCategory(category) {
    if (category !== undefined && category !== null) {
      if (typeof category !== 'string') {
        this.addError(
          ERROR_CODES.DATA_VALIDATION_ERROR,
          'Category must be a string',
          'category',
          category
        );
        return;
      }

      const trimmedCategory = category.trim();
      if (trimmedCategory.length > 100) {
        this.addError(
          ERROR_CODES.DATA_VALIDATION_ERROR,
          'Category cannot exceed 100 characters',
          'category',
          category
        );
      }
    }
  }

  /**
   * Sales amount validation
   * @param {number|string} amount - Sales amount to validate
   * @param {string} fieldName - Field name for error reporting
   */
  validateSalesAmount(amount, fieldName) {
    if (amount !== undefined && amount !== null) {
      const numericAmount = Number(amount);

      if (isNaN(numericAmount)) {
        this.addError(
          ERROR_CODES.DATA_VALIDATION_ERROR,
          `${fieldName} must be a valid number`,
          fieldName,
          amount
        );
        return;
      }

      if (numericAmount < 0) {
        this.addError(
          ERROR_CODES.DATA_VALIDATION_ERROR,
          `${fieldName} cannot be negative`,
          fieldName,
          amount
        );
      }

      if (numericAmount > 999999.99) {
        this.addError(
          ERROR_CODES.DATA_VALIDATION_ERROR,
          `${fieldName} cannot exceed 999,999.99`,
          fieldName,
          amount
        );
      }
    }
  }

  /**
   * Quantity validation
   * @param {number|string} quantity - Quantity to validate
   * @param {string} fieldName - Field name for error reporting
   */
  validateQuantity(quantity, fieldName) {
    if (quantity !== undefined && quantity !== null) {
      const numericQuantity = Number(quantity);

      if (isNaN(numericQuantity)) {
        this.addError(
          ERROR_CODES.DATA_VALIDATION_ERROR,
          `${fieldName} must be a valid number`,
          fieldName,
          quantity
        );
        return;
      }

      if (numericQuantity < 0) {
        this.addError(
          ERROR_CODES.DATA_VALIDATION_ERROR,
          `${fieldName} cannot be negative`,
          fieldName,
          quantity
        );
      }

      if (!Number.isInteger(numericQuantity)) {
        this.addError(
          ERROR_CODES.DATA_VALIDATION_ERROR,
          `${fieldName} must be a whole number`,
          fieldName,
          quantity
        );
      }

      if (numericQuantity > 99999) {
        this.addError(
          ERROR_CODES.DATA_VALIDATION_ERROR,
          `${fieldName} cannot exceed 99,999`,
          fieldName,
          quantity
        );
      }
    }
  }

  /**
   * Time format validation (HH:MM)
   * @param {string} time - Time string to validate
   */
  validateTimeFormat(time) {
    if (!time || typeof time !== 'string') {
      this.addError(
        ERROR_CODES.DATA_VALIDATION_ERROR,
        'Time must be a string',
        'Time',
        time
      );
      return;
    }

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      this.addError(
        ERROR_CODES.DATA_VALIDATION_ERROR,
        'Time must be in HH:MM format (24-hour)',
        'Time',
        time
      );
    }
  }

  /**
   * Check if a value is a valid date
   * @param {any} value - Value to check
   * @returns {boolean} True if valid date
   */
  isValidDate(value) {
    if (!value) return false;

    const date = new Date(value);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Add validation error to collector
   * @param {string} code - Error code
   * @param {string} message - Error message
   * @param {string} field - Field name
   * @param {any} value - Field value
   */
  addError(code, message, field, value) {
    const error = {
      code,
      message,
      field,
      value,
      timestamp: new Date().toISOString()
    };

    this.errorCollector.push(error);
    this.logger.warn('Validation error', error);
  }

  /**
   * Get validation rules based on record type
   * @param {string} recordType - Type of record
   * @returns {Object} Validation rules
   */
  getValidationRules(recordType) {
    return this.validationRules[recordType] || this.validationRules.default;
  }

  /**
   * Initialize validation rules for different record types
   * @returns {Object} Validation rules configuration
   */
  initializeValidationRules() {
    return {
      item: {
        requiredFields: ['itemName'],
        numericFields: {
          itemsSold: { min: 0, max: 99999, decimals: 0 },
          grossSales: { min: 0, max: 999999.99, decimals: 2 }
        },
        dateFields: ['dateSold']
      },
      hourly: {
        requiredFields: ['Time'],
        numericFields: {
          'Gross sales': { min: 0, max: 999999.99, decimals: 2 },
          'Net sales': { min: 0, max: 999999.99, decimals: 2 },
          Refunds: { min: 0, max: 999999.99, decimals: 2 },
          Discounts: { min: 0, max: 999999.99, decimals: 2 },
          Taxes: { min: 0, max: 999999.99, decimals: 2 }
        },
        dateFields: ['dateSold']
      },
      daily: {
        requiredFields: ['date'],
        numericFields: {
          totalSales: { min: 0, max: 9999999.99, decimals: 2 },
          totalItems: { min: 0, max: 999999, decimals: 0 }
        },
        dateFields: ['date']
      },
      default: {
        requiredFields: [],
        numericFields: {},
        dateFields: []
      }
    };
  }

  /**
   * Generate validation summary from results
   * @param {Array<Object>} results - Validation results
   * @returns {Object} Validation summary
   */
  generateValidationSummary(results) {
    const errorsByField = {};
    const errorsByCode = {};

    results.forEach(result => {
      result.errors.forEach(error => {
        // Count errors by field
        if (!errorsByField[error.field]) {
          errorsByField[error.field] = 0;
        }
        errorsByField[error.field]++;

        // Count errors by code
        if (!errorsByCode[error.code]) {
          errorsByCode[error.code] = 0;
        }
        errorsByCode[error.code]++;
      });
    });

    return {
      errorsByField,
      errorsByCode,
      mostCommonErrors: Object.entries(errorsByCode)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([code, count]) => ({ code, count })),
      mostProblematicFields: Object.entries(errorsByField)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([field, count]) => ({ field, count }))
    };
  }

  /**
   * Format validation errors for display
   * @param {Array<Object>} errors - Validation errors
   * @returns {Array<string>} Formatted error messages
   */
  formatErrors(errors) {
    return errors.map(error => {
      return `[${error.code}] ${error.message} (Field: ${error.field}, Value: ${error.value})`;
    });
  }

  /**
   * Get validation statistics
   * @param {Object} batchResult - Batch validation result
   * @returns {Object} Validation statistics
   */
  getValidationStatistics(batchResult) {
    return {
      totalRecords: batchResult.totalRecords,
      validRecords: batchResult.validRecords,
      invalidRecords: batchResult.invalidRecords,
      validationRate: batchResult.validationRate,
      totalErrors: batchResult.totalErrors,
      averageErrorsPerInvalidRecord:
        batchResult.invalidRecords > 0
          ? (batchResult.totalErrors / batchResult.invalidRecords).toFixed(2)
          : 0,
      summary: batchResult.summary
    };
  }
}

module.exports = ValidationService;
