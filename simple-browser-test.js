#!/usr/bin/env node

/**
 * Very simple browser launch test to isolate the Target closed error
 */

console.log('🔍 Simple Browser Launch Test');
console.log('═'.repeat(40));

// Force production environment
process.env.NODE_ENV = 'production';

const puppeteer = require('puppeteer');

async function simpleLaunchTest() {
  let browser = null;
  
  try {
    console.log('🚀 Launching browser with minimal config...');
    
    browser = await puppeteer.launch({
      headless: 'new',
      timeout: 60000,
      protocolTimeout: 60000,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--headless=new'
      ]
    });
    
    console.log('✅ Browser launched successfully!');
    
    const version = await browser.version();
    console.log(`🔍 Browser version: ${version}`);
    
    console.log('📄 Creating page...');
    const page = await browser.newPage();
    console.log('✅ Page created successfully!');
    
    await page.close();
    console.log('✅ Page closed successfully!');
    
    console.log('');
    console.log('🎉 SUCCESS! Browser launch is working correctly!');
    
  } catch (error) {
    console.log('');
    console.log('❌ ERROR:', error.message);
    console.log('');
    
    if (error.message.includes('Target closed')) {
      console.log('🔧 This is a "Target closed" error. Possible solutions:');
      console.log('1. Browser process is being killed by system (OOM killer)');
      console.log('2. Insufficient memory - try adding --single-process flag');
      console.log('3. Chrome dependencies missing - run: ./setup-ubuntu.sh');
      console.log('4. Check system resources: free -h && ps aux | grep chrome');
    } else if (error.message.includes('Protocol error')) {
      console.log('🔧 This is a protocol error. Possible solutions:');
      console.log('1. Increase timeout values');
      console.log('2. Remove pipe configuration');
      console.log('3. Add --single-process flag');
    }
    
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log('🧹 Browser closed');
      } catch (e) {
        console.log('⚠️ Error closing browser:', e.message);
      }
    }
  }
}

// Show system info
console.log(`Platform: ${process.platform}`);
console.log(`Node.js: ${process.version}`);
console.log(`Memory: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`);
console.log('');

simpleLaunchTest().catch(console.error);
