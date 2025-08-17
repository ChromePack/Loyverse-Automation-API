#!/bin/bash

# Loyverse Automation API - Ubuntu Server Setup Script
echo "🚀 Setting up Loyverse Automation API on Ubuntu..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please don't run as root. Use a regular user with sudo privileges."
    exit 1
fi

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js and Yarn
print_status "Installing Node.js and Yarn..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Yarn
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt update
sudo apt install -y yarn

# Install Chrome
print_status "Installing Google Chrome..."
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt update
sudo apt install -y google-chrome-stable

# Install comprehensive system dependencies for Chrome headless
print_status "Installing comprehensive system dependencies..."
sudo apt install -y \
    ca-certificates \
    fonts-liberation \
    fonts-dejavu-core \
    fontconfig \
    libappindicator3-1 \
    libasound2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libc6 \
    libcairo2 \
    libcairo-gobject2 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libnss3-dev \
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
    libxkbcommon0 \
    libxshmfence1 \
    xdg-utils \
    xvfb \
    x11-utils \
    x11-xserver-utils \
    dbus-x11 \
    gconf-service \
    lsb-release \
    wget

# Install PM2 globally
print_status "Installing PM2..."
sudo npm install -g pm2

# Create necessary directories
print_status "Creating project directories..."
mkdir -p logs
mkdir -p downloads
mkdir -p chrome-user-data
mkdir -p processing

# Set proper permissions
print_status "Setting directory permissions..."
chmod 755 logs downloads chrome-user-data processing

# Install project dependencies
print_status "Installing project dependencies..."
yarn install --production

# Create PM2 startup script
print_status "Setting up PM2 startup..."
pm2 startup

# Test Chrome headless mode
print_status "Testing Chrome in headless mode..."
timeout 10s google-chrome-stable \
    --headless=new \
    --no-sandbox \
    --disable-gpu \
    --disable-dev-shm-usage \
    --virtual-time-budget=5000 \
    --dump-dom https://www.google.com > /dev/null 2>&1

if [ $? -eq 0 ]; then
    print_status "✅ Chrome headless test successful!"
else
    print_warning "⚠️ Chrome headless test failed - check dependencies"
fi

# Make scripts executable
print_status "Making scripts executable..."
chmod +x start-xvfb.sh
chmod +x start-server.sh
chmod +x quick-test.js

print_status "✅ Setup completed successfully!"
echo ""
print_status "🎯 Next steps:"
echo "1. Test browser launch: node quick-test.js"
echo "2. Start the server: ./start-server.sh"
echo "3. Check PM2 logs: pm2 logs loyverse-api"
echo "4. Monitor server: pm2 monit"
echo ""
print_status "🔧 If you still get X server errors:"
echo "1. Make sure NODE_ENV=production is set"
echo "2. Run: export NODE_ENV=production && node quick-test.js"
echo "3. Check Chrome dependencies: ldd \$(which google-chrome-stable) | grep 'not found'"
