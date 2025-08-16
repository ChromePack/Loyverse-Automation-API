@echo off
echo 📤 Uploading Fix Script to Server...

set SERVER_IP=72.60.32.173
set SERVER_USER=root
set SERVER_PATH=/opt/loyverse-api

echo Uploading fix-dotenv.sh to %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%

scp fix-dotenv.sh %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/

echo.
echo ✅ Upload completed!
echo.
echo 🔧 Now run this command on your server:
echo ssh root@72.60.32.173
echo cd /opt/loyverse-api
echo chmod +x fix-dotenv.sh
echo ./fix-dotenv.sh
echo.
pause

