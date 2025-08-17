#!/usr/bin/env node

/**
 * Test script to verify browser launch functionality
 * This script tests the BrowserService in different environments
 */

const BrowserService = require('../src/services/BrowserService');
const { Logger } = require('../src/utils/logger');

async function testBrowserLaunch() {
  console.log('🧪 Testing browser launch functionality...\n');
  
  const browserService = new BrowserService();
  let testsPassed = 0;
  let totalTests = 0;
  
  try {
    // Test 1: Browser Launch
    totalTests++;
    console.log('Test 1: Browser Launch');
    console.log('─'.repeat(50));
    
    try {
      await browserService.launch();
      console.log('✅ Browser launched successfully');
      testsPassed++;
    } catch (error) {
      console.log('❌ Browser launch failed:', error.message);
    }
    
    // Test 2: Page Creation
    totalTests++;
    console.log('\nTest 2: Page Creation');
    console.log('─'.repeat(50));
    
    try {
      const page = await browserService.createPage('test-page');
      console.log('✅ Page created successfully');
      console.log(`📄 Page URL: ${page.url()}`);
      testsPassed++;
    } catch (error) {
      console.log('❌ Page creation failed:', error.message);
    }
    
    // Test 3: Navigation Test
    totalTests++;
    console.log('\nTest 3: Navigation Test');
    console.log('─'.repeat(50));
    
    try {
      const page = browserService.getPage('test-page');
      if (page) {
        await page.goto('https://httpbin.org/user-agent', { 
          waitUntil: 'networkidle2',
          timeout: 10000 
        });
        
        const title = await page.title();
        console.log('✅ Navigation successful');
        console.log(`📄 Page title: ${title}`);
        testsPassed++;
      } else {
        throw new Error('No page available for navigation test');
      }
    } catch (error) {
      console.log('❌ Navigation failed:', error.message);
    }
    
    // Test 4: User Agent Test
    totalTests++;
    console.log('\nTest 4: User Agent Test');
    console.log('─'.repeat(50));
    
    try {
      const page = browserService.getPage('test-page');
      if (page) {
        const userAgent = await page.evaluate(() => navigator.userAgent);
        console.log('✅ User agent retrieved successfully');
        console.log(`🔍 User Agent: ${userAgent}`);
        testsPassed++;
      } else {
        throw new Error('No page available for user agent test');
      }
    } catch (error) {
      console.log('❌ User agent test failed:', error.message);
    }
    
    // Test 5: Screenshot Test
    totalTests++;
    console.log('\nTest 5: Screenshot Test');
    console.log('─'.repeat(50));
    
    try {
      const page = browserService.getPage('test-page');
      if (page) {
        await browserService.takeScreenshot(page, 'test-screenshot');
        console.log('✅ Screenshot taken successfully');
        testsPassed++;
      } else {
        throw new Error('No page available for screenshot test');
      }
    } catch (error) {
      console.log('❌ Screenshot test failed:', error.message);
    }
    
  } catch (error) {
    console.log('❌ Critical error during testing:', error.message);
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    try {
      await browserService.close();
      console.log('✅ Browser closed successfully');
    } catch (error) {
      console.log('⚠️ Error during cleanup:', error.message);
    }
  }
  
  // Results
  console.log('\n📊 Test Results');
  console.log('═'.repeat(50));
  console.log(`Tests Passed: ${testsPassed}/${totalTests}`);
  console.log(`Success Rate: ${((testsPassed / totalTests) * 100).toFixed(1)}%`);
  
  if (testsPassed === totalTests) {
    console.log('🎉 All tests passed! Browser is working correctly.');
    process.exit(0);
  } else if (testsPassed > 0) {
    console.log('⚠️ Some tests failed, but browser is partially functional.');
    process.exit(1);
  } else {
    console.log('❌ All tests failed. Browser is not working.');
    process.exit(2);
  }
}

// Environment information
console.log('🔍 Environment Information');
console.log('═'.repeat(50));
console.log(`Platform: ${process.platform}`);
console.log(`Node.js Version: ${process.version}`);
console.log(`DISPLAY: ${process.env.DISPLAY || 'Not set'}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);
console.log(`PWD: ${process.cwd()}`);

// Check if running in headless environment
const isHeadless = !process.env.DISPLAY && process.platform === 'linux';
console.log(`Headless Environment: ${isHeadless ? 'Yes' : 'No'}`);
console.log('');

// Run the test
testBrowserLaunch().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(3);
});
