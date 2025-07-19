/**
 * Demo Automation Test Script
 *
 * This script demonstrates the complete Loyverse automation flow with visible browser
 * for client video recording. It shows:
 * 1. Browser opening and login process
 * 2. Navigation to reports page
 * 3. Store selection and data export for each store
 * 4. CSV processing and final JSON response generation
 *
 * Usage: node test/demo-automation.js
 */

const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

// Import services
const BrowserService = require('../src/services/BrowserService');
const AuthService = require('../src/services/AuthService');
const NavigationService = require('../src/services/NavigationService');
const DataExtractionService = require('../src/services/DataExtractionService');
const CsvParserService = require('../src/services/CsvParserService');
const ValidationService = require('../src/services/ValidationService');
const AggregationService = require('../src/services/AggregationService');
const { Store } = require('../src/models/Store');
const { DateUtils } = require('../src/utils/dateUtils');
const { Logger } = require('../src/utils/logger');

class DemoAutomation {
  constructor() {
    this.logger = Logger;
    this.browserService = new BrowserService();
    this.authService = new AuthService();
    this.navigationService = new NavigationService();
    this.dataExtractionService = new DataExtractionService();
    this.csvParserService = new CsvParserService();
    this.validationService = new ValidationService();
    this.aggregationService = new AggregationService();

    this.stores = Store.getAllStores();
    this.extractionDate = DateUtils.formatDate(new Date());
    this.processedData = [];
    this.finalResponse = null;
  }

  /**
   * Initialize browser with visible window for demo
   */
  async initializeBrowser() {
    this.logger.info(
      '🎬 Starting Demo Automation - Browser will be visible for video recording'
    );

    // Configure browser for demo (visible window)
    const demoConfig = {
      headless: false, // Make browser visible
      devtools: false, // Don't open devtools
      slowMo: 2000, // Add 2 second delay between actions for better visibility
      defaultViewport: { width: 1920, height: 1080 },
      args: [
        '--start-maximized',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-extensions'
      ]
    };

    this.browser = await this.browserService.launchBrowser(demoConfig);
    this.page = await this.browserService.createPage(this.browser);

    this.logger.info('✅ Browser initialized - Window is now visible');
    return this.page;
  }

