@echo off
echo 🔍 Deploying Login Debug Enhancements
echo.

set SERVER_IP=72.60.32.173
set PROJECT_PATH=/var/www/loyverse-automation-api

echo 📡 Updating server with debugging enhancements...
ssh root@%SERVER_IP% "cd %PROJECT_PATH% && git pull origin main"

echo.
echo 📦 Installing any new dependencies...
ssh root@%SERVER_IP% "cd %PROJECT_PATH% && yarn install --production"

echo.
echo 🔄 Restarting application with debug enhancements...
ssh root@%SERVER_IP% "cd %PROJECT_PATH% && pm2 restart loyverse-automation-api"

echo.
echo 📊 Checking PM2 status...
ssh root@%SERVER_IP% "pm2 status"

echo.
echo ✅ Debug deployment completed!
echo.
echo 🔍 Debug tools now available:
echo    - Enhanced logging in AuthService
echo    - Multiple login button click methods
echo    - Detailed button state debugging
echo.
echo 📊 Monitor logs with:
echo    ssh root@%SERVER_IP% "pm2 logs loyverse-automation-api"