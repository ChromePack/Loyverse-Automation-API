const { Logger } = require('../utils/logger');
const { STORE_CONFIG } = require('../constants');

/**
 * AggregationService - Data aggregation and response formatting service
 *
 * Responsibilities:
 * - Store-level aggregation of sales data
 * - Total sales calculation per store
 * - Item count calculation per store
 * - Summary statistics generation
 * - Response format preparation for API endpoints
 * - Data grouping by store with metadata
 *
 * Following Clean Code principles:
 * - Single Responsibility: Only handles data aggregation and formatting
 * - Open/Closed: Extensible for new aggregation types
 * - Dependency Inversion: Depends on abstractions for logging
 */
class AggregationService {
  constructor() {
    this.logger = Logger;
  }

  /**
   * Aggregate data by store for API response
   * @param {Array<Object>} data - Raw data to aggregate
   * @param {Object} options - Aggregation options
   * @param {string} options.extractionDate - Date of extraction
   * @param {string} options.reportType - Type of report ('item', 'hourly', 'daily')
   * @param {Array<string>} options.requestedStores - Stores requested by user
   * @returns {Object} Aggregated data in API format
   */
  aggregateByStore(data, options = {}) {
    try {
      this.logger.info('Starting store-level aggregation', {
        dataCount: data.length,
        options
      });

      // Set default options
      const aggregationOptions = {
        extractionDate: new Date().toISOString().split('T')[0],
        reportType: 'item',
        requestedStores: ['all'],
        ...options
      };

      // Group data by store
      const groupedData = this.groupDataByStore(data);

      // Calculate store-level statistics
      const storeStats = this.calculateStoreStatistics(
        groupedData,
        aggregationOptions
      );

      // Format response according to API specification
      const formattedResponse = this.formatApiResponse(
        storeStats,
        aggregationOptions
      );

      this.logger.info('Store-level aggregation completed', {
        storeCount: formattedResponse.data.stores.length,
        totalItems: formattedResponse.data.stores.reduce(
          (sum, store) => sum + store.items_count,
          0
        ),
        totalSales: formattedResponse.data.stores.reduce(
          (sum, store) => sum + store.total_sales,
          0
        )
      });

      return formattedResponse;
    } catch (error) {
      this.logger.error('Store-level aggregation failed', {
        error: error.message
      });
      throw new Error(`Aggregation failed: ${error.message}`);
    }
  }

  /**
   * Group data by store branch
   * @param {Array<Object>} data - Data to group
   * @returns {Object} Data grouped by store
   */
  groupDataByStore(data) {
    const grouped = {};

    data.forEach(record => {
      const storeName =
        record.storeBranch || record.store_branch || 'Unknown Store';

      if (!grouped[storeName]) {
        grouped[storeName] = [];
      }

      grouped[storeName].push(record);
    });

    this.logger.debug('Data grouped by store', {
      storeCount: Object.keys(grouped).length,
      stores: Object.keys(grouped)
    });

    return grouped;
  }

  /**
   * Calculate statistics for each store
   * @param {Object} groupedData - Data grouped by store
   * @param {Object} options - Aggregation options
   * @returns {Object} Store statistics
   */
  calculateStoreStatistics(groupedData, options) {
    const storeStats = {};

    Object.keys(groupedData).forEach(storeName => {
      const storeData = groupedData[storeName];
      const stats = this.calculateSingleStoreStats(storeData, options);

      storeStats[storeName] = {
        ...stats,
        items: storeData
      };
    });

    return storeStats;
  }

