/**
 * Application constants
 * Centralized location for all application constants
 */

/**
 * CSV column mappings for data transformation
 */
const CSV_COLUMNS = {
  ITEM_NAME: 'Item Name',
  CATEGORY: 'Category',
  ITEMS_SOLD: 'Items Sold',
  GROSS_SALES: 'Gross Sales'
};

/**
 * CSV column mapping for transformation
 */
const CSV_COLUMN_MAPPING = {
  [CSV_COLUMNS.ITEM_NAME]: 'itemName',
  [CSV_COLUMNS.CATEGORY]: 'category',
  [CSV_COLUMNS.ITEMS_SOLD]: 'itemsSold',
  [CSV_COLUMNS.GROSS_SALES]: 'grossSales'
};

/**
 * Error codes and messages
 */
const ERROR_CODES = {
  // Authentication errors
  LOGIN_FAILED: 'LOGIN_FAILED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // Navigation errors
  NAVIGATION_ERROR: 'NAVIGATION_ERROR',
  ELEMENT_NOT_FOUND: 'ELEMENT_NOT_FOUND',
  PAGE_LOAD_TIMEOUT: 'PAGE_LOAD_TIMEOUT',

  // Download errors
  DOWNLOAD_TIMEOUT: 'DOWNLOAD_TIMEOUT',
  DOWNLOAD_FAILED: 'DOWNLOAD_FAILED',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',

  // Data processing errors
  PARSE_ERROR: 'PARSE_ERROR',
  INVALID_CSV_FORMAT: 'INVALID_CSV_FORMAT',
  DATA_VALIDATION_ERROR: 'DATA_VALIDATION_ERROR',

  // Store errors
  STORE_NOT_FOUND: 'STORE_NOT_FOUND',
  INVALID_STORE_SELECTION: 'INVALID_STORE_SELECTION',

  // General errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED'
};

/**
 * Error messages corresponding to error codes
 */
const ERROR_MESSAGES = {
  [ERROR_CODES.LOGIN_FAILED]: 'Failed to login to Loyverse system',
  [ERROR_CODES.INVALID_CREDENTIALS]: 'Invalid username or password',
  [ERROR_CODES.SESSION_EXPIRED]: 'Session has expired, please login again',

  [ERROR_CODES.NAVIGATION_ERROR]: 'Unable to navigate to the requested page',
  [ERROR_CODES.ELEMENT_NOT_FOUND]: 'Required page element not found',
  [ERROR_CODES.PAGE_LOAD_TIMEOUT]: 'Page failed to load within timeout period',

  [ERROR_CODES.DOWNLOAD_TIMEOUT]: 'CSV download timed out',
  [ERROR_CODES.DOWNLOAD_FAILED]: 'Failed to download CSV file',
  [ERROR_CODES.FILE_NOT_FOUND]: 'Downloaded file not found',

  [ERROR_CODES.PARSE_ERROR]: 'Failed to parse CSV data',
  [ERROR_CODES.INVALID_CSV_FORMAT]: 'CSV file format is invalid',
  [ERROR_CODES.DATA_VALIDATION_ERROR]: 'Data validation failed',

  [ERROR_CODES.STORE_NOT_FOUND]: 'Requested store not found',
  [ERROR_CODES.INVALID_STORE_SELECTION]: 'Invalid store selection',

  [ERROR_CODES.INTERNAL_SERVER_ERROR]: 'An internal server error occurred',
  [ERROR_CODES.VALIDATION_ERROR]: 'Request validation failed',
  [ERROR_CODES.NOT_FOUND]: 'Resource not found',
  [ERROR_CODES.NOT_IMPLEMENTED]: 'Feature not implemented'
};

/**
 * HTTP status codes for different error types
 */
const HTTP_STATUS_CODES = {
  [ERROR_CODES.LOGIN_FAILED]: 401,
  [ERROR_CODES.INVALID_CREDENTIALS]: 401,
  [ERROR_CODES.SESSION_EXPIRED]: 401,

  [ERROR_CODES.NAVIGATION_ERROR]: 500,
  [ERROR_CODES.ELEMENT_NOT_FOUND]: 500,
  [ERROR_CODES.PAGE_LOAD_TIMEOUT]: 504,

  [ERROR_CODES.DOWNLOAD_TIMEOUT]: 504,
  [ERROR_CODES.DOWNLOAD_FAILED]: 500,
  [ERROR_CODES.FILE_NOT_FOUND]: 404,

  [ERROR_CODES.PARSE_ERROR]: 422,
  [ERROR_CODES.INVALID_CSV_FORMAT]: 422,
  [ERROR_CODES.DATA_VALIDATION_ERROR]: 422,

  [ERROR_CODES.STORE_NOT_FOUND]: 404,
  [ERROR_CODES.INVALID_STORE_SELECTION]: 400,

  [ERROR_CODES.INTERNAL_SERVER_ERROR]: 500,
  [ERROR_CODES.VALIDATION_ERROR]: 400,
  [ERROR_CODES.NOT_FOUND]: 404,
  [ERROR_CODES.NOT_IMPLEMENTED]: 501
};

