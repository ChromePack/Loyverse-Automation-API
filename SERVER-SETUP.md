# Hostinger VPS Server Setup Guide

## Quick Start for Hostinger Server

### 1. SSH into Your Server

```bash
ssh root@72.60.32.173
```

### 2. Pull Latest Changes

```bash
cd /var/www/loyverse-automation-api
git pull origin main
yarn install
```

### 3. Check Dependencies

```bash
./check-server-deps.sh
```

This will show you any missing dependencies.

### 4. Configure Environment

Ensure your `.env` file has these settings:

```env
# Display Configuration (REQUIRED for VPS)
DISPLAY=:1

# Don't force headless if you have Xvfb running
FORCE_HEADLESS=false

# Production Settings
NODE_ENV=production
PORT=3000
```

### 5. Ensure Xvfb is Running

Xvfb provides a virtual display for Chrome:

```bash
# Check if running
systemctl status xvfb

# Start if not running
systemctl start xvfb
systemctl enable xvfb

# Verify
ps aux | grep Xvfb
# Should show: Xvfb :1 -screen 0 1920x1080x24
```

### 6. Test Browser Launch

Before deploying, test that Chrome can launch:

```bash
# Export DISPLAY variable
export DISPLAY=:1

# Run the test
yarn test:browser
# Or
node test-browser.js
```

If this works, you're good to go! ✅

### 7. Deploy with PM2

```bash
# Stop old instance
pm2 stop loyverse-automation-api

# Start new instance
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Check status
pm2 status
pm2 logs loyverse-automation-api
```

## Troubleshooting on Server

### Still Getting Timeout Error?

#### Option 1: Install Missing Dependencies

```bash
sudo apt-get update
sudo apt-get install -y \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libgtk-3-0 \
    libgbm1 \
    libasound2 \
    fonts-liberation \
    libatspi2.0-0 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    libxss1
```

#### Option 2: Use Full Headless Mode

Edit `.env`:

```env
FORCE_HEADLESS=true
```

Then restart:

```bash
pm2 restart loyverse-automation-api
```

#### Option 3: Check Chrome Installation

```bash
# Verify Chrome is installed
google-chrome --version

# Test manual launch
google-chrome --headless --disable-gpu --dump-dom https://www.google.com
```

#### Option 4: Clear User Data

```bash
# Stop application
pm2 stop loyverse-automation-api

# Remove user data directory
rm -rf chrome-user-data/

# Restart
pm2 start loyverse-automation-api
```

### Check Logs

```bash
# PM2 logs
pm2 logs loyverse-automation-api

# System logs
journalctl -u xvfb -n 50
journalctl -u vncserver@1 -n 50
```

### Monitor Performance

```bash
# Real-time monitoring
pm2 monit

# Memory usage
pm2 status

# Detailed info
pm2 info loyverse-automation-api
```

## What Changed?

The recent updates fixed the Linux server timeout issue:

1. **Auto-detection**: Config now detects Linux environment and applies correct flags
2. **Pipe mode**: Uses `pipe: true` instead of WebSocket (more stable)
3. **Longer timeout**: Increased to 120 seconds for server environments
4. **Better flags**: Added Linux-specific Chrome flags
5. **Display support**: Automatically uses `DISPLAY` variable when set
6. **Debug output**: Enabled `dumpio` on Linux for better error messages

## Environment Variables Reference

```env
# Required for VPS
DISPLAY=:1                    # Use Xvfb virtual display
FORCE_HEADLESS=false          # Use headed mode with Xvfb

# Alternative: Full headless
FORCE_HEADLESS=true           # No display needed

# Chrome Configuration
USER_DATA_DIR=chrome-user-data
DOWNLOAD_PATH=downloads

# Timeouts
DOWNLOAD_TIMEOUT=30000
NAVIGATION_TIMEOUT=30000
```

## VNC Access (Optional)

If you want to see Chrome running:

```bash
# On your local machine
# Connect to: 72.60.32.173:5901
# Password: loyverse123 (change this!)
```

Use a VNC client like RealVNC Viewer or TigerVNC.

## Success Checklist

- [ ] Git pulled latest changes
- [ ] Yarn dependencies installed
- [ ] `check-server-deps.sh` shows all green
- [ ] `.env` has `DISPLAY=:1`
- [ ] Xvfb is running (`systemctl status xvfb`)
- [ ] Test browser works (`node test-browser.js`)
- [ ] PM2 application running (`pm2 status`)
- [ ] API responds (`curl http://localhost:3000/health`)

## Quick Commands

```bash
# Update and restart
cd /var/www/loyverse-automation-api && \
git pull && \
yarn install && \
pm2 restart loyverse-automation-api

# Check everything
./check-server-deps.sh && \
systemctl status xvfb && \
pm2 status

# View logs
pm2 logs loyverse-automation-api --lines 100

# Full restart
pm2 delete loyverse-automation-api && \
pm2 start ecosystem.config.js --env production && \
pm2 save
```