  /**
   * Demonstrate login process
   */
  async demonstrateLogin() {
    this.logger.info('🔐 Demonstrating Login Process...');

    try {
      // Navigate to login page
      await this.page.goto('https://r.loyverse.com', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      this.logger.info('📍 Navigated to Loyverse login page');

      // Add delay for video recording
      await this.page.waitForTimeout(3000);

      // Perform login
      const loginResult = await this.authService.login(this.page);

      if (loginResult.success) {
        this.logger.info(
          '✅ Login successful - Now logged into Loyverse dashboard'
        );
        await this.page.waitForTimeout(2000);
        return true;
      } else {
        throw new Error(`Login failed: ${loginResult.error}`);
      }
    } catch (error) {
      this.logger.error('❌ Login demonstration failed:', error);
      throw error;
    }
  }

  /**
   * Demonstrate navigation to reports page
   */
  async demonstrateReportsNavigation() {
    this.logger.info('📊 Demonstrating Navigation to Reports...');

    try {
      // Navigate to Sales by Item report
      const navigationResult =
        await this.navigationService.navigateToSalesByItem(this.page);

      if (navigationResult.success) {
        this.logger.info(
          '✅ Successfully navigated to Sales by Item report page'
        );
        await this.page.waitForTimeout(2000);
        return true;
      } else {
        throw new Error(`Navigation failed: ${navigationResult.error}`);
      }
    } catch (error) {
      this.logger.error('❌ Reports navigation failed:', error);
      throw error;
    }
  }

  /**
   * Demonstrate data extraction for all stores
   */
  async demonstrateDataExtraction() {
    this.logger.info('🏪 Demonstrating Data Extraction for All Stores...');

    const extractionResults = [];

    for (let i = 0; i < this.stores.length; i++) {
      const storeName = this.stores[i];
      this.logger.info(
        `\n📍 Processing Store ${i + 1}/${this.stores.length}: ${storeName}`
      );

      try {
        // Select store and extract data
        const storeResult = await this.extractStoreData(storeName, i + 1);
        extractionResults.push(storeResult);

        // Add delay between stores for better visibility
        await this.page.waitForTimeout(3000);
      } catch (error) {
        this.logger.error(
          `❌ Failed to extract data for store ${storeName}:`,
          error
        );
        extractionResults.push({
          store_name: storeName,
          success: false,
          error: error.message,
          items: [],
          items_count: 0,
          total_sales: 0
        });
      }
    }

    return extractionResults;
  }

  /**
   * Extract data for a single store
   */
  async extractStoreData(storeName, storeNumber) {
    this.logger.info(`🔄 Extracting data for: ${storeName}`);

    try {
      // Select store from dropdown
      await this.navigationService.selectStore(this.page, storeName);
      this.logger.info(`✅ Selected store: ${storeName}`);

      // Set date filter
      await this.navigationService.setDateFilter(
        this.page,
        this.extractionDate
      );
      this.logger.info(`📅 Set date filter to: ${this.extractionDate}`);

      // Download CSV
      const downloadResult = await this.navigationService.downloadCsv(
        this.page,
        storeName
      );

      if (downloadResult.success) {
        this.logger.info(`📥 CSV downloaded successfully for: ${storeName}`);

        // Process the downloaded CSV
        const processedData = await this.processCsvFile(
          downloadResult.filename,
          storeName
        );

        return {
          store_name: storeName,
          success: true,
          items_count: processedData.length,
          total_sales: this.calculateTotalSales(processedData),
          items: processedData
        };
      } else {
        throw new Error(`Download failed: ${downloadResult.error}`);
      }
    } catch (error) {
      this.logger.error(`❌ Store extraction failed for ${storeName}:`, error);
      throw error;
    }
  }

  /**
   * Process CSV file and return structured data
   */
  async processCsvFile(filename, storeName) {
    try {
      this.logger.info(`📄 Processing CSV file: ${filename}`);

      // Parse CSV file
      const csvData = await this.csvParserService.parseFile(filename);

      // Transform data
      const transformedData = csvData.map(row => ({
        date_sold: this.extractionDate,
        store_branch: storeName,
        item_name: row['Item Name'] || row.item_name || '',
        category: row['Category'] || row.category || '',
        items_sold: parseInt(row['Items Sold'] || row.items_sold || 0),
        gross_sales: parseFloat(row['Gross Sales'] || row.gross_sales || 0)
      }));

      // Validate data
      const validatedData =
        await this.validationService.validateSalesData(transformedData);

      this.logger.info(
        `✅ Processed ${validatedData.length} items for ${storeName}`
      );
      return validatedData;
    } catch (error) {
      this.logger.error(`❌ CSV processing failed for ${filename}:`, error);
      return [];
    }
  }

  /**
   * Calculate total sales for a store
   */
  calculateTotalSales(items) {
    return items.reduce((total, item) => total + (item.gross_sales || 0), 0);
  }

  /**
   * Generate final API response
   */
  async generateFinalResponse(extractionResults) {
    this.logger.info('📋 Generating Final API Response...');

    // Aggregate all data
    const aggregatedData =
      await this.aggregationService.aggregateStoreData(extractionResults);

    // Create final response structure as per PRD
    this.finalResponse = {
      success: true,
      data: {
        extraction_date: this.extractionDate,
        extraction_timestamp: new Date().toISOString(),
        total_stores_processed: extractionResults.length,
        successful_extractions: extractionResults.filter(r => r.success).length,
        failed_extractions: extractionResults.filter(r => !r.success).length,
        total_items_across_all_stores: extractionResults.reduce(
          (sum, store) => sum + store.items_count,
          0
        ),
        total_sales_across_all_stores: extractionResults.reduce(
          (sum, store) => sum + store.total_sales,
          0
        ),
        stores: extractionResults.map(store => ({
          store_name: store.store_name,
          success: store.success,
          items_count: store.items_count,
          total_sales: store.total_sales,
          items: store.items || []
        }))
      },
      metadata: {
        api_version: '1.0',
        extraction_method: 'puppeteer_automation',
        processing_time: new Date().toISOString(),
        data_format: 'loyverse_sales_by_item'
      }
    };

    // Save final response to processing folder
    await this.saveFinalResponse();

    return this.finalResponse;
  }

  /**
   * Save final response to processing folder
   */
  async saveFinalResponse() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `loyverse-automation-demo-result_${timestamp}.json`;
      const filePath = path.join(__dirname, '../processing', filename);

      await fs.writeFile(filePath, JSON.stringify(this.finalResponse, null, 2));

      this.logger.info(`💾 Final response saved to: processing/${filename}`);

      // Also save a summary file
      const summaryFilename = `demo-summary_${timestamp}.json`;
      const summaryPath = path.join(
        __dirname,
        '../processing',
        summaryFilename
      );

      const summary = {
        demo_completed: true,
        extraction_date: this.extractionDate,
        total_stores: this.stores.length,
        successful_extractions: this.finalResponse.data.successful_extractions,
        failed_extractions: this.finalResponse.data.failed_extractions,
        total_items: this.finalResponse.data.total_items_across_all_stores,
        total_sales: this.finalResponse.data.total_sales_across_all_stores,
        processing_timestamp: new Date().toISOString()
      };

      await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
      this.logger.info(
        `📊 Demo summary saved to: processing/${summaryFilename}`
      );
    } catch (error) {
      this.logger.error('❌ Failed to save final response:', error);
    }
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    this.logger.info('🧹 Cleaning up resources...');

