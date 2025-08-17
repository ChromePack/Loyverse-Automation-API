#!/bin/bash

# Enhanced virtual display server setup for Puppeteer on Ubuntu server
echo "🖥️ Setting up virtual display server for browser automation..."

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install required packages
install_packages() {
    echo "📦 Installing required packages..."
    
    # Update package list
    sudo apt-get update -qq
    
    # Install Xvfb and related packages
    sudo apt-get install -y \
        xvfb \
        x11-utils \
        x11-xserver-utils \
        dbus-x11 \
        fonts-liberation \
        fonts-dejavu-core \
        fontconfig \
        ca-certificates \
        gconf-service \
        libasound2 \
        libatk1.0-0 \
        libc6 \
        libcairo2 \
        libcups2 \
        libdbus-1-3 \
        libexpat1 \
        libfontconfig1 \
        libgcc1 \
        libgconf-2-4 \
        libgdk-pixbuf2.0-0 \
        libglib2.0-0 \
        libgtk-3-0 \
        libnspr4 \
        libpango-1.0-0 \
        libpangocairo-1.0-0 \
        libstdc++6 \
        libx11-6 \
        libx11-xcb1 \
        libxcb1 \
        libxcomposite1 \
        libxcursor1 \
        libxdamage1 \
        libxext6 \
        libxfixes3 \
        libxi6 \
        libxrandr2 \
        libxrender1 \
        libxss1 \
        libxtst6 \
        lsb-release \
        wget \
        xdg-utils
        
    echo "✅ Required packages installed"
}

# Check if Xvfb is available, install if not
if ! command_exists xvfb-run; then
    echo "⚠️ Xvfb not found, installing..."
    install_packages
fi

# Kill any existing Xvfb processes
echo "🧹 Cleaning up existing Xvfb processes..."
pkill Xvfb 2>/dev/null || true
pkill -f "Xvfb" 2>/dev/null || true

# Wait for processes to fully terminate
sleep 3

# Find available display number
DISPLAY_NUM=99
while [ -f "/tmp/.X${DISPLAY_NUM}-lock" ]; do
    DISPLAY_NUM=$((DISPLAY_NUM + 1))
    if [ $DISPLAY_NUM -gt 999 ]; then
        echo "❌ No available display numbers"
        exit 1
    fi
done

echo "🔍 Using display :${DISPLAY_NUM}"

# Start Xvfb with comprehensive options
echo "🚀 Starting Xvfb virtual display server..."
Xvfb :${DISPLAY_NUM} \
    -screen 0 1920x1080x24 \
    -ac \
    +extension GLX \
    +extension RANDR \
    +extension RENDER \
    -noreset \
    -nolisten tcp \
    -dpi 96 \
    -fbdir /var/tmp &

XVFB_PID=$!

# Wait for Xvfb to start
sleep 5

# Set DISPLAY environment variable
export DISPLAY=:${DISPLAY_NUM}

# Check if Xvfb is running
if kill -0 $XVFB_PID 2>/dev/null && pgrep Xvfb > /dev/null; then
    echo "✅ Xvfb started successfully on display :${DISPLAY_NUM} (PID: $XVFB_PID)"
    echo "📺 Display: $DISPLAY"
    
    # Save PID for later cleanup
    echo $XVFB_PID > /tmp/xvfb.pid
    echo $DISPLAY_NUM > /tmp/xvfb.display
else
    echo "❌ Failed to start Xvfb"
    exit 1
fi

# Test if display is working
if command_exists xdpyinfo && xdpyinfo -display :${DISPLAY_NUM} >/dev/null 2>&1; then
    echo "✅ Display test successful"
    
    # Get display info
    SCREEN_INFO=$(xdpyinfo -display :${DISPLAY_NUM} | grep "screen #0" | head -1)
    echo "📊 Screen info: $SCREEN_INFO"
else
    echo "⚠️ Display test failed or xdpyinfo not available, but Xvfb is running"
fi

# Set up environment for the current session
echo "🔧 Setting up environment variables..."
echo "export DISPLAY=:${DISPLAY_NUM}" >> ~/.bashrc
echo "export XVFB_PID=$XVFB_PID" >> ~/.bashrc

# Create a cleanup script
cat > /tmp/cleanup-xvfb.sh << 'EOF'
#!/bin/bash
echo "🧹 Cleaning up Xvfb..."
if [ -f /tmp/xvfb.pid ]; then
    PID=$(cat /tmp/xvfb.pid)
    if kill -0 $PID 2>/dev/null; then
        kill $PID
        echo "✅ Xvfb process $PID terminated"
    fi
    rm -f /tmp/xvfb.pid
fi
if [ -f /tmp/xvfb.display ]; then
    DISPLAY_NUM=$(cat /tmp/xvfb.display)
    rm -f "/tmp/.X${DISPLAY_NUM}-lock"
    rm -f /tmp/xvfb.display
    echo "✅ Display lock removed"
fi
EOF

chmod +x /tmp/cleanup-xvfb.sh

echo "🎉 Virtual display server setup completed!"
echo "💡 To stop Xvfb later, run: /tmp/cleanup-xvfb.sh"
echo "🔄 Environment ready for browser automation"
