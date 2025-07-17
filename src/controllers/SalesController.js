const { Logger } = require('../utils/logger');
const { DateUtils } = require('../utils/dateUtils');
const { Store } = require('../models/Store');
const { SalesItem } = require('../models/SalesItem');
const BrowserService = require('../services/BrowserService');
const AuthService = require('../services/AuthService');
const NavigationService = require('../services/NavigationService');
const DataExtractionService = require('../services/DataExtractionService');
const CsvParserService = require('../services/CsvParserService');
const ValidationService = require('../services/ValidationService');
const AggregationService = require('../services/AggregationService');
const { ERROR_CODES, ERROR_MESSAGES } = require('../constants');

/**
 * SalesController - Main sales operations controller
 *
 * Responsibilities:
 * - Handle extract daily sales endpoint
 * - Handle extract single store endpoint
 * - Request validation and parameter processing
 * - Response formatting and error handling
 * - Orchestrate service calls for data extraction
 *
 * Following Clean Code principles:
 * - Single Responsibility: Only handles HTTP request/response for sales operations
 * - Open/Closed: Extensible for new sales endpoints
 * - Dependency Inversion: Depends on service abstractions
 * - Interface Segregation: Focused on sales-specific operations
 */
class SalesController {
  constructor() {
    this.logger = Logger;
    this.browserService = new BrowserService();
    this.authService = new AuthService();
    this.navigationService = new NavigationService();
    this.dataExtractionService = new DataExtractionService();
    this.csvParserService = new CsvParserService();
    this.validationService = new ValidationService();
    this.aggregationService = new AggregationService();
  }

  /**
   * Extract daily sales data for all stores or specific stores
   * POST /api/extract-daily-sales
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async extractDailySales(req, res) {
    const requestId = req.requestId;
    const startTime = Date.now();

    try {
      this.logger.info('Starting daily sales extraction', {
        requestId,
        body: req.body,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Validate and process request parameters
      const extractionParams = this.validateDailySalesRequest(req.body);

      // Log extraction parameters
      this.logger.info('Extraction parameters validated', {
        requestId,
        params: extractionParams
      });

      // Perform sales extraction
      const extractionResult = await this.performSalesExtraction(
        extractionParams,
        requestId
      );

      // Calculate processing time
      const processingTime = Date.now() - startTime;

      // Format success response
      const response = {
        success: true,
        data: {
          extraction_date: extractionParams.date,
          extraction_time: new Date().toISOString(),
          processing_time_ms: processingTime,
          stores: extractionResult.stores,
          summary: {
            total_stores: extractionResult.stores.length,
            total_items: extractionResult.summary.totalItems,
            total_sales: extractionResult.summary.totalSales,
            extraction_method: 'automated'
          }
        },
        metadata: {
          request_id: requestId,
          api_version: '1.0.0',
          timestamp: new Date().toISOString()
        }
      };

      this.logger.info('Daily sales extraction completed successfully', {
        requestId,
        storeCount: extractionResult.stores.length,
        totalItems: extractionResult.summary.totalItems,
        processingTime
      });

      res.status(200).json(response);
    } catch (error) {
      this.handleControllerError(error, req, res, 'extractDailySales');
    }
  }

  /**
   * Extract sales data for a single store
   * POST /api/extract-store
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async extractStore(req, res) {
    const requestId = req.requestId;
    const startTime = Date.now();

    try {
      this.logger.info('Starting single store extraction', {
        requestId,
        body: req.body,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Validate and process request parameters
      const extractionParams = this.validateStoreRequest(req.body);

      // Log extraction parameters
      this.logger.info('Store extraction parameters validated', {
        requestId,
        params: extractionParams
      });

      // Perform single store extraction
      const extractionResult = await this.performSingleStoreExtraction(
        extractionParams,
        requestId
      );

      // Calculate processing time
      const processingTime = Date.now() - startTime;

      // Format success response
      const response = {
        success: true,
        data: {
          extraction_date: extractionParams.date,
          extraction_time: new Date().toISOString(),
          processing_time_ms: processingTime,
          store: extractionResult.store,
          summary: {
            store_name: extractionResult.store.store_name,
            items_count: extractionResult.store.items_count,
            total_sales: extractionResult.store.total_sales,
            extraction_method: 'automated'
          }
        },
        metadata: {
          request_id: requestId,
          api_version: '1.0.0',
          timestamp: new Date().toISOString()
        }
      };

      this.logger.info('Single store extraction completed successfully', {
        requestId,
        storeName: extractionResult.store.store_name,
        itemsCount: extractionResult.store.items_count,
        processingTime
      });

      res.status(200).json(response);
    } catch (error) {
      this.handleControllerError(error, req, res, 'extractStore');
    }
  }

  /**
   * Validate daily sales extraction request parameters
   * @param {Object} body - Request body
   * @returns {Object} Validated parameters
   */
  validateDailySalesRequest(body) {
    const params = {
      date: body.date || DateUtils.getCurrentDate(),
      stores: body.stores || ['all']
    };

    // Validate date format
    if (!DateUtils.isValidDate(params.date)) {
      throw new Error(
        `Invalid date format: ${params.date}. Expected YYYY-MM-DD`
      );
    }

    // Validate date is not in the future
    if (DateUtils.isFutureDate(params.date)) {
      throw new Error(`Date cannot be in the future: ${params.date}`);
    }

    // Validate stores parameter
    if (!Array.isArray(params.stores)) {
      throw new Error('Stores parameter must be an array');
    }

    // Validate individual store names (unless 'all' is specified)
    if (!params.stores.includes('all')) {
      const invalidStores = params.stores.filter(
        store => !Store.isValidStore(store)
      );
      if (invalidStores.length > 0) {
        throw new Error(`Invalid store names: ${invalidStores.join(', ')}`);
      }
    }

    return params;
  }

