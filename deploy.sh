#!/bin/bash

# Loyverse API Deployment Script for Ubuntu Server
set -e

echo "🚀 Starting Loyverse API deployment on Ubuntu..."

# Colors for output
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

# Update system packages
print_status "Updating system packages..."
apt-get update

# Install Node.js dependencies
print_status "Installing Node.js dependencies..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Install Yarn if not present
if ! command -v yarn &> /dev/null; then
    print_status "Installing Yarn..."
    npm install -g yarn
fi

# Install Chrome/Chromium for Puppeteer
print_status "Installing Google Chrome for Puppeteer..."
if ! command -v google-chrome-stable &> /dev/null; then
    # Add Google Chrome repository
    wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
    sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
    apt-get update
    apt-get install -y google-chrome-stable
else
    print_status "Google Chrome is already installed"
fi

# Install PM2 globally if not present
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    npm install -g pm2
fi

# Install project dependencies
print_status "Installing project dependencies..."
yarn install --production

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p logs
mkdir -p downloads
mkdir -p chrome-user-data
mkdir -p processing

# Set proper permissions
print_status "Setting proper permissions..."
chmod 755 downloads
chmod 755 chrome-user-data
chmod 755 processing
chmod 755 logs

# Stop existing PM2 process if running
print_status "Stopping existing PM2 processes..."
pm2 stop loyverse-api 2>/dev/null || true
pm2 delete loyverse-api 2>/dev/null || true

# Start the application with PM2
print_status "Starting application with PM2..."
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
print_status "Saving PM2 configuration..."
pm2 save

# Setup PM2 startup script
print_status "Setting up PM2 startup script..."
pm2 startup

print_status "Deployment completed successfully!"
print_status "Application is running on port 3001"
print_status "PM2 Status:"
pm2 status

print_status "To view logs, run: pm2 logs loyverse-api"
print_status "To restart the application, run: pm2 restart loyverse-api"
print_status "To stop the application, run: pm2 stop loyverse-api"
