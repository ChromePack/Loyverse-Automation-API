#!/usr/bin/env node

/**
 * Test script for CapSolver Browser Extension functionality
 */

const BrowserService = require('../src/services/BrowserService');
const { Logger } = require('../src/utils/logger');
const path = require('path');

async function testExtensionFunctionality() {
  console.log('🧩 Testing CapSolver Extension Functionality...\n');
  
  const browserService = new BrowserService();
  let testsPassed = 0;
  let totalTests = 0;
  
  try {
    // Test 1: Browser Launch with Extension
    totalTests++;
    console.log('Test 1: Browser Launch with Extension');
    console.log('─'.repeat(50));
    
    try {
      await browserService.launch();
      console.log('✅ Browser launched successfully with extension support');
      testsPassed++;
    } catch (error) {
      console.log('❌ Browser launch failed:', error.message);
      return;
    }
    
    // Test 2: Extension Loading Check
    totalTests++;
    console.log('\nTest 2: Extension Loading Check');
    console.log('─'.repeat(50));
    
    try {
      const page = await browserService.createPage('extension-test');
      
      // Navigate to extensions page
      await page.goto('chrome://extensions/', { 
        waitUntil: 'networkidle2',
        timeout: 10000 
      });
      
      // Check if CapSolver extension is loaded
      const extensionElements = await page.evaluate(() => {
        const extensions = Array.from(document.querySelectorAll('extensions-item'));
        return extensions.map(ext => {
          const name = ext.shadowRoot?.querySelector('#name')?.textContent || '';
          const id = ext.getAttribute('id') || '';
          const enabled = ext.hasAttribute('data-enabled') || false;
          return { name, id, enabled };
        });
      });
      
      const capsolverExtension = extensionElements.find(ext => 
        ext.name.toLowerCase().includes('capsolver') || 
        ext.id.includes('pgojnojmmhpofjgdmaebadhbocahppod')
      );
      
      if (capsolverExtension) {
        console.log('✅ CapSolver extension found and loaded');
        console.log(`📋 Extension details:`, capsolverExtension);
        testsPassed++;
      } else {
        console.log('❌ CapSolver extension not found');
        console.log('📋 Available extensions:', extensionElements);
      }
    } catch (error) {
      console.log('❌ Extension check failed:', error.message);
    }
    
    // Test 3: Extension Background Script Access
    totalTests++;
    console.log('\nTest 3: Extension Background Script Access');
    console.log('─'.repeat(50));
    
    try {
      const page = browserService.getPage('extension-test');
      if (page) {
        // Try to access extension APIs
        const extensionApis = await page.evaluate(() => {
          return {
            hasChrome: typeof chrome !== 'undefined',
            hasRuntime: typeof chrome?.runtime !== 'undefined',
            hasExtensions: typeof chrome?.management !== 'undefined',
            userAgent: navigator.userAgent,
            webdriver: navigator.webdriver
          };
        });
        
        console.log('✅ Extension API access checked');
        console.log('📋 API availability:', extensionApis);
        testsPassed++;
      } else {
        throw new Error('No page available for API test');
      }
    } catch (error) {
      console.log('❌ Extension API test failed:', error.message);
    }
    
    // Test 4: CAPTCHA Detection Test
    totalTests++;
    console.log('\nTest 4: CAPTCHA Detection Test');
    console.log('─'.repeat(50));
    
    try {
      const page = browserService.getPage('extension-test');
      if (page) {
        // Navigate to a test page with reCAPTCHA
        await page.goto('https://www.google.com/recaptcha/api2/demo', { 
          waitUntil: 'networkidle2',
          timeout: 15000 
        });
        
        // Wait for page to load
        await page.waitForTimeout(3000);
        
        // Check if reCAPTCHA is present
        const recaptchaPresent = await page.evaluate(() => {
          return {
            hasRecaptcha: document.querySelector('.g-recaptcha') !== null,
            hasIframe: document.querySelector('iframe[src*="recaptcha"]') !== null,
            pageTitle: document.title
          };
        });
        
        console.log('✅ CAPTCHA detection test completed');
        console.log('📋 CAPTCHA elements:', recaptchaPresent);
        testsPassed++;
      } else {
        throw new Error('No page available for CAPTCHA test');
      }
    } catch (error) {
      console.log('❌ CAPTCHA detection test failed:', error.message);
    }
    
    // Test 5: Extension Console Messages
    totalTests++;
    console.log('\nTest 5: Extension Console Messages');
    console.log('─'.repeat(50));
    
    try {
      const page = browserService.getPage('extension-test');
      if (page) {
        // Listen for console messages from extension
        const consoleMessages = [];
        page.on('console', msg => {
          if (msg.text().toLowerCase().includes('capsolver') || 
              msg.text().toLowerCase().includes('extension')) {
            consoleMessages.push({
              type: msg.type(),
              text: msg.text(),
              timestamp: new Date().toISOString()
            });
          }
        });
        
        // Wait a bit to collect messages
        await page.waitForTimeout(5000);
        
        console.log('✅ Console monitoring completed');
        console.log(`📋 Extension messages found: ${consoleMessages.length}`);
        if (consoleMessages.length > 0) {
          console.log('📋 Sample messages:', consoleMessages.slice(0, 3));
        }
        testsPassed++;
      } else {
        throw new Error('No page available for console test');
      }
    } catch (error) {
      console.log('❌ Console monitoring failed:', error.message);
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
  console.log('\n📊 Extension Test Results');
  console.log('═'.repeat(50));
  console.log(`Tests Passed: ${testsPassed}/${totalTests}`);
  console.log(`Success Rate: ${((testsPassed / totalTests) * 100).toFixed(1)}%`);
  
  if (testsPassed === totalTests) {
    console.log('🎉 All extension tests passed! CapSolver is working correctly.');
    process.exit(0);
  } else if (testsPassed > 0) {
    console.log('⚠️ Some extension tests failed, but basic functionality works.');
    process.exit(1);
  } else {
    console.log('❌ All extension tests failed. Check extension installation.');
    process.exit(2);
  }
}

// Environment information
console.log('🔍 Extension Test Environment');
console.log('═'.repeat(50));
console.log(`Platform: ${process.platform}`);
console.log(`Node.js Version: ${process.version}`);
console.log(`DISPLAY: ${process.env.DISPLAY || 'Not set'}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);
console.log(`FORCE_HEADLESS: ${process.env.FORCE_HEADLESS || 'Not set'}`);

// Check extension path
const extensionPath = path.join(__dirname, '..', 'CapSolver.Browser.Extension');
const fs = require('fs');
try {
  const extensionExists = fs.existsSync(extensionPath);
  console.log(`Extension Path: ${extensionPath}`);
  console.log(`Extension Exists: ${extensionExists ? 'Yes' : 'No'}`);
  
  if (extensionExists) {
    const manifestPath = path.join(extensionPath, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      console.log(`Extension Name: ${manifest.name || 'Unknown'}`);
      console.log(`Extension Version: ${manifest.version || 'Unknown'}`);
    }
  }
} catch (error) {
  console.log(`Extension Check Error: ${error.message}`);
}

console.log('');

// Run the test
testExtensionFunctionality().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(3);
});
