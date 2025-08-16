#!/bin/bash

echo "🔍 Checking PM2 Status and Logs..."
echo "=================================="

echo ""
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "📝 Recent PM2 Logs (last 30 lines):"
pm2 logs loyverse-api --lines 30

echo ""
echo "🔍 Error Log File:"
if [ -f "./logs/err.log" ]; then
    echo "Last 20 lines of error log:"
    tail -20 ./logs/err.log
else
    echo "Error log file not found"
fi

echo ""
echo "📄 Output Log File:"
if [ -f "./logs/out.log" ]; then
    echo "Last 20 lines of output log:"
    tail -20 ./logs/out.log
else
    echo "Output log file not found"
fi

echo ""
echo "🔧 Node.js Version:"
node --version

echo ""
echo "🌐 Chrome Version:"
if command -v google-chrome-stable &> /dev/null; then
    google-chrome-stable --version
else
    echo "Chrome not found"
fi

echo ""
echo "📁 Current Directory Contents:"
ls -la

echo ""
echo "📁 Source Directory Contents:"
ls -la src/

echo ""
echo "🔍 Checking if server.js exists:"
if [ -f "src/server.js" ]; then
    echo "✅ server.js found"
    echo "File size: $(ls -lh src/server.js | awk '{print $5}')"
else
    echo "❌ server.js not found"
fi

echo ""
echo "🎯 Testing Node.js execution:"
echo "Trying to run: node src/server.js"
timeout 10s node src/server.js || echo "Node execution failed or timed out"