  /**
   * Validate single store extraction request parameters
   * @param {Object} body - Request body
   * @returns {Object} Validated parameters
   */
  validateStoreRequest(body) {
    if (!body.store_name) {
      throw new Error('store_name is required');
    }

    const params = {
      store_name: body.store_name,
      date: body.date || DateUtils.getCurrentDate()
    };

    // Validate store name
    if (!Store.isValidStore(params.store_name)) {
      throw new Error(`Invalid store name: ${params.store_name}`);
    }

    // Validate date format
    if (!DateUtils.isValidDate(params.date)) {
      throw new Error(
        `Invalid date format: ${params.date}. Expected YYYY-MM-DD`
      );
    }

    // Validate date is not in the future
    if (DateUtils.isFutureDate(params.date)) {
      throw new Error(`Date cannot be in the future: ${params.date}`);
    }

    return params;
  }

  /**
   * Perform sales extraction for multiple stores
   * @param {Object} params - Extraction parameters
   * @param {string} requestId - Request ID for tracking
   * @returns {Object} Extraction results
   */
  async performSalesExtraction(params, requestId) {
    let page = null;

    try {
      // Determine stores to extract
      const storesToExtract = params.stores.includes('all')
        ? Store.getAllStores()
        : params.stores;

      this.logger.info('Starting browser automation for sales extraction', {
        requestId,
        storesToExtract,
        date: params.date
      });

      // Initialize browser
      await this.browserService.launch();
      page = await this.browserService.createPage();

      // Authenticate
      await this.authService.authenticate(page);
      this.logger.info('Authentication successful', { requestId });

      // Extract data from each store
      const storeResults = [];
      for (const storeName of storesToExtract) {
        this.logger.info('Extracting data for store', { requestId, storeName });

        try {
          // Navigate to store and extract data
          await this.navigationService.navigateToStore(
            page,
            storeName,
            params.date
          );
          const downloadedFile = await this.navigationService.downloadSalesData(
            page,
            storeName
          );

          // Process downloaded data
          const processedData = await this.processStoreData(
            downloadedFile,
            storeName,
            params.date
          );
          storeResults.push(processedData);

          this.logger.info('Store data extracted successfully', {
            requestId,
            storeName,
            itemsCount: processedData.items_count
          });
        } catch (storeError) {
          this.logger.error('Error extracting data for store', {
            requestId,
            storeName,
            error: storeError.message
          });

          // Add failed store to results with error info
          storeResults.push({
            store_name: storeName,
            items_count: 0,
            total_sales: 0,
            items: [],
            error: storeError.message,
            status: 'failed'
          });
        }
      }

      // Aggregate results
      const aggregatedResults = this.aggregationService.aggregateByStore(
        storeResults.flatMap(store => store.items || []),
        {
          extractionDate: params.date,
          reportType: 'item',
          requestedStores: storesToExtract
        }
      );

      return {
        stores: storeResults,
        summary: {
          totalItems: storeResults.reduce(
            (sum, store) => sum + store.items_count,
            0
          ),
          totalSales: storeResults.reduce(
            (sum, store) => sum + store.total_sales,
            0
          )
        }
      };
    } finally {
      // Cleanup browser resources
      await this.browserService.close();
    }
  }

