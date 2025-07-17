const fs = require('fs').promises;
const path = require('path');
const csvParser = require('csv-parser');
const { createReadStream } = require('fs');
const { Logger } = require('../utils/logger');
const {
  CSV_COLUMNS,
  CSV_COLUMN_MAPPING,
  ERROR_CODES
} = require('../constants');

/**
 * CsvParserService - Specialized CSV parsing and data transformation service
 *
 * Responsibilities:
 * - Stream-based CSV reading for memory efficiency
 * - Header validation and column mapping
 * - Data transformation pipeline with type conversion
 * - Encoding support (UTF-8, ISO-8859-1)
 * - Error handling for malformed data
 *
 * Following Clean Code principles:
 * - Single Responsibility: Only handles CSV parsing and transformation
 * - Open/Closed: Extensible for new data formats
 * - Dependency Inversion: Depends on abstractions for logging and configuration
 */
class CsvParserService {
  constructor() {
    this.logger = Logger;
    this.supportedEncodings = ['utf8', 'utf-8', 'iso-8859-1', 'latin1'];
    this.defaultEncoding = 'utf8';
    this.maxRowsInMemory = 1000; // Process in chunks to avoid memory issues
  }

  /**
   * Parse CSV file with stream-based processing
   * @param {string} filePath - Path to CSV file
   * @param {Object} options - Parsing options
   * @param {string} options.encoding - File encoding (utf8, iso-8859-1)
   * @param {Array<string>} options.expectedHeaders - Expected column headers
   * @param {Object} options.metadata - Additional metadata to add to each row
   * @param {boolean} options.validateHeaders - Whether to validate headers
   * @returns {Promise<Array<Object>>} Parsed and transformed data
   */
  async parseFile(filePath, options = {}) {
    try {
      this.logger.info('Starting CSV parsing', { filePath, options });

      // Set default options
      const parsingOptions = {
        encoding: this.defaultEncoding,
        expectedHeaders: null,
        metadata: {},
        validateHeaders: true,
        skipEmptyRows: true,
        trimWhitespace: true,
        ...options
      };

      // Validate file exists and is readable
      await this.validateFile(filePath);

      // Detect encoding if not specified
      if (!parsingOptions.encoding || parsingOptions.encoding === 'auto') {
        parsingOptions.encoding = await this.detectEncoding(filePath);
      }

      // Parse CSV with streaming
      const rawData = await this.streamCsvFile(filePath, parsingOptions);

      // Validate headers if required
      if (parsingOptions.validateHeaders && parsingOptions.expectedHeaders) {
        this.validateHeaders(rawData, parsingOptions.expectedHeaders);
      }

      // Transform data through pipeline
      const transformedData = await this.transformData(rawData, parsingOptions);

      this.logger.info('CSV parsing completed successfully', {
        filePath,
        recordCount: transformedData.length,
        encoding: parsingOptions.encoding
      });

      return transformedData;
    } catch (error) {
      this.logger.error('CSV parsing failed', {
        filePath,
        error: error.message
      });
      throw this.createParsingError(error, filePath);
    }
  }

  /**
   * Stream-based CSV file reading for memory efficiency
   * @param {string} filePath - Path to CSV file
   * @param {Object} options - Streaming options
   * @returns {Promise<Array<Object>>} Raw CSV data
   */
  async streamCsvFile(filePath, options) {
    return new Promise((resolve, reject) => {
      const results = [];
      const stream = createReadStream(filePath, { encoding: options.encoding });

      // Configure CSV parser
      const parserOptions = {
        separator: ',',
        quote: '"',
        escape: '"',
        skipEmptyLines: options.skipEmptyRows,
        mapHeaders: ({ header }) =>
          options.trimWhitespace ? header.trim() : header
      };

      stream
        .pipe(csvParser(parserOptions))
        .on('data', row => {
          try {
            // Process row data
            const processedRow = this.processRow(row, options);
            if (processedRow) {
              results.push(processedRow);
            }

            // Memory management - process in chunks
            if (results.length >= this.maxRowsInMemory) {
              this.logger.debug('Processing CSV chunk', {
                size: results.length
              });
            }
          } catch (error) {
            this.logger.warn('Error processing CSV row', {
              row,
              error: error.message
            });
            // Continue processing other rows
          }
        })
        .on('end', () => {
          this.logger.debug('CSV streaming completed', {
            totalRows: results.length
          });
          resolve(results);
        })
        .on('error', error => {
          this.logger.error('CSV streaming error', { error: error.message });
          reject(error);
        });
    });
  }