  /**
   * Calculate statistics for a single store
   * @param {Array<Object>} storeData - Data for a single store
   * @param {Object} options - Aggregation options
   * @returns {Object} Single store statistics
   */
  calculateSingleStoreStats(storeData, options) {
    const stats = {
      items_count: storeData.length,
      total_sales: 0,
      total_items_sold: 0,
      average_sale_amount: 0,
      categories: new Set(),
      date_range: {
        start: null,
        end: null
      }
    };

    // Calculate totals based on report type
    if (options.reportType === 'item') {
      stats.total_sales = storeData.reduce((sum, item) => {
        const sales = item.grossSales || item.gross_sales || 0;
        return sum + Number(sales);
      }, 0);

      stats.total_items_sold = storeData.reduce((sum, item) => {
        const quantity = item.itemsSold || item.items_sold || 0;
        return sum + Number(quantity);
      }, 0);

      // Collect categories
      storeData.forEach(item => {
        if (item.category) {
          stats.categories.add(item.category);
        }
      });
    } else if (options.reportType === 'hourly') {
      stats.total_sales = storeData.reduce((sum, record) => {
        const sales = record['Net sales'] || record.netSales || 0;
        return sum + Number(sales);
      }, 0);

      stats.total_refunds = storeData.reduce((sum, record) => {
        const refunds = record['Refunds'] || record.refunds || 0;
        return sum + Number(refunds);
      }, 0);

      stats.total_discounts = storeData.reduce((sum, record) => {
        const discounts = record['Discounts'] || record.discounts || 0;
        return sum + Number(discounts);
      }, 0);
    }

    // Calculate average
    stats.average_sale_amount =
      stats.items_count > 0 ? stats.total_sales / stats.items_count : 0;

    // Convert categories Set to Array
    stats.categories = Array.from(stats.categories);

    // Find date range
    const dates = storeData
      .map(item => item.dateSold || item.date_sold)
      .filter(date => date)
      .sort();

    if (dates.length > 0) {
      stats.date_range.start = dates[0];
      stats.date_range.end = dates[dates.length - 1];
    }

    return stats;
  }

  /**
   * Format response according to API specification
   * @param {Object} storeStats - Store statistics
   * @param {Object} options - Aggregation options
   * @returns {Object} Formatted API response
   */
  formatApiResponse(storeStats, options) {
    const stores = Object.keys(storeStats).map(storeName => {
      const stats = storeStats[storeName];

      return {
        store_name: storeName,
        items_count: stats.items_count,
        total_sales: Number(stats.total_sales.toFixed(2)),
        total_items_sold: stats.total_items_sold || 0,
        average_sale_amount: Number(stats.average_sale_amount.toFixed(2)),
        categories: stats.categories || [],
        date_range: stats.date_range,
        items: this.formatItemsForResponse(stats.items, options)
      };
    });

    // Sort stores by name for consistent output
    stores.sort((a, b) => a.store_name.localeCompare(b.store_name));

    return {
      success: true,
      data: {
        extraction_date: options.extractionDate,
        report_type: options.reportType,
        stores_count: stores.length,
        total_items: stores.reduce((sum, store) => sum + store.items_count, 0),
        total_sales: stores.reduce((sum, store) => sum + store.total_sales, 0),
        stores: stores
      },
      metadata: {
        processed_at: new Date().toISOString(),
        processing_time_ms: Date.now() - (options.startTime || Date.now()),
        requested_stores: options.requestedStores
      }
    };
  }

  /**
   * Format items for API response
   * @param {Array<Object>} items - Items to format
   * @param {Object} options - Formatting options
   * @returns {Array<Object>} Formatted items
   */
  formatItemsForResponse(items, options) {
    return items.map(item => {
      if (options.reportType === 'item') {
        return {
          date_sold: item.dateSold || item.date_sold,
          store_branch: item.storeBranch || item.store_branch,
          item_name: item.itemName || item.item_name,
          category: item.category,
          items_sold: item.itemsSold || item.items_sold || 0,
          gross_sales: Number(
            (item.grossSales || item.gross_sales || 0).toFixed(2)
          )
        };
      } else if (options.reportType === 'hourly') {
        return {
          time: item.Time || item.time,
          date_sold: item.dateSold || item.date_sold,
          store_branch: item.storeBranch || item.store_branch,
          gross_sales: Number(
            (item['Gross sales'] || item.grossSales || 0).toFixed(2)
          ),
          net_sales: Number(
            (item['Net sales'] || item.netSales || 0).toFixed(2)
          ),
          refunds: Number((item['Refunds'] || item.refunds || 0).toFixed(2)),
          discounts: Number(
            (item['Discounts'] || item.discounts || 0).toFixed(2)
          ),
          taxes: Number((item['Taxes'] || item.taxes || 0).toFixed(2))
        };
      }

      return item;
    });
  }

