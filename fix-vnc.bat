@echo off
echo 🔧 Fixing VNC server on your VPS
echo.

set SERVER_IP=72.60.32.173

echo 📡 Connecting to server: %SERVER_IP%
echo.

echo 🔧 Running VNC fix script...
ssh root@%SERVER_IP% "cd /var/www/loyverse-automation-api && chmod +x fix-vnc.sh && ./fix-vnc.sh"

echo.
echo ✅ VNC fix completed!
echo.
echo 🔗 Try connecting again:
echo    - Server: %SERVER_IP%:5901
echo    - Password: loyverse123
echo.
echo 🔍 Alternative connection (view-only):
echo    - Server: %SERVER_IP%:5902
echo    - No password required