module.exports = {
  apps: [
    {
      name: "loyverse-automation-api",
      script: "yarn",
      args: "run start:prod",
      cwd: "./",
      watch: false,
      instances: 1,
      autorestart: true,
      max_memory_restart: "2G",
      env: {
        NODE_ENV: "production",
        DISPLAY: ":1",
        PORT: "3000"
      },
      env_production: {
        NODE_ENV: "production",
        DISPLAY: ":1",
        PORT: "3000"
      },
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_file: "./logs/pm2-combined.log",
      time: true
    },
  ],

  // Deploy configuration disabled for Windows compatibility
  // Use deploy-manual.bat or deploy-vps.sh instead
  deploy: {
    production: {
      user: "root",
      host: "72.60.32.173",
      ref: "origin/main",
      repo: "https://github.com/ChromePack/Loyverse-Automation-API.git",
      path: "/var/www/loyverse-automation-api",
      "pre-deploy-local": "",
      "post-deploy": "yarn install && pm2 reload ecosystem.config.js --env production",
      "pre-setup": "",
      ssh_options: "StrictHostKeyChecking=no",
      env: {
        NODE_ENV: "production"
      }
    },
  },
};