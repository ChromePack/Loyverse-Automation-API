/**
 * Sales Item data model
 * Provides item structure definition, validation, and transformation utilities
 */

/**
 * Sales item validation and utility class
 */
class SalesItem {
  /**
   * Creates a new sales item instance
   * @param {Object} data - Raw item data
   * @returns {Object} Formatted sales item
   */
  static create(data = {}) {
    return {
      dateSold: this.formatDate(data.dateSold || data.date_sold),
      storeBranch: this.normalizeString(data.storeBranch || data.store_branch),
      itemName: this.normalizeString(data.itemName || data.item_name),
      category: this.normalizeString(data.category),
      itemsSold: this.parseInteger(data.itemsSold || data.items_sold),
      grossSales: this.parseFloat(data.grossSales || data.gross_sales)
    };
  }

  /**
   * Validates a sales item object
   * @param {Object} item - Sales item to validate
   * @returns {Object} Validation result
   */
  static validate(item) {
    const errors = [];
    const warnings = [];

    // Required field validation
    if (!item.dateSold) {
      errors.push('dateSold is required');
    } else if (!this.isValidDate(item.dateSold)) {
      errors.push('dateSold must be a valid date string (YYYY-MM-DD)');
    }

    if (!item.storeBranch || typeof item.storeBranch !== 'string') {
      errors.push('storeBranch is required and must be a string');
    }

    if (!item.itemName || typeof item.itemName !== 'string') {
      errors.push('itemName is required and must be a string');
    }

    if (!item.category || typeof item.category !== 'string') {
      warnings.push('category should be provided');
    }

    // Numeric field validation
    if (typeof item.itemsSold !== 'number' || item.itemsSold < 0) {
      errors.push('itemsSold must be a non-negative number');
    }

    if (typeof item.grossSales !== 'number' || item.grossSales < 0) {
      errors.push('grossSales must be a non-negative number');
    }

    // Business logic validation
    if (item.itemsSold === 0 && item.grossSales > 0) {
      warnings.push('grossSales is positive but itemsSold is zero');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Transforms raw CSV data to sales item format
   * @param {Object} csvRow - Raw CSV row data
   * @param {string} dateSold - Date when items were sold
   * @param {string} storeBranch - Store branch name
   * @returns {Object} Transformed sales item
   */
  static fromCsvRow(csvRow, dateSold, storeBranch) {
    return this.create({
      dateSold,
      storeBranch,
      itemName: csvRow['Item Name'] || csvRow.itemName,
      category: csvRow.Category || csvRow.category,
      itemsSold: csvRow['Items Sold'] || csvRow.itemsSold,
      grossSales: csvRow['Gross Sales'] || csvRow.grossSales
    });
  }

  /**
   * Converts sales item to API response format
   * @param {Object} item - Sales item object
   * @returns {Object} API response formatted item
   */
  static toApiResponse(item) {
    return {
      date_sold: item.dateSold,
      store_branch: item.storeBranch,
      item_name: item.itemName,
      category: item.category || 'Uncategorized',
      items_sold: item.itemsSold,
      gross_sales: item.grossSales
    };
  }

  /**
   * Aggregates multiple sales items
   * @param {Object[]} items - Array of sales items
   * @returns {Object} Aggregated data
   */
  static aggregate(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return {
        totalItems: 0,
        totalSales: 0,
        itemCount: 0,
        categories: []
      };
    }

    const categories = new Set();
    let totalItems = 0;
    let totalSales = 0;

    items.forEach(item => {
      totalItems += item.itemsSold || 0;
      totalSales += item.grossSales || 0;
      if (item.category) {
        categories.add(item.category);
      }
    });

    return {
      totalItems,
      totalSales: Math.round(totalSales * 100) / 100, // Round to 2 decimal places
      itemCount: items.length,
      categories: Array.from(categories).sort()
    };
  }

  /**
   * Filters items by criteria
   * @param {Object[]} items - Array of sales items
   * @param {Object} criteria - Filter criteria
   * @returns {Object[]} Filtered items
   */
  static filter(items, criteria = {}) {
    if (!Array.isArray(items)) {
      return [];
    }

    return items.filter(item => {
      // Date filter
      if (criteria.dateSold && item.dateSold !== criteria.dateSold) {
        return false;
      }

      // Store filter
      if (criteria.storeBranch && item.storeBranch !== criteria.storeBranch) {
        return false;
      }

      // Category filter
      if (criteria.category && item.category !== criteria.category) {
        return false;
      }

      // Minimum sales filter
      if (criteria.minSales && item.grossSales < criteria.minSales) {
        return false;
      }

      // Item name search
      if (criteria.itemNameSearch) {
        const searchTerm = criteria.itemNameSearch.toLowerCase();
        if (!item.itemName.toLowerCase().includes(searchTerm)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Sorts items by specified field
   * @param {Object[]} items - Array of sales items
   * @param {string} field - Field to sort by
   * @param {string} direction - Sort direction ('asc' or 'desc')
   * @returns {Object[]} Sorted items
   */
  static sort(items, field = 'grossSales', direction = 'desc') {
    if (!Array.isArray(items)) {
      return [];
    }

    return [...items].sort((a, b) => {
      const aValue = a[field];
      const bValue = b[field];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  }

  // Private utility methods

  /**
   * Normalizes string values
   * @param {any} value - Value to normalize
   * @returns {string} Normalized string
   */
  static normalizeString(value) {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value).trim();
  }

  /**
   * Parses integer values safely
   * @param {any} value - Value to parse
   * @returns {number} Parsed integer
   */
  static parseInteger(value) {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? 0 : Math.max(0, parsed);
  }

  /**
   * Parses float values safely
   * @param {any} value - Value to parse
   * @returns {number} Parsed float
   */
  static parseFloat(value) {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : Math.max(0, parsed);
  }

  /**
   * Formats date to YYYY-MM-DD format
   * @param {any} date - Date to format
   * @returns {string} Formatted date string
   */
  static formatDate(date) {
    if (!date) return '';

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
   * Validates date format (YYYY-MM-DD)
   * @param {string} dateString - Date string to validate
   * @returns {boolean} True if valid date format
   */
  static isValidDate(dateString) {
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
   * Create SalesItem from CSV data
   * @param {Object} csvData - Raw CSV data
   * @param {string} storeName - Store name
   * @param {string} date - Date of sale
   * @returns {SalesItem} New SalesItem instance
   */
  static fromCsvData(csvData, storeName, date) {
    return new SalesItem({
      date_sold: date,
      store_branch: storeName,
      item_name: csvData['Item Name'] || csvData.itemName || '',
      category: csvData['Category'] || csvData.category || '',
      items_sold: parseInt(csvData['Items Sold'] || csvData.itemsSold || 0),
      gross_sales: parseFloat(csvData['Gross Sales'] || csvData.grossSales || 0)
    });
  }

  /**
   * Convert SalesItem to API format
   * @returns {Object} API formatted object
   */
  toApiFormat() {
    return {
      date_sold: this.date_sold,
      store_branch: this.store_branch,
      item_name: this.item_name,
      category: this.category,
      items_sold: this.items_sold,
      gross_sales: this.gross_sales
    };
  }
}

module.exports = {
  SalesItem
};
