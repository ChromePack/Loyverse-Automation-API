const BrowserService = require('./src/services/BrowserService');
const { Logger } = require('./src/utils/logger');

async function testBrowserLaunch() {
  const browserService = new BrowserService();

  try {
    Logger.info('Starting browser launch test...');

    await browserService.launch();
    Logger.info('✅ Browser launched successfully');

    const page = await browserService.createPage('test');
    Logger.info('✅ Page created successfully');

    await page.goto('https://example.com', { waitUntil: 'networkidle2' });
    Logger.info('✅ Navigation successful');

    const title = await page.title();
    Logger.info('✅ Page title:', title);

    await browserService.close();
    Logger.info('✅ Browser closed successfully');

    Logger.info('🎉 All tests passed!');
    process.exit(0);
  } catch (error) {
    Logger.error('❌ Test failed:', error);
    await browserService.close();
    process.exit(1);
  }
}

testBrowserLaunch();