  /**
   * Perform sales extraction for a single store
   * @param {Object} params - Extraction parameters
   * @param {string} requestId - Request ID for tracking
   * @returns {Object} Extraction results
   */
  async performSingleStoreExtraction(params, requestId) {
    let page = null;

    try {
      this.logger.info(
        'Starting browser automation for single store extraction',
        {
          requestId,
          storeName: params.store_name,
          date: params.date
        }
      );

      // Initialize browser
      await this.browserService.launch();
      page = await this.browserService.createPage();

      // Authenticate
      await this.authService.authenticate(page);
      this.logger.info('Authentication successful', { requestId });

      // Navigate to store and extract data
      await this.navigationService.navigateToStore(
        page,
        params.store_name,
        params.date
      );
      const downloadedFile = await this.navigationService.downloadSalesData(
        page,
        params.store_name
      );

      // Process downloaded data
      const processedData = await this.processStoreData(
        downloadedFile,
        params.store_name,
        params.date
      );

      return {
        store: processedData
      };
    } finally {
      // Cleanup browser resources
      await this.browserService.close();
    }
  }

  /**
   * Process downloaded store data
   * @param {string} filename - Downloaded file name
   * @param {string} storeName - Store name
   * @param {string} date - Extraction date
   * @returns {Object} Processed store data
   */
  async processStoreData(filename, storeName, date) {
    try {
      // Parse CSV data
      const csvData = await this.csvParserService.parseFile(filename);

      // Validate data
      const validatedData =
        await this.validationService.validateSalesData(csvData);

      // Transform data to SalesItem format
      const salesItems = validatedData.map(item =>
        SalesItem.fromCsvData(item, storeName, date)
      );

      // Calculate totals
      const totalSales = salesItems.reduce(
        (sum, item) => sum + item.gross_sales,
        0
      );
      const itemsCount = salesItems.length;

      return {
        store_name: storeName,
        items_count: itemsCount,
        total_sales: totalSales,
        items: salesItems.map(item => item.toApiFormat()),
        status: 'success'
      };
    } catch (error) {
      this.logger.error('Error processing store data', {
        filename,
        storeName,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Handle controller errors with proper formatting and logging
   * @param {Error} error - The error that occurred
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {string} method - Controller method name
   */
  handleControllerError(error, req, res, method) {
    const requestId = req.requestId;
    const errorCode = this.determineErrorCode(error);
    const statusCode = this.determineStatusCode(errorCode);

    this.logger.error('Controller error occurred', {
      requestId,
      method,
      error: error.message,
      stack: error.stack,
      errorCode,
      statusCode
    });

    const errorResponse = {
      success: false,
      error: {
        code: errorCode,
        message: error.message,
        timestamp: new Date().toISOString()
      },
      metadata: {
        request_id: requestId,
        api_version: '1.0.0',
        timestamp: new Date().toISOString()
      }
    };

    res.status(statusCode).json(errorResponse);
  }

  /**
   * Determine error code based on error type
   * @param {Error} error - The error object
   * @returns {string} Error code
   */
  determineErrorCode(error) {
    if (error.message.includes('Invalid date format')) {
      return ERROR_CODES.INVALID_DATE_FORMAT;
    }
    if (error.message.includes('Invalid store name')) {
      return ERROR_CODES.STORE_NOT_FOUND;
    }
    if (error.message.includes('required')) {
      return ERROR_CODES.VALIDATION_ERROR;
    }
    if (error.message.includes('Authentication failed')) {
      return ERROR_CODES.LOGIN_FAILED;
    }
    if (error.message.includes('Navigation failed')) {
      return ERROR_CODES.NAVIGATION_ERROR;
    }
    if (error.message.includes('Download')) {
      return ERROR_CODES.DOWNLOAD_FAILED;
    }

    return ERROR_CODES.INTERNAL_ERROR;
  }

  /**
   * Determine HTTP status code based on error code
   * @param {string} errorCode - Error code
   * @returns {number} HTTP status code
   */
  determineStatusCode(errorCode) {
    switch (errorCode) {
      case ERROR_CODES.VALIDATION_ERROR:
      case ERROR_CODES.INVALID_DATE_FORMAT:
        return 400; // Bad Request
      case ERROR_CODES.LOGIN_FAILED:
        return 401; // Unauthorized
      case ERROR_CODES.STORE_NOT_FOUND:
        return 404; // Not Found
      case ERROR_CODES.DOWNLOAD_TIMEOUT:
        return 504; // Gateway Timeout
      case ERROR_CODES.PARSE_ERROR:
        return 422; // Unprocessable Entity
      default:
        return 500; // Internal Server Error
    }
  }
}

module.exports = { SalesController };
