@echo off
echo 🚀 Direct Deployment to Ubuntu Server
echo ======================================

set SERVER_IP=72.60.32.173
set SERVER_USER=root
set SERVER_PATH=/opt/loyverse-api

echo Uploading to %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%

REM Create application directory on server
echo Creating application directory...
ssh %SERVER_USER%@%SERVER_IP% "mkdir -p %SERVER_PATH%"

REM Upload essential files
echo Uploading project files...
scp -r src %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/
scp package.json %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/
scp yarn.lock %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/
scp ecosystem.config.js %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/
scp deploy.sh %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/

REM Upload .env if present
if exist .env (
echo Uploading .env file...
scp .env %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/
) else (
echo ⚠️  .env file not found in project root. Skipping .env upload.
)

echo Upload completed!

REM Execute deployment on server
echo Executing deployment on server...
ssh %SERVER_USER%@%SERVER_IP% "cd %SERVER_PATH% && chmod +x deploy.sh && ./deploy.sh"

echo.
echo ======================================
echo 🎉 Deployment completed!
echo ======================================
echo.
echo Your Loyverse API is now running on:
echo 🌐 http://%SERVER_IP%:3001
echo.
echo Health Check:
echo 🔍 http://%SERVER_IP%:3001/health
echo.
echo To check status on server:
echo 📊 pm2 status
echo.
echo To view logs on server:
echo 📝 pm2 logs loyverse-api
echo.
pause
