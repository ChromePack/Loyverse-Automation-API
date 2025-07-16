const { DATE_FORMATS } = require('../constants');

/**
 * Date utility class
 * Provides date manipulation, formatting, and validation utilities
 */
class DateUtils {
  /**
   * Formats a date to API format (YYYY-MM-DD)
   * @param {Date|string} date - Date to format
   * @returns {string} Formatted date string
   */
  static formatToApiDate(date) {
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return '';
      }
      return dateObj.toISOString().split('T')[0];
    } catch (error) {
      return '';
    }
  }

  /**
   * Formats a date to display format (DD/MM/YYYY)
   * @param {Date|string} date - Date to format
   * @returns {string} Formatted date string
   */
  static formatToDisplayDate(date) {
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return '';
      }
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return '';
    }
  }

  /**
   * Formats a date to timestamp format (YYYY-MM-DD HH:mm:ss)
   * @param {Date|string} date - Date to format
   * @returns {string} Formatted timestamp string
   */
  static formatToTimestamp(date) {
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return '';
      }
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      const seconds = String(dateObj.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      return '';
    }
  }

  /**
   * Formats a date to ISO format
   * @param {Date|string} date - Date to format
   * @returns {string} ISO formatted date string
   */
  static formatToIso(date) {
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return '';
      }
      return dateObj.toISOString();
    } catch (error) {
      return '';
    }
  }

  /**
   * Validates if a string is a valid date in API format (YYYY-MM-DD)
   * @param {string} dateString - Date string to validate
   * @returns {boolean} True if valid API date format
   */
  static isValidApiDate(dateString) {
    if (!dateString || typeof dateString !== 'string') {
      return false;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
      return false;
    }

    const date = new Date(dateString);
    return (
      !isNaN(date.getTime()) && date.toISOString().split('T')[0] === dateString
    );
  }

  /**
   * Validates if a date is within a reasonable range
   * @param {Date|string} date - Date to validate
   * @param {Date} minDate - Minimum allowed date
   * @param {Date} maxDate - Maximum allowed date
   * @returns {boolean} True if date is within range
   */
  static isDateInRange(
    date,
    minDate = new Date('2020-01-01'),
    maxDate = new Date()
  ) {
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return false;
      }
      return dateObj >= minDate && dateObj <= maxDate;
    } catch (error) {
      return false;
    }
  }

  /**
   * Gets today's date in API format
   * @returns {string} Today's date in YYYY-MM-DD format
   */
  static getTodayApiDate() {
    return this.formatToApiDate(new Date());
  }

  /**
   * Gets yesterday's date in API format
   * @returns {string} Yesterday's date in YYYY-MM-DD format
   */
  static getYesterdayApiDate() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return this.formatToApiDate(yesterday);
  }

  /**
   * Gets a date N days ago in API format
   * @param {number} daysAgo - Number of days ago
   * @returns {string} Date N days ago in YYYY-MM-DD format
   */
  static getDaysAgoApiDate(daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return this.formatToApiDate(date);
  }

  /**
   * Parses a date string with fallback to default
   * @param {string} dateString - Date string to parse
   * @param {string} defaultDate - Default date if parsing fails
   * @returns {string} Parsed date or default date
   */
  static parseWithDefault(dateString, defaultDate = null) {
    if (!dateString) {
      return defaultDate || this.getTodayApiDate();
    }

    if (this.isValidApiDate(dateString)) {
      return dateString;
    }

    // Try to parse and format
    const formatted = this.formatToApiDate(dateString);
    if (formatted) {
      return formatted;
    }

    return defaultDate || this.getTodayApiDate();
  }

  /**
   * Calculates the difference between two dates in days
   * @param {Date|string} date1 - First date
   * @param {Date|string} date2 - Second date
   * @returns {number} Difference in days, NaN if invalid dates
   */
  static getDaysDifference(date1, date2) {
    try {
      const dateObj1 = new Date(date1);
      const dateObj2 = new Date(date2);

      if (isNaN(dateObj1.getTime()) || isNaN(dateObj2.getTime())) {
        return NaN;
      }

      const timeDiff = Math.abs(dateObj2.getTime() - dateObj1.getTime());
      return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    } catch (error) {
      return NaN;
    }
  }

  /**
   * Checks if a date is today
   * @param {Date|string} date - Date to check
   * @returns {boolean} True if date is today
   */
  static isToday(date) {
    try {
      const dateObj = new Date(date);
      const today = new Date();

      return dateObj.toDateString() === today.toDateString();
    } catch (error) {
      return false;
    }
  }

  /**
   * Checks if a date is in the past
   * @param {Date|string} date - Date to check
   * @returns {boolean} True if date is in the past
   */
  static isPastDate(date) {
    try {
      const dateObj = new Date(date);
      const now = new Date();

      return dateObj < now;
    } catch (error) {
      return false;
    }
  }

  /**
   * Checks if a date is in the future
   * @param {Date|string} date - Date to check
   * @returns {boolean} True if date is in the future
   */
  static isFutureDate(date) {
    try {
      const dateObj = new Date(date);
      const now = new Date();

      return dateObj > now;
    } catch (error) {
      return false;
    }
  }

  /**
   * Gets the start of day for a given date
   * @param {Date|string} date - Date to process
   * @returns {Date} Start of day date object
   */
  static getStartOfDay(date) {
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);
    return dateObj;
  }

  /**
   * Gets the end of day for a given date
   * @param {Date|string} date - Date to process
   * @returns {Date} End of day date object
   */
  static getEndOfDay(date) {
    const dateObj = new Date(date);
    dateObj.setHours(23, 59, 59, 999);
    return dateObj;
  }

  /**
   * Creates a date range array between two dates
   * @param {Date|string} startDate - Start date
   * @param {Date|string} endDate - End date
   * @returns {string[]} Array of dates in API format
   */
  static createDateRange(startDate, endDate) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const dates = [];

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return [];
      }

      const current = new Date(start);
      while (current <= end) {
        dates.push(this.formatToApiDate(current));
        current.setDate(current.getDate() + 1);
      }

      return dates;
    } catch (error) {
      return [];
    }
  }

  /**
   * Gets the current timestamp in milliseconds
   * @returns {number} Current timestamp
   */
  static getCurrentTimestamp() {
    return Date.now();
  }

  /**
   * Converts timestamp to API date format
   * @param {number} timestamp - Timestamp in milliseconds
   * @returns {string} Date in API format
   */
  static timestampToApiDate(timestamp) {
    try {
      const date = new Date(timestamp);
      return this.formatToApiDate(date);
    } catch (error) {
      return '';
    }
  }

  /**
   * Converts API date to timestamp
   * @param {string} apiDate - Date in API format
   * @returns {number} Timestamp in milliseconds, NaN if invalid
   */
  static apiDateToTimestamp(apiDate) {
    try {
      const date = new Date(apiDate);
      return date.getTime();
    } catch (error) {
      return NaN;
    }
  }
}

module.exports = {
  DateUtils
};