  /**
   * Process individual CSV row
   * @param {Object} row - Raw CSV row data
   * @param {Object} options - Processing options
   * @returns {Object|null} Processed row or null if should be skipped
   */
  processRow(row, options) {
    // Skip empty rows
    if (options.skipEmptyRows && this.isEmptyRow(row)) {
      return null;
    }

    // Trim whitespace from values
    if (options.trimWhitespace) {
      row = this.trimRowValues(row);
    }

    // Add metadata
    if (options.metadata && Object.keys(options.metadata).length > 0) {
      row = { ...row, ...options.metadata };
    }

    return row;
  }

  /**
   * Transform raw CSV data through processing pipeline
   * @param {Array<Object>} rawData - Raw CSV data
   * @param {Object} options - Transformation options
   * @returns {Promise<Array<Object>>} Transformed data
   */
  async transformData(rawData, options) {
    try {
      this.logger.debug('Starting data transformation', {
        recordCount: rawData.length
      });

      let transformedData = [...rawData];

      // Apply column mapping
      transformedData = this.applyColumnMapping(transformedData);

      // Apply data type conversions
      transformedData = await this.applyDataTypes(transformedData);

      // Remove BOM characters if present
      transformedData = this.removeBomCharacters(transformedData);

      // Filter out invalid records
      transformedData = this.filterValidRecords(transformedData);

      this.logger.debug('Data transformation completed', {
        originalCount: rawData.length,
        transformedCount: transformedData.length
      });

      return transformedData;
    } catch (error) {
      this.logger.error('Data transformation failed', { error: error.message });
      throw new Error(`Data transformation failed: ${error.message}`);
    }
  }

  /**
   * Apply column mapping to transform CSV headers to API format
   * @param {Array<Object>} data - Data to transform
   * @returns {Array<Object>} Data with mapped columns
   */
  applyColumnMapping(data) {
    return data.map(row => {
      const mappedRow = {};

      Object.keys(row).forEach(key => {
        const mappedKey = CSV_COLUMN_MAPPING[key] || key;
        mappedRow[mappedKey] = row[key];
      });

      return mappedRow;
    });
  }

