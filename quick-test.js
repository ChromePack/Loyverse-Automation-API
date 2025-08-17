#!/usr/bin/env node

/**
 * Quick test script to verify browser launch fix
 */

console.log('🔍 Quick Browser Launch Test');
console.log('═'.repeat(50));

// Environment info
console.log('Environment Info:');
console.log(`- Platform: ${process.platform}`);
console.log(`- Node.js: ${process.version}`);
console.log(`- DISPLAY: ${process.env.DISPLAY || 'NOT SET'}`);
console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'NOT SET'}`);
console.log('');

// Force production environment for headless mode
process.env.NODE_ENV = 'production';

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function quickTest() {
  let browser = null;
  
  try {
    console.log('🚀 Launching browser in headless mode...');
    
    // Force headless configuration
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--headless=new',
        '--disable-gpu-sandbox',
        '--disable-software-rasterizer',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-translate',
        '--disable-features=TranslateUI,BlinkGenPropertyTrees,VizDisplayCompositor',
        '--virtual-time-budget=5000'
      ],
      pipe: true,
      dumpio: false
    });
    
    console.log('✅ Browser launched successfully!');
    
    console.log('📄 Creating page...');
    const page = await browser.newPage();
    console.log('✅ Page created successfully!');
    
    console.log('🌐 Navigating to test URL...');
    await page.goto('https://httpbin.org/user-agent', { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });
    console.log('✅ Navigation successful!');
    
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);
    
    const userAgent = await page.evaluate(() => navigator.userAgent);
    console.log(`🔍 User Agent: ${userAgent}`);
    
    console.log('');
    console.log('🎉 SUCCESS! Browser is working correctly in headless mode!');
    
  } catch (error) {
    console.log('');
    console.log('❌ ERROR:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting tips:');
    console.log('1. Make sure Chrome is installed: google-chrome-stable --version');
    console.log('2. Install missing dependencies: sudo apt-get install -y libnss3 libatk-bridge2.0-0 libdrm2 libxss1 libgtk-3-0 libxrandr2 libasound2');
    console.log('3. Check if running as root (not recommended): whoami');
    
  } finally {
    if (browser) {
      await browser.close();
      console.log('🧹 Browser closed');
    }
  }
}

quickTest().catch(console.error);