  /**
   * Generate summary statistics across all stores
   * @param {Object} aggregatedData - Aggregated data
   * @returns {Object} Summary statistics
   */
  generateSummaryStatistics(aggregatedData) {
    const summary = {
      total_stores: aggregatedData.data.stores_count,
      total_items: aggregatedData.data.total_items,
      total_sales: aggregatedData.data.total_sales,
      average_sales_per_store: 0,
      average_items_per_store: 0,
      top_performing_stores: [],
      store_performance: {}
    };

    if (summary.total_stores > 0) {
      summary.average_sales_per_store = Number(
        (summary.total_sales / summary.total_stores).toFixed(2)
      );
      summary.average_items_per_store = Math.round(
        summary.total_items / summary.total_stores
      );
    }

    // Calculate store performance
    aggregatedData.data.stores.forEach(store => {
      summary.store_performance[store.store_name] = {
        sales_percentage:
          summary.total_sales > 0
            ? Number(
                ((store.total_sales / summary.total_sales) * 100).toFixed(2)
              )
            : 0,
        items_percentage:
          summary.total_items > 0
            ? Number(
                ((store.items_count / summary.total_items) * 100).toFixed(2)
              )
            : 0
      };
    });

    // Find top performing stores
    summary.top_performing_stores = aggregatedData.data.stores
      .sort((a, b) => b.total_sales - a.total_sales)
      .slice(0, 5)
      .map(store => ({
        store_name: store.store_name,
        total_sales: store.total_sales,
        items_count: store.items_count
      }));

    return summary;
  }

  /**
   * Filter stores based on request
   * @param {Object} aggregatedData - Aggregated data
   * @param {Array<string>} requestedStores - Requested store names
   * @returns {Object} Filtered aggregated data
   */
  filterStoresByRequest(aggregatedData, requestedStores) {
    if (!requestedStores || requestedStores.includes('all')) {
      return aggregatedData;
    }

    const filteredStores = aggregatedData.data.stores.filter(store =>
      requestedStores.includes(store.store_name)
    );

    return {
      ...aggregatedData,
      data: {
        ...aggregatedData.data,
        stores_count: filteredStores.length,
        total_items: filteredStores.reduce(
          (sum, store) => sum + store.items_count,
          0
        ),
        total_sales: filteredStores.reduce(
          (sum, store) => sum + store.total_sales,
          0
        ),
        stores: filteredStores
      }
    };
  }

  /**
   * Memory-efficient streaming aggregation for large datasets
   * @param {Array<Object>} data - Data to aggregate
   * @param {Object} options - Aggregation options
   * @returns {Object} Aggregated data
   */
  streamingAggregation(data, options = {}) {
    this.logger.info('Starting streaming aggregation', {
      dataCount: data.length
    });

    const storeAccumulators = {};
    const chunkSize = 1000; // Process in chunks

    // Process data in chunks to manage memory
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);

      chunk.forEach(record => {
        const storeName =
          record.storeBranch || record.store_branch || 'Unknown Store';

        if (!storeAccumulators[storeName]) {
          storeAccumulators[storeName] = {
            items: [],
            totalSales: 0,
            totalItems: 0,
            itemCount: 0
          };
        }

        const accumulator = storeAccumulators[storeName];
        accumulator.items.push(record);
        accumulator.itemCount++;

        // Accumulate sales
        const sales =
          record.grossSales || record.gross_sales || record['Net sales'] || 0;
        accumulator.totalSales += Number(sales);

        // Accumulate item quantities
        const quantity = record.itemsSold || record.items_sold || 1;
        accumulator.totalItems += Number(quantity);
      });

      // Log progress for large datasets
      if (i % (chunkSize * 10) === 0) {
        this.logger.debug('Streaming aggregation progress', {
          processed: i + chunkSize,
          total: data.length,
          percentage: (((i + chunkSize) / data.length) * 100).toFixed(2) + '%'
        });
      }
    }

    // Convert accumulators to final format
    const storeStats = {};
    Object.keys(storeAccumulators).forEach(storeName => {
      const acc = storeAccumulators[storeName];
      storeStats[storeName] = {
        items_count: acc.itemCount,
        total_sales: acc.totalSales,
        total_items_sold: acc.totalItems,
        average_sale_amount:
          acc.itemCount > 0 ? acc.totalSales / acc.itemCount : 0,
        categories: [],
        date_range: { start: null, end: null },
        items: acc.items
      };
    });

    return this.formatApiResponse(storeStats, options);
  }

  /**
   * Get aggregation performance metrics
   * @param {number} startTime - Start time of aggregation
   * @param {number} dataCount - Number of records processed
   * @returns {Object} Performance metrics
   */
  getPerformanceMetrics(startTime, dataCount) {
    const endTime = Date.now();
    const processingTime = endTime - startTime;

    return {
      processing_time_ms: processingTime,
      records_processed: dataCount,
      records_per_second:
        dataCount > 0 ? Math.round(dataCount / (processingTime / 1000)) : 0,
      memory_usage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = AggregationService;
