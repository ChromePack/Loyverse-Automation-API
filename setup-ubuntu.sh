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

# Install system dependencies
print_status "Installing system dependencies..."
sudo apt install -y \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    libxss1 \
    libxtst6 \
    libgbm1 \
    libxkbcommon0 \
    libxshmfence1 \
    xvfb \
    x11-utils \
    x11-xserver-utils

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

print_status "Setup completed successfully!"
echo ""
print_status "Next steps:"
echo "1. Configure your environment variables"
echo "2. Start the application: pm2 start ecosystem.config.js --env production"
echo "3. Save PM2 configuration: pm2 save"
echo "4. Check logs: pm2 logs loyverse-api"