  /**
   * Apply data type conversions to ensure proper data types
   * @param {Array<Object>} data - Data to convert
   * @returns {Promise<Array<Object>>} Data with converted types
   */
  async applyDataTypes(data) {
    return data.map(row => {
      const convertedRow = { ...row };

      // Convert item-based CSV fields
      if (convertedRow.itemsSold !== undefined) {
        convertedRow.itemsSold = this.convertToNumber(convertedRow.itemsSold);
      }

      if (convertedRow.grossSales !== undefined) {
        convertedRow.grossSales = this.convertToNumber(convertedRow.grossSales);
      }

      if (convertedRow.itemName !== undefined) {
        convertedRow.itemName = this.convertToString(convertedRow.itemName);
      }

      if (convertedRow.category !== undefined) {
        convertedRow.category = this.convertToString(convertedRow.category);
      }

      // Convert Loyverse hourly sales fields
      if (convertedRow['Gross sales'] !== undefined) {
        convertedRow['Gross sales'] = this.convertToNumber(
          convertedRow['Gross sales']
        );
      }

      if (convertedRow['Net sales'] !== undefined) {
        convertedRow['Net sales'] = this.convertToNumber(
          convertedRow['Net sales']
        );
      }

      if (convertedRow['Refunds'] !== undefined) {
        convertedRow['Refunds'] = this.convertToNumber(convertedRow['Refunds']);
      }

      if (convertedRow['Discounts'] !== undefined) {
        convertedRow['Discounts'] = this.convertToNumber(
          convertedRow['Discounts']
        );
      }

      if (convertedRow['Cost of goods'] !== undefined) {
        convertedRow['Cost of goods'] = this.convertToNumber(
          convertedRow['Cost of goods']
        );
      }

      if (convertedRow['Gross profit'] !== undefined) {
        convertedRow['Gross profit'] = this.convertToNumber(
          convertedRow['Gross profit']
        );
      }

      if (convertedRow['Taxes'] !== undefined) {
        convertedRow['Taxes'] = this.convertToNumber(convertedRow['Taxes']);
      }

      // Convert date fields if present
      if (convertedRow.dateSold !== undefined) {
        convertedRow.dateSold = this.convertToDate(convertedRow.dateSold);
      }

      return convertedRow;
    });
  }

  /**
   * Detect file encoding automatically
   * @param {string} filePath - Path to file
   * @returns {Promise<string>} Detected encoding
   */
  async detectEncoding(filePath) {
    try {
      // Read first few bytes to detect encoding
      const buffer = await fs.readFile(filePath);
      const firstBytes = buffer.slice(0, 3);

      // Check for BOM (Byte Order Mark)
      if (
        firstBytes[0] === 0xef &&
        firstBytes[1] === 0xbb &&
        firstBytes[2] === 0xbf
      ) {
        return 'utf8';
      }

      // Simple heuristic: if high bytes are present, likely ISO-8859-1
      const hasHighBytes = buffer.some(byte => byte > 127);
      if (hasHighBytes) {
        return 'iso-8859-1';
      }

      return 'utf8';
    } catch (error) {
      this.logger.warn('Encoding detection failed, using default', {
        error: error.message
      });
      return this.defaultEncoding;
    }
  }

  /**
   * Validate CSV headers against expected headers
   * @param {Array<Object>} data - CSV data
   * @param {Array<string>} expectedHeaders - Expected header names
   */
  validateHeaders(data, expectedHeaders) {
    if (!data || data.length === 0) {
      throw new Error('CSV file is empty or invalid');
    }

    const actualHeaders = Object.keys(data[0]);
    const missingHeaders = expectedHeaders.filter(
      header => !actualHeaders.includes(header)
    );

    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }

