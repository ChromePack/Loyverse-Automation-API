module.exports = {
  apps: [
    {
      name: 'loyverse-api',
      script: 'src/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        DISPLAY: ':99',
        LOYVERSE_USERNAME: 'mostafasalehi796@gmail.com',
        LOYVERSE_PASSWORD: '4q$qH5F2uWMVQz.',
        LOYVERSE_BASE_URL: 'https://r.loyverse.com',
        WEBHOOK_URL: 'http://localhost:5678/webhook/eb25f31a-326c-4434-a327-eadd26183b51',
        DOWNLOAD_TIMEOUT: 30000,
        NAVIGATION_TIMEOUT: 30000,
        REQUEST_TIMEOUT: 60000,
        MAX_RETRIES: 3,
        RETRY_DELAY: 5000,
        CORS_ORIGIN: '*',
        RATE_LIMIT_WINDOW: 900000,
        RATE_LIMIT_MAX: 100,
        REQUEST_SIZE_LIMIT: '10mb',
        WEBHOOK_TIMEOUT: 10000,
        WEBHOOK_MAX_RETRIES: 3,
        WEBHOOK_RETRY_DELAY: 2000,
        WEBHOOK_ENABLED: 'true',
        PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: 'true',
        PUPPETEER_EXECUTABLE_PATH: '/usr/bin/google-chrome-stable'
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
