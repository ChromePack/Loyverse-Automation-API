const fs = require('fs').promises;
const path = require('path');
const csvParser = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const { Logger } = require('../utils/logger');
const config = require('../config');

/**
 * DataExtractionService - Handles CSV data extraction and processing
 * Manages file processing, data transformation, and output generation
 * 
 * Following Clean Code principles:
 * - Single Responsibility: Only handles data extraction and processing
 * - Open/Closed: Extensible for new data formats and transformations
 * - Dependency Inversion: Depends on abstractions, not concrete implementations
 */
class DataExtractionService {
  constructor() {
    this.downloadPath = config.paths.downloads;
    this.processingPath = config.paths.processing;
    this.supportedFormats = ['csv'];
    this.logger = Logger;
  }

  /**
   * Process downloaded CSV file from Loyverse
   * @param {string} filename - Name of the downloaded file
   * @param {Object} options - Processing options
   * @param {string} options.outputFormat - Output format (csv, json)
   * @param {boolean} options.cleanData - Whether to clean and validate data
   * @param {Array<string>} options.selectedColumns - Specific columns to extract
   * @returns {Promise<Object>} Processing results
   */
  async processDownloadedFile(filename, options = {}) {
    try {
      this.logger.info('Starting file processing', { filename, options });

      // Set default options
      const processingOptions = {
        outputFormat: 'json',
        cleanData: true,
        selectedColumns: null,
        ...options
      };

      // Validate file exists
      const filePath = await this.validateFile(filename);

      // Extract data from CSV
      const rawData = await this.extractCsvData(filePath);

      // Process and transform data
      const processedData = await this.transformData(rawData, processingOptions);

      // Generate output
      const outputResult = await this.generateOutput(
        processedData,
        filename,
        processingOptions
      );

      this.logger.info('File processing completed successfully', {
        filename,
        recordCount: processedData.length,
        outputFormat: processingOptions.outputFormat
      });

      return {
        success: true,
        filename,
        recordCount: processedData.length,
        outputPath: outputResult.outputPath,
        data: processingOptions.outputFormat === 'json' ? processedData : null,
        summary: this.generateDataSummary(processedData)
      };
    } catch (error) {
      this.logger.error('File processing failed', {
        filename,
        error: error.message
      });
      throw new Error(`Data extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract data from CSV file
   * @param {string} filePath - Full path to the CSV file
   * @returns {Promise<Array>} Array of data objects
   */
  async extractCsvData(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      const stream = require('fs').createReadStream(filePath);

      this.logger.debug('Starting CSV extraction', { filePath });

      stream
        .pipe(csvParser({
          skipEmptyLines: true,
          skipLinesWithError: true
        }))
        .on('data', (row) => {
          results.push(row);
        })
        .on('end', () => {
          this.logger.debug('CSV extraction completed', {
            recordCount: results.length
          });
          resolve(results);
        })
        .on('error', (error) => {
          this.logger.error('CSV extraction failed', {
            error: error.message,
            filePath
          });
          reject(new Error(`CSV parsing failed: ${error.message}`));
        });
    });
  }

  /**
   * Transform and clean extracted data
   * @param {Array} rawData - Raw data from CSV
   * @param {Object} options - Transformation options
   * @returns {Promise<Array>} Transformed data
   */
  async transformData(rawData, options) {
    try {
      this.logger.debug('Starting data transformation', {
        recordCount: rawData.length,
        options
      });

      let transformedData = [...rawData];

      // Clean data if requested
      if (options.cleanData) {
        transformedData = await this.cleanData(transformedData);
      }

      // Select specific columns if requested
      if (options.selectedColumns && options.selectedColumns.length > 0) {
        transformedData = this.selectColumns(transformedData, options.selectedColumns);
      }

      // Apply data type conversions
      transformedData = await this.applyDataTypes(transformedData);

      this.logger.debug('Data transformation completed', {
        originalCount: rawData.length,
        transformedCount: transformedData.length
      });

      return transformedData;
    } catch (error) {
      this.logger.error('Data transformation failed', {
        error: error.message
      });
      throw new Error(`Data transformation failed: ${error.message}`);
    }
  }

  /**
   * Clean and validate data
   * @param {Array} data - Data to clean
   * @returns {Promise<Array>} Cleaned data
   */
  async cleanData(data) {
    try {
      this.logger.debug('Starting data cleaning');

      const cleanedData = data.filter(row => {
        // Remove empty rows
        const hasData = Object.values(row).some(value => 
          value !== null && value !== undefined && value !== ''
        );

        return hasData;
      }).map(row => {
        // Clean each row
        const cleanedRow = {};
        
        for (const [key, value] of Object.entries(row)) {
          // Clean column names (remove BOM, trim whitespace)
          const cleanKey = key.replace(/^\uFEFF/, '').trim();
          
          // Clean values
          let cleanValue = value;
          if (typeof value === 'string') {
            cleanValue = value.trim();
            // Convert empty strings to null
            if (cleanValue === '') {
              cleanValue = null;
            }
          }
          
          cleanedRow[cleanKey] = cleanValue;
        }
        
        return cleanedRow;
      });

      this.logger.debug('Data cleaning completed', {
        originalCount: data.length,
        cleanedCount: cleanedData.length,
        removedCount: data.length - cleanedData.length
      });

      return cleanedData;
    } catch (error) {
      this.logger.error('Data cleaning failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Select specific columns from data
   * @param {Array} data - Data to filter
   * @param {Array<string>} columns - Columns to select
   * @returns {Array} Filtered data
   */
  selectColumns(data, columns) {
    try {
      this.logger.debug('Selecting columns', { columns });

      const filteredData = data.map(row => {
        const filteredRow = {};
        columns.forEach(column => {
          if (Object.prototype.hasOwnProperty.call(row, column)) {
            filteredRow[column] = row[column];
          }
        });
        return filteredRow;
      });

      this.logger.debug('Column selection completed');
      return filteredData;
    } catch (error) {
      this.logger.error('Column selection failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Apply data type conversions
   * @param {Array} data - Data to convert
   * @returns {Promise<Array>} Converted data
   */
  async applyDataTypes(data) {
    try {
      this.logger.debug('Applying data type conversions');

      const convertedData = data.map(row => {
        const convertedRow = {};
        
        for (const [key, value] of Object.entries(row)) {
          convertedRow[key] = this.convertDataType(key, value);
        }
        
        return convertedRow;
      });

      this.logger.debug('Data type conversion completed');
      return convertedData;
    } catch (error) {
      this.logger.error('Data type conversion failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Convert individual data type based on column name and value
   * @param {string} columnName - Name of the column
   * @param {any} value - Value to convert
   * @returns {any} Converted value
   */
  convertDataType(columnName, value) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const lowerColumnName = columnName.toLowerCase();

    // Date conversions
    if (lowerColumnName.includes('date') || lowerColumnName.includes('time')) {
      const dateValue = new Date(value);
      return isNaN(dateValue.getTime()) ? value : dateValue.toISOString();
    }

    // Number conversions
    if (lowerColumnName.includes('amount') || 
        lowerColumnName.includes('price') || 
        lowerColumnName.includes('total') || 
        lowerColumnName.includes('quantity') ||
        lowerColumnName.includes('count')) {
      const numValue = parseFloat(value);
      return isNaN(numValue) ? value : numValue;
    }

    // Boolean conversions
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      if (lowerValue === 'true' || lowerValue === 'yes' || lowerValue === '1') {
        return true;
      }
      if (lowerValue === 'false' || lowerValue === 'no' || lowerValue === '0') {
        return false;
      }
    }

    return value;
  }

  /**
   * Generate output in requested format
   * @param {Array} data - Processed data
   * @param {string} originalFilename - Original filename
   * @param {Object} options - Output options
   * @returns {Promise<Object>} Output result
   */
  async generateOutput(data, originalFilename, options) {
    try {
      this.logger.debug('Generating output', {
        format: options.outputFormat,
        recordCount: data.length
      });

      // Ensure processing directory exists
      await this.ensureProcessingDirectory();

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const baseName = path.parse(originalFilename).name;
      
      let outputPath;
      let outputResult;

      switch (options.outputFormat) {
        case 'csv':
          outputPath = path.join(this.processingPath, `${baseName}_processed_${timestamp}.csv`);
          outputResult = await this.generateCsvOutput(data, outputPath);
          break;
        
        case 'json':
        default:
          outputPath = path.join(this.processingPath, `${baseName}_processed_${timestamp}.json`);
          outputResult = await this.generateJsonOutput(data, outputPath);
          break;
      }

      this.logger.info('Output generated successfully', {
        format: options.outputFormat,
        outputPath,
        recordCount: data.length
      });

      return {
        outputPath,
        format: options.outputFormat,
        recordCount: data.length,
        ...outputResult
      };
    } catch (error) {
      this.logger.error('Output generation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate CSV output
   * @param {Array} data - Data to write
   * @param {string} outputPath - Output file path
   * @returns {Promise<Object>} Write result
   */
  async generateCsvOutput(data, outputPath) {
    try {
      if (data.length === 0) {
        throw new Error('No data to write to CSV');
      }

      // Get headers from first row
      const headers = Object.keys(data[0]).map(key => ({
        id: key,
        title: key
      }));

      const csvWriter = createCsvWriter({
        path: outputPath,
        header: headers
      });

      await csvWriter.writeRecords(data);

      return {
        success: true,
        headers: headers.map(h => h.id)
      };
    } catch (error) {
      this.logger.error('CSV output generation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate JSON output
   * @param {Array} data - Data to write
   * @param {string} outputPath - Output file path
   * @returns {Promise<Object>} Write result
   */
  async generateJsonOutput(data, outputPath) {
    try {
      const jsonOutput = {
        timestamp: new Date().toISOString(),
        recordCount: data.length,
        data: data
      };

      await fs.writeFile(outputPath, JSON.stringify(jsonOutput, null, 2), 'utf8');

      return {
        success: true,
        recordCount: data.length
      };
    } catch (error) {
      this.logger.error('JSON output generation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate data summary statistics
   * @param {Array} data - Data to summarize
   * @returns {Object} Summary statistics
   */
  generateDataSummary(data) {
    try {
      if (data.length === 0) {
        return {
          recordCount: 0,
          columns: [],
          summary: 'No data available'
        };
      }

      const columns = Object.keys(data[0]);
      const summary = {
        recordCount: data.length,
        columns: columns,
        columnCount: columns.length,
        dataTypes: {}
      };

      // Analyze data types for each column
      columns.forEach(column => {
        const values = data.map(row => row[column]).filter(val => val !== null && val !== undefined);
        const sampleValue = values[0];
        
        if (typeof sampleValue === 'number') {
          summary.dataTypes[column] = 'number';
        } else if (typeof sampleValue === 'boolean') {
          summary.dataTypes[column] = 'boolean';
        } else if (sampleValue instanceof Date || 
                   (typeof sampleValue === 'string' && !isNaN(Date.parse(sampleValue)))) {
          summary.dataTypes[column] = 'date';
        } else {
          summary.dataTypes[column] = 'string';
        }
      });

      return summary;
    } catch (error) {
      this.logger.error('Summary generation failed', { error: error.message });
      return {
        recordCount: data.length,
        columns: [],
        error: error.message
      };
    }
  }

  /**
   * Validate file exists and is accessible
   * @param {string} filename - Name of the file to validate
   * @returns {Promise<string>} Full path to the file
   */
  async validateFile(filename) {
    try {
      const filePath = path.join(this.downloadPath, filename);
      
      // Check if file exists
      await fs.access(filePath, fs.constants.F_OK);
      
      // Check if file is readable
      await fs.access(filePath, fs.constants.R_OK);
      
      // Get file stats
      const stats = await fs.stat(filePath);
      
      if (!stats.isFile()) {
        throw new Error(`${filename} is not a file`);
      }
      
      if (stats.size === 0) {
        throw new Error(`${filename} is empty`);
      }

      this.logger.debug('File validation successful', {
        filename,
        size: stats.size,
        modified: stats.mtime
      });

      return filePath;
    } catch (error) {
      this.logger.error('File validation failed', {
        filename,
        error: error.message
      });
      throw new Error(`File validation failed: ${error.message}`);
    }
  }

  /**
   * Ensure processing directory exists
   * @returns {Promise<void>}
   */
  async ensureProcessingDirectory() {
    try {
      await fs.mkdir(this.processingPath, { recursive: true });
      this.logger.debug(`Processing directory ensured: ${this.processingPath}`);
    } catch (error) {
      this.logger.error('Failed to create processing directory', {
        path: this.processingPath,
        error: error.message
      });
      throw new Error(`Processing directory creation failed: ${error.message}`);
    }
  }

  /**
   * List available files in download directory
   * @returns {Promise<Array>} Array of available files
   */
  async listAvailableFiles() {
    try {
      const files = await fs.readdir(this.downloadPath);
      
      const csvFiles = files.filter(file => 
        path.extname(file).toLowerCase() === '.csv'
      );

      const fileDetails = await Promise.all(
        csvFiles.map(async (file) => {
          const filePath = path.join(this.downloadPath, file);
          const stats = await fs.stat(filePath);
          
          return {
            filename: file,
            size: stats.size,
            modified: stats.mtime,
            created: stats.birthtime
          };
        })
      );

      return fileDetails.sort((a, b) => b.modified - a.modified);
    } catch (error) {
      this.logger.error('Failed to list available files', {
        error: error.message
      });
      return [];
    }
  }

  /**
   * Clean up old processed files
   * @param {number} maxAge - Maximum age in days
   * @returns {Promise<number>} Number of files cleaned
   */
  async cleanupOldFiles(maxAge = 7) {
    try {
      this.logger.info('Starting cleanup of old files', { maxAge });

      const files = await fs.readdir(this.processingPath);
      const cutoffDate = new Date(Date.now() - (maxAge * 24 * 60 * 60 * 1000));
      
      let cleanedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.processingPath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          cleanedCount++;
          this.logger.debug('Cleaned up old file', { file });
        }
      }

      this.logger.info('Cleanup completed', { cleanedCount });
      return cleanedCount;
    } catch (error) {
      this.logger.error('Cleanup failed', { error: error.message });
      return 0;
    }
  }
}

module.exports = DataExtractionService;
