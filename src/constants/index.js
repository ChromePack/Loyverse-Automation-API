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
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_DATE_FORMAT: 'INVALID_DATE_FORMAT',
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
  [ERROR_CODES.INTERNAL_ERROR]: 'An internal error occurred',
  [ERROR_CODES.VALIDATION_ERROR]: 'Request validation failed',
  [ERROR_CODES.INVALID_DATE_FORMAT]: 'Invalid date format provided',
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
  [ERROR_CODES.INTERNAL_ERROR]: 500,
  [ERROR_CODES.VALIDATION_ERROR]: 400,
  [ERROR_CODES.INVALID_DATE_FORMAT]: 400,
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
 * Puppeteer selectors for automation - Updated with actual Loyverse DOM structure
 */
const SELECTORS = {
  // Loyverse login page selectors (based on actual DOM structure)
  LOGIN: {
    EMAIL_INPUT: 'input[formcontrolname="username"]',
    PASSWORD_INPUT: 'input[formcontrolname="password"]',
    LOGIN_BUTTON: 'button[type="submit"]',
    REMEMBER_ME_CHECKBOX: 'input[type="checkbox"]',
    ERROR_MESSAGE: '.form-error.login-error',
    LOGIN_FORM: 'form[name="loginForm"]',
    LOADING_INDICATOR: '.mat-spinner, .loading, [data-loading]'
  },

  // Dashboard and authentication verification selectors
  DASHBOARD: {
    INDICATOR: '[data-testid="dashboard"], .dashboard, .main-content',
    USER_MENU: '.user-menu, .profile-menu',
    LOGOUT_BUTTON:
      '[data-testid="logout"], button[title="Logout"], .logout-button, .user-menu .logout'
  },

  // Sales report page selectors (based on actual DOM structure)
  SALES_REPORT: {
    // Date filter selectors
    DATE_FILTER_BUTTON: '#calendar-open-button, .calendar-label-btn',
    DATE_FILTER_DROPDOWN: '.calendar-view, .custom-theme',
    DATE_TODAY_BUTTON: '#calendar-today-button, .btnLi[ng-click*="today"]',
    DATE_YESTERDAY_BUTTON:
      '#calendar-yesterday-button, .btnLi[ng-click*="yesterday"]',
    DATE_THIS_WEEK_BUTTON: '#calendar-week-button, .btnLi[ng-click*="week"]',
    DATE_LAST_WEEK_BUTTON:
      '#calendar-last_week-button, .btnLi[ng-click*="lastWeek"]',
    DATE_THIS_MONTH_BUTTON: '#calendar-month-button, .btnLi[ng-click*="month"]',
    DATE_LAST_MONTH_BUTTON:
      '#calendar-last_month-button, .btnLi[ng-click*="lastMonth"]',
    DATE_CANCEL_BUTTON:
      '#calendar-cancel-button, .buttons-block-bottom button[ng-click*="cancel"]',
    DATE_DONE_BUTTON:
      '#calendar-done-button, .buttons-block-bottom button[ng-click*="apply"]',

    // Store/Outlet filter selectors
    STORE_FILTER_BUTTON:
      '#firstDrop button, .reportFilters button[id="dropdownMenu1"]',
    STORE_FILTER_MENU:
      '#menu_container_10 md-menu-content, .md-menu-content-filter',
    ALL_STORES_CHECKBOX:
      'md-checkbox[aria-label="All stores"], .listCheckbox md-checkbox:first-child',
    STORE_CHECKBOX_BY_LABEL: storeName =>
      `md-checkbox[aria-label="${storeName}"]`,
    STORE_CHECKBOX_BY_ID: storeId =>
      `.listCheckbox[id="${storeId}"] md-checkbox`,

    // Employee filter selectors
    EMPLOYEE_FILTER_BUTTON:
      '#secondDrop button, .reportFilters button[id="merchants_filter-dropdown-button"]',
    EMPLOYEE_FILTER_MENU:
      '#menu_container_7 md-menu-content, .md-menu-content-filter',
    ALL_EMPLOYEES_CHECKBOX:
      'md-checkbox[aria-label="All employees"], #merchants_filter-all_merchants-checkbox',

    // Export functionality
    EXPORT_BUTTON: '#export-button, .export-button, button.impExpBtn',
    EXPORT_LOADING: '.export-loading, .md-progress-circular',

    // Page elements
    FILTERS_CONTAINER: '#filters, .filters',
    REPORT_CONTAINER: '.report-container, .report-content',
    LOADING_INDICATOR: '.loading, .md-progress-circular, .spinner'
  },

  // Navigation selectors for reports (fallback if direct URL navigation fails)
  NAVIGATION: {
    REPORTS_MENU: 'nav a[href*="reports"], .nav-item:contains("Reports")',
    SALES_BY_ITEM:
      'a[href*="sales-by-item"], .menu-item:contains("Sales by Item")',
    SALES_SUMMARY: 'a[href*="sales"], .menu-item:contains("Sales")'
  },

  // General page selectors
  GENERAL: {
    PAGE_LOADER: '.page-loader, .loading-overlay, .md-progress-circular',
    ERROR_MESSAGE: '.error-message, .alert-danger, .md-toast',
    SUCCESS_MESSAGE: '.success-message, .alert-success, .md-toast'
  }
};

/**
 * Loyverse specific URLs and endpoints
 */
const LOYVERSE_URLS = {
  BASE_URL: 'https://r.loyverse.com',
  LOGIN_URL: 'https://loyverse.com/en/login',
  DASHBOARD_URL: 'https://r.loyverse.com/dashboard',
  SALES_REPORT_BASE: 'https://r.loyverse.com/dashboard/#/report/sales',

  // Sales report URL with default parameters
  SALES_REPORT_URL: (params = {}) => {
    const defaultParams = {
      page: 0,
      limit: 10,
      group: 'hour',
      serverChartType: 'saleSum',
      periodName: 'day',
      periodLength: '1d',
      arg: 0,
      fromHour: 0,
      toHour: 0,
      outletsIds: 'all',
      merchantsIds: 'all'
    };

    const mergedParams = { ...defaultParams, ...params };
    const queryString = Object.entries(mergedParams)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

    return `${LOYVERSE_URLS.SALES_REPORT_BASE}?${queryString}`;
  }
};

/**
 * Store configuration - Updated with actual store names from DOM
 */
const STORE_CONFIG = {
  STORE_NAMES: [
    'Apung Iska - MAT',
    'Apung Iska - MG',
    'Apung Iska - Main',
    'Apung Iska - SV',
    'Capas',
    'Central-K'
  ],

  // Store IDs from DOM (for checkbox selection)
  STORE_IDS: {
    'Apung Iska - MAT': '1853035',
    'Apung Iska - MG': '171895',
    'Apung Iska - Main': '1271966',
    'Apung Iska - SV': '1271967',
    Capas: '2770518',
    'Central-K': '2640464'
  },

  DEFAULT_STORE: 'Apung Iska - MAT',
  ALL_STORES_OPTION: 'All stores'
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
  ISO_FORMAT: 'YYYY-MM-DDTHH:mm:ss.sssZ',
  URL_DATE_FORMAT: 'YYYY-MM-DD HH:mm:ss' // For URL parameters
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
  LOYVERSE_URLS,
  STORE_CONFIG,
  FILE_SYSTEM,
  DATE_FORMATS,
  VALIDATION,
  API_RESPONSE,
  LOG_LEVELS,
  APP_METADATA
};
