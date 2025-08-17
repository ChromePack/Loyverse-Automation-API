@echo off
echo 🚀 VPS Setup Script for Windows
echo This will set up your VPS with all required dependencies
echo.

set SERVER_IP=72.60.32.173

echo 🔍 Connecting to server: %SERVER_IP%
echo.

echo 📦 Running VPS setup script on server...
ssh root@%SERVER_IP% "curl -fsSL https://raw.githubusercontent.com/ChromePack/Loyverse-Automation-API/main/setup-vps.sh | bash"

echo.
echo ✅ VPS setup completed!
echo.
echo 🔧 Next steps:
echo 1. Run deploy-manual.bat to deploy your application
echo 2. Connect to VNC at %SERVER_IP%:5901 (password: loyverse123)
echo 3. Access your API at http://%SERVER_IP%:3000