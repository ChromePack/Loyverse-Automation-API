#!/bin/bash

# Start Xvfb virtual display server for headless Chrome
echo "🖥️ Starting Xvfb virtual display server..."

# Kill any existing Xvfb processes
pkill Xvfb 2>/dev/null || true

# Start Xvfb on display :99
Xvfb :99 -screen 0 1920x1080x24 -ac +extension GLX +render -noreset &

# Wait a moment for Xvfb to start
sleep 2

# Set DISPLAY environment variable
export DISPLAY=:99

# Check if Xvfb is running
if pgrep Xvfb > /dev/null; then
    echo "✅ Xvfb started successfully on display :99"
    echo "📺 Display: $DISPLAY"
else
    echo "❌ Failed to start Xvfb"
    exit 1
fi

# Test if display is working
if xdpyinfo -display :99 >/dev/null 2>&1; then
    echo "✅ Display test successful"
else
    echo "❌ Display test failed"
    exit 1
fi
