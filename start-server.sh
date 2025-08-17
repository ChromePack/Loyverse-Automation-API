#!/bin/bash

# Loyverse Automation API - Complete Server Startup Script
echo "🚀 Starting Loyverse Automation API Server..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the project directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Step 1: Setup virtual display for browser automation
print_status "Setting up virtual display for browser automation..."
chmod +x start-xvfb.sh

if ./start-xvfb.sh; then
    print_status "Virtual display setup completed"
    
    # Source the display environment
    if [ -f /tmp/xvfb.display ]; then
        DISPLAY_NUM=$(cat /tmp/xvfb.display)
        export DISPLAY=:${DISPLAY_NUM}
        print_status "Display set to: $DISPLAY"
    else
        export DISPLAY=:99
        print_status "Display set to fallback: $DISPLAY"
    fi
else
    print_warning "Virtual display setup failed, using headless mode"
    # The Puppeteer config will automatically detect this and use headless mode
fi

# Step 3: Check Chrome
print_status "Verifying Chrome installation..."
if ! command -v google-chrome-stable &> /dev/null; then
    print_error "Chrome not found. Please run setup-ubuntu.sh first."
    exit 1
fi

# Step 4: Test Chrome with Xvfb
print_status "Testing Chrome with Xvfb..."
timeout 10s google-chrome-stable --headless --no-sandbox --disable-gpu --dump-dom https://www.google.com > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_status "Chrome test successful"
else
    print_warning "Chrome test failed, but continuing..."
fi

# Step 5: Start PM2 process
print_status "Starting PM2 process..."
if pm2 list | grep -q "loyverse-api"; then
    print_status "Restarting existing PM2 process..."
    pm2 restart loyverse-api
else
    print_status "Starting new PM2 process..."
    pm2 start ecosystem.config.js --env production
fi

# Step 6: Save PM2 configuration
print_status "Saving PM2 configuration..."
pm2 save

# Step 7: Show status
print_status "Server startup completed!"
echo ""
pm2 status
echo ""
print_status "Check logs with: pm2 logs loyverse-api"
print_status "Monitor with: pm2 monit"
