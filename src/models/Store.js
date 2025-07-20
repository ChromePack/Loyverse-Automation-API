/**
 * Store data model and configuration
 * Provides store definitions, validation, and utility functions
 */

/**
 * Store configuration array
 * Contains all available stores in the Loyverse system
 */
const STORES = [
  'Apung Iska - MAT',
  'Apung Iska - MG',
  'Apung Iska - Main',
  'Apung Iska - SV',
  'Capas',
  'Central-K'
];

/**
 * Store validation and utility class
 */
class Store {
  /**
   * Validates if a store name exists in the configuration
   * @param {string} storeName - Name of the store to validate
   * @returns {boolean} True if store exists, false otherwise
   */
  static isValidStore(storeName) {
    if (!storeName || typeof storeName !== 'string') {
      return false;
    }
    return STORES.includes(storeName.trim());
  }

  /**
   * Gets all available store names
   * @returns {string[]} Array of all store names
   */
  static getAllStores() {
    return [...STORES];
  }

  /**
   * Gets the total number of stores
   * @returns {number} Total number of stores
   */
  static getStoreCount() {
    return STORES.length;
  }

  /**
   * Normalizes store name by trimming whitespace
   * @param {string} storeName - Store name to normalize
   * @returns {string} Normalized store name
   */
  static normalizeStoreName(storeName) {
    if (!storeName || typeof storeName !== 'string') {
      return '';
    }
    return storeName.trim();
  }

  /**
   * Finds stores matching a partial name (case-insensitive)
   * @param {string} partialName - Partial store name to search for
   * @returns {string[]} Array of matching store names
   */
  static findStoresByPartialName(partialName) {
    if (!partialName || typeof partialName !== 'string') {
      return [];
    }

    const searchTerm = partialName.toLowerCase().trim();
    return STORES.filter(store => store.toLowerCase().includes(searchTerm));
  }

  /**
   * Gets store index in the configuration array
   * @param {string} storeName - Name of the store
   * @returns {number} Index of the store, -1 if not found
   */
  static getStoreIndex(storeName) {
    if (!storeName || typeof storeName !== 'string') {
      return -1;
    }
    return STORES.indexOf(storeName.trim());
  }

  /**
   * Creates a store identifier from store name
   * @param {string} storeName - Name of the store
   * @returns {string} Store identifier (lowercase, no spaces)
   */
  static createStoreIdentifier(storeName) {
    if (!storeName || typeof storeName !== 'string') {
      return '';
    }
    return storeName
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_-]/g, '');
  }

  /**
   * Validates store selection request
   * @param {string|string[]} stores - Store name(s) to validate
   * @returns {Object} Validation result with valid stores and errors
   */
  static validateStoreSelection(stores) {
    const result = {
      valid: [],
      invalid: [],
      isValid: true
    };

    // Handle 'all' keyword
    if (stores === 'all' || (Array.isArray(stores) && stores.includes('all'))) {
      result.valid = this.getAllStores();
      return result;
    }

    // Convert to array if single store
    const storeArray = Array.isArray(stores) ? stores : [stores];

    storeArray.forEach(store => {
      if (this.isValidStore(store)) {
        result.valid.push(this.normalizeStoreName(store));
      } else {
        result.invalid.push(store);
        result.isValid = false;
      }
    });

    return result;
  }

  /**
   * Creates a store summary object
   * @param {string} storeName - Name of the store
   * @param {number} itemsCount - Number of items sold
   * @param {number} totalSales - Total sales amount
   * @returns {Object} Store summary object
   */
  static createStoreSummary(storeName, itemsCount = 0, totalSales = 0) {
    return {
      store_name: this.normalizeStoreName(storeName),
      items_count: Number(itemsCount) || 0,
      total_sales: Number(totalSales) || 0,
      store_identifier: this.createStoreIdentifier(storeName),
      items: []
    };
  }

  /**
   * Validates store summary data
   * @param {Object} summary - Store summary to validate
   * @returns {boolean} True if valid, false otherwise
   */
  static isValidStoreSummary(summary) {
    if (!summary || typeof summary !== 'object') {
      return false;
    }

    const requiredFields = ['store_name', 'items_count', 'total_sales'];
    return requiredFields.every(
      field =>
        Object.prototype.hasOwnProperty.call(summary, field) &&
        summary[field] !== null &&
        summary[field] !== undefined
    );
  }
}

module.exports = {
  STORES,
  Store
};
