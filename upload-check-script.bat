@echo off
echo 📤 Uploading Check Script to Server...

set SERVER_IP=72.60.32.173
set SERVER_USER=root
set SERVER_PATH=/opt/loyverse-api

echo Uploading check-logs.sh to %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%

scp check-logs.sh %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/

echo.
echo ✅ Upload completed!
echo.
echo 🔍 Now run this command on your server:
echo ssh root@72.60.32.173
echo cd /opt/loyverse-api
echo chmod +x check-logs.sh
echo ./check-logs.sh
echo.
pause

