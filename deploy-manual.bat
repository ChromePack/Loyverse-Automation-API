@echo off
echo 🚀 Manual Deployment Script for Windows
echo.

set SERVER_IP=72.60.32.173
set PROJECT_PATH=/var/www/loyverse-automation-api
set REPO_URL=https://github.com/ChromePack/Loyverse-Automation-API

echo 🔍 Connecting to server: %SERVER_IP%
echo.

echo 📂 Creating project directory and cloning repository...
ssh root@%SERVER_IP% "mkdir -p %PROJECT_PATH% && cd %PROJECT_PATH% && git clone %REPO_URL% . || (git fetch origin && git reset --hard origin/main)"

echo.
echo 📦 Installing dependencies...
ssh root@%SERVER_IP% "cd %PROJECT_PATH% && yarn install --production"

echo.
echo 🔧 Setting up file permissions...
ssh root@%SERVER_IP% "cd %PROJECT_PATH% && chmod +x start-server.sh setup-vps.sh deploy-vps.sh"

echo.
echo 📊 Creating logs directory...
ssh root@%SERVER_IP% "cd %PROJECT_PATH% && mkdir -p logs"

echo.
echo 🔄 Stopping existing PM2 processes...
ssh root@%SERVER_IP% "cd %PROJECT_PATH% && pm2 delete loyverse-automation-api || echo 'No existing process found'"

echo.
echo 🚀 Starting application with PM2...
ssh root@%SERVER_IP% "cd %PROJECT_PATH% && pm2 start ecosystem.config.js --env production"

echo.
echo 💾 Saving PM2 configuration...
ssh root@%SERVER_IP% "pm2 save"

echo.
echo 📊 Checking application status...
ssh root@%SERVER_IP% "pm2 status"

echo.
echo 🧪 Testing application health...
timeout 5 >nul
ssh root@%SERVER_IP% "curl -f http://localhost:3000/health || echo 'Health check failed - check logs'"

echo.
echo 🎉 Deployment completed!
echo.
echo 📊 Application Information:
echo    - URL: http://%SERVER_IP%:3000
echo    - Health Check: http://%SERVER_IP%:3000/health
echo    - API Docs: http://%SERVER_IP%:3000/api
echo.
echo 🖥️  VNC Information:
echo    - VNC Server: %SERVER_IP%:5901
echo    - Password: loyverse123 (change this!)
echo.
echo 🔧 Useful Commands:
echo    - Check status: ssh root@%SERVER_IP% "pm2 status"
echo    - View logs: ssh root@%SERVER_IP% "pm2 logs loyverse-automation-api"
echo    - Restart app: ssh root@%SERVER_IP% "pm2 restart loyverse-automation-api"