/**
 * Timeout configurations (in milliseconds)
 */
const TIMEOUTS = {
  DEFAULT_TIMEOUT: 30000,
  DOWNLOAD_TIMEOUT: 30000,
  NAVIGATION_TIMEOUT: 30000,
  ELEMENT_WAIT_TIMEOUT: 10000,
  PAGE_LOAD_TIMEOUT: 30000,
  REQUEST_TIMEOUT: 60000,
  RETRY_DELAY: 5000,
  GRACEFUL_SHUTDOWN_TIMEOUT: 10000
};

/**
 * Retry configurations
 */
const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000,
  BACKOFF_MULTIPLIER: 2,
  MAX_RETRY_DELAY: 30000
};

/**
 * Puppeteer selectors for automation
 */
const SELECTORS = {
  // Login page selectors
  LOGIN: {
    USERNAME_INPUT: 'input[name="username"], input[type="email"]',
    PASSWORD_INPUT: 'input[name="password"], input[type="password"]',
    LOGIN_BUTTON: 'button[type="submit"], input[type="submit"]',
    ERROR_MESSAGE: '.error-message, .alert-danger, .text-danger'
  },

  // Navigation selectors
  NAVIGATION: {
    REPORTS_MENU: 'nav a[href*="reports"], .nav-item:contains("Reports")',
    SALES_BY_ITEM:
      'a[href*="sales-by-item"], .menu-item:contains("Sales by Item")'
  },

  // Report page selectors
  REPORT: {
    STORE_DROPDOWN: 'select[name="store"], .store-selector',
    DATE_PICKER: 'input[type="date"], .date-picker',
    EXPORT_BUTTON:
      'button:contains("Export"), .export-btn, button[title*="export"]',
    DOWNLOAD_LINK: 'a[href*=".csv"], .download-link'
  }
};

/**
 * File system constants
 */
const FILE_SYSTEM = {
  CSV_EXTENSION: '.csv',
  TEMP_PREFIX: 'loyverse_temp_',
  ENCODING: 'utf8',
  // 10MB
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  // 5 seconds
  CLEANUP_DELAY: 5000
};

/**
 * Date format constants
 */
const DATE_FORMATS = {
  API_DATE_FORMAT: 'YYYY-MM-DD',
  DISPLAY_DATE_FORMAT: 'DD/MM/YYYY',
  TIMESTAMP_FORMAT: 'YYYY-MM-DD HH:mm:ss',
  ISO_FORMAT: 'YYYY-MM-DDTHH:mm:ss.sssZ'
};

/**
 * Validation constants
 */
const VALIDATION = {
  MIN_ITEMS_SOLD: 0,
  MAX_ITEMS_SOLD: 999999,
  MIN_GROSS_SALES: 0,
  MAX_GROSS_SALES: 999999.99,
  MAX_ITEM_NAME_LENGTH: 255,
  MAX_CATEGORY_NAME_LENGTH: 100,
  MAX_STORE_NAME_LENGTH: 100
};

/**
 * API response constants
 */
const API_RESPONSE = {
  SUCCESS_STATUS: 'success',
  ERROR_STATUS: 'error',
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 1000
};

/**
 * Logging levels
 */
const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

/**
 * Application metadata
 */
const APP_METADATA = {
  NAME: 'Loyverse Automation API',
  VERSION: '1.0.0',
  DESCRIPTION: 'API for automating Loyverse POS data extraction',
  AUTHOR: 'ChromePackDev'
};

module.exports = {
  CSV_COLUMNS,
  CSV_COLUMN_MAPPING,
  ERROR_CODES,
  ERROR_MESSAGES,
  HTTP_STATUS_CODES,
  TIMEOUTS,
  RETRY_CONFIG,
  SELECTORS,
  FILE_SYSTEM,
  DATE_FORMATS,
  VALIDATION,
  API_RESPONSE,
  LOG_LEVELS,
  APP_METADATA
};