    try {
      if (this.browser) {
        await this.browser.close();
        this.logger.info('✅ Browser closed');
      }
    } catch (error) {
      this.logger.error('❌ Cleanup error:', error);
    }
  }

  /**
   * Run the complete demo automation
   */
  async runDemo() {
    const startTime = Date.now();

    try {
      this.logger.info('🎬 STARTING LOYVERSE AUTOMATION DEMO');
      this.logger.info('='.repeat(50));

      // Step 1: Initialize browser
      await this.initializeBrowser();

      // Step 2: Demonstrate login
      await this.demonstrateLogin();

      // Step 3: Navigate to reports
      await this.demonstrateReportsNavigation();

      // Step 4: Extract data from all stores
      const extractionResults = await this.demonstrateDataExtraction();

      // Step 5: Generate final response
      const finalResponse = await this.generateFinalResponse(extractionResults);

      // Step 6: Display results
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      this.logger.info('\n' + '='.repeat(50));
      this.logger.info('🎉 DEMO COMPLETED SUCCESSFULLY!');
      this.logger.info('='.repeat(50));
      this.logger.info(`⏱️  Total Duration: ${duration.toFixed(2)} seconds`);
      this.logger.info(
        `📊 Stores Processed: ${finalResponse.data.total_stores_processed}`
      );
      this.logger.info(
        `✅ Successful: ${finalResponse.data.successful_extractions}`
      );
      this.logger.info(`❌ Failed: ${finalResponse.data.failed_extractions}`);
      this.logger.info(
        `📦 Total Items: ${finalResponse.data.total_items_across_all_stores}`
      );
      this.logger.info(
        `💰 Total Sales: $${finalResponse.data.total_sales_across_all_stores.toFixed(2)}`
      );
      this.logger.info('='.repeat(50));

      // Keep browser open for a few seconds to show final results
      this.logger.info(
        '🎬 Keeping browser open for 10 seconds to show final results...'
      );
      await this.page.waitForTimeout(10000);

      return finalResponse;
    } catch (error) {
      this.logger.error('❌ Demo failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  const demo = new DemoAutomation();

  demo
    .runDemo()
    .then(result => {
      console.log('\n🎉 Demo completed successfully!');
      console.log('📄 Final response saved to processing folder');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Demo failed:', error);
      process.exit(1);
    });
}

module.exports = DemoAutomation;