    this.logger.debug('Header validation passed', {
      actualHeaders,
      expectedHeaders
    });
  }

  /**
   * Remove BOM (Byte Order Mark) characters from data
   * @param {Array<Object>} data - Data to clean
   * @returns {Array<Object>} Cleaned data
   */
  removeBomCharacters(data) {
    return data.map(row => {
      const cleanedRow = {};

      Object.keys(row).forEach(key => {
        // Remove BOM from key
        const cleanKey = key.replace(/^\uFEFF/, '');

        // Remove BOM from value if it's a string
        let cleanValue = row[key];
        if (typeof cleanValue === 'string') {
          cleanValue = cleanValue.replace(/^\uFEFF/, '');
        }

        cleanedRow[cleanKey] = cleanValue;
      });

      return cleanedRow;
    });
  }

  /**
   * Filter out invalid records based on business rules
   * @param {Array<Object>} data - Data to filter
   * @returns {Array<Object>} Valid records only
   */
  filterValidRecords(data) {
    return data.filter(row => {
      // Skip completely empty rows
      if (this.isEmptyRow(row)) {
        return false;
      }

      // For item-based data (has itemName field)
      if (row.itemName !== undefined) {
        // Skip rows with missing essential item data
        if (!row.itemName || row.itemName.trim() === '') {
          return false;
        }

        // Skip rows with invalid numeric values
        if (
          row.itemsSold !== undefined &&
          (isNaN(row.itemsSold) || row.itemsSold < 0)
        ) {
          return false;
        }

        if (
          row.grossSales !== undefined &&
          (isNaN(row.grossSales) || row.grossSales < 0)
        ) {
          return false;
        }
      }

      // For time-based data (Loyverse hourly format)
      if (row.Time !== undefined) {
        // All time-based records are valid, even if they have zero sales
        // This is important for hourly reports where some hours may have no sales
        return true;
      }

      // For any other data format, check if it has at least one non-empty value
      const hasValidData = Object.values(row).some(
        value =>
          value !== null && value !== undefined && String(value).trim() !== ''
      );

      return hasValidData;
    });
  }

  /**
   * Validate file exists and is readable
   * @param {string} filePath - Path to file
   */
  async validateFile(filePath) {
    try {
      const stats = await fs.stat(filePath);

      if (!stats.isFile()) {
        throw new Error(`Path is not a file: ${filePath}`);
      }

      if (stats.size === 0) {
        throw new Error(`File is empty: ${filePath}`);
      }

      // Check file extension
      const ext = path.extname(filePath).toLowerCase();
      if (ext !== '.csv') {
        this.logger.warn('File does not have .csv extension', {
          filePath,
          extension: ext
        });
      }
    } catch (error) {
      throw new Error(`File validation failed: ${error.message}`);
    }
  }

  /**
   * Utility methods for data conversion
   */

  convertToNumber(value) {
    if (value === null || value === undefined || value === '') {
      return 0;
    }

    // Remove common formatting characters
    const cleanValue = String(value).replace(/[,$\s]/g, '');
    const number = parseFloat(cleanValue);

    return isNaN(number) ? 0 : number;
  }

  convertToString(value) {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value).trim();
  }

  convertToDate(value) {
    if (!value) return null;

    try {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
    } catch (error) {
      return null;
    }
  }

  isEmptyRow(row) {
    return Object.values(row).every(
      value =>
        value === null || value === undefined || String(value).trim() === ''
    );
  }

  trimRowValues(row) {
    const trimmedRow = {};
    Object.keys(row).forEach(key => {
      const value = row[key];
      trimmedRow[key] = typeof value === 'string' ? value.trim() : value;
    });
    return trimmedRow;
  }

  createParsingError(error, filePath) {
    const errorCode = this.getErrorCode(error);
    return {
      code: errorCode,
      message: `CSV parsing failed for file: ${path.basename(filePath)}`,
      details: error.message,
      filePath: filePath
    };
  }

  getErrorCode(error) {
    if (error.message.includes('ENOENT')) {
      return ERROR_CODES.FILE_NOT_FOUND;
    }
    if (error.message.includes('header') || error.message.includes('column')) {
      return ERROR_CODES.INVALID_CSV_FORMAT;
    }
    return ERROR_CODES.PARSE_ERROR;
  }

  /**
   * Get supported encodings
   * @returns {Array<string>} List of supported encodings
   */
  getSupportedEncodings() {
    return [...this.supportedEncodings];
  }

  /**
   * Get parsing statistics
   * @param {Array<Object>} data - Parsed data
   * @returns {Object} Statistics object
   */
  getParsingStatistics(data) {
    if (!data || data.length === 0) {
      return {
        totalRecords: 0,
        validRecords: 0,
        invalidRecords: 0,
        columns: []
      };
    }

    const totalRecords = data.length;
    const validRecords = data.filter(row => !this.isEmptyRow(row)).length;
    const invalidRecords = totalRecords - validRecords;
    const columns = Object.keys(data[0]);

    return {
      totalRecords,
      validRecords,
      invalidRecords,
      columns,
      processingDate: new Date().toISOString()
    };
  }
}

module.exports = CsvParserService;
