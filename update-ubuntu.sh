#!/bin/bash

# Loyverse Automation API - Ubuntu Server Update Script
echo "🔄 Updating Loyverse Automation API on Ubuntu..."

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

# Backup current state
print_status "Creating backup..."
cp package.json package.json.backup 2>/dev/null || true

# Pull latest changes
print_status "Pulling latest changes..."
git fetch origin
git reset --hard origin/main

# Check if dependencies changed
print_status "Checking dependencies..."
if ! cmp -s package.json package.json.backup; then
    print_warning "Dependencies changed, installing..."
    yarn install --production
else
    print_status "No dependency changes detected"
fi

# Check Chrome installation
print_status "Verifying Chrome installation..."
if ! command -v google-chrome-stable &> /dev/null; then
    print_warning "Chrome not found, installing..."
    wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
    echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
    sudo apt update
    sudo apt install -y google-chrome-stable
fi

# Start Xvfb if not running
print_status "Starting Xvfb virtual display..."
if ! pgrep Xvfb > /dev/null; then
    chmod +x start-xvfb.sh
    ./start-xvfb.sh
else
    print_status "Xvfb is already running"
fi

# Restart PM2 process
print_status "Restarting PM2 process..."
if pm2 list | grep -q "loyverse-api"; then
    pm2 reload loyverse-api || pm2 restart loyverse-api
    print_status "PM2 process restarted successfully"
else
    print_warning "PM2 process not found, starting new instance..."
    pm2 start ecosystem.config.js --env production
fi

# Save PM2 configuration
print_status "Saving PM2 configuration..."
pm2 save

# Cleanup
rm -f package.json.backup

# Show status
print_status "Update completed successfully!"
echo ""
pm2 status
echo ""
print_status "Check logs with: pm2 logs loyverse-api"
