# Troubleshooting Guide

## Browser Launch Timeout on Linux Server

### Error: "Timed out after 30000 ms while waiting for the WS endpoint URL"

This error occurs on Linux servers (like Hostinger VPS) when Chrome cannot launch properly.

### Quick Fixes

#### 1. Check Dependencies

Run the dependency checker on your server:

```bash
./check-server-deps.sh
```

This will show you any missing Chrome dependencies.

#### 2. Ensure DISPLAY is Set

Add to your `.env` file on the server:

```env
DISPLAY=:1
FORCE_HEADLESS=false
```

#### 3. Start Xvfb Virtual Display

```bash
sudo systemctl start xvfb
sudo systemctl enable xvfb
```

Verify it's running:

```bash
ps aux | grep Xvfb
```

#### 4. Install Missing Chrome Dependencies

If the check script shows missing dependencies:

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
    libxss1 \
    libgconf-2-4
```

#### 5. Use Pipe Mode (Alternative)

The config now automatically uses `pipe: true` on Linux, which is more reliable than WebSocket mode.

### Advanced Solutions

#### Option 1: Use Headless Mode

For servers without display capabilities, enable headless mode:

```env
FORCE_HEADLESS=true
```

#### Option 2: Increase Timeout

The timeout has been increased to 120 seconds. If you still have issues, check Chrome logs:

```bash
# Enable dumpio in config to see Chrome logs
# Already enabled automatically on Linux
```

#### Option 3: Manual Chrome Test

Test Chrome manually on your server:

```bash
# Test headless mode
google-chrome --headless --disable-gpu --dump-dom https://www.google.com

# Test with display
export DISPLAY=:1
google-chrome --no-sandbox --disable-setuid-sandbox https://www.google.com
```

### Server Environment Checklist

- [ ] Chrome installed: `google-chrome --version`
- [ ] Xvfb running: `systemctl status xvfb`
- [ ] DISPLAY set: `echo $DISPLAY` (should show `:1`)
- [ ] Dependencies installed: `./check-server-deps.sh`
- [ ] User data directory writable: `ls -la chrome-user-data/`
- [ ] No Chrome processes running: `pkill chrome` (clean restart)

### Configuration Summary

The updated config now:

1. **Auto-detects Linux environment** and adds appropriate flags
2. **Uses pipe mode** instead of WebSocket on Linux (more stable)
3. **Enables dumpio** on Linux for debugging
4. **Increases timeout** to 120 seconds
5. **Adds Linux-specific Chrome flags**:
   - `--disable-gpu`
   - `--disable-software-rasterizer`
   - `--no-zygote`
   - `--display=:1` (if DISPLAY is set)

### Still Not Working?

1. **Check logs**: Look at PM2 logs with `pm2 logs`
2. **Run dependency checker**: `./check-server-deps.sh`
3. **Try headless mode**: Set `FORCE_HEADLESS=true`
4. **Restart Xvfb**: `sudo systemctl restart xvfb`
5. **Clear user data**: `rm -rf chrome-user-data/`

### Windows Issues

On Windows, the timeout usually means:

1. **Chrome is already running** - Close all Chrome windows
2. **User data directory locked** - Use a different profile
3. **Antivirus blocking** - Add exception for Chrome/Node.js

## Other Common Issues

### "Cannot find Chrome executable"

**Solution**: The config auto-detects Chrome. If it fails:

```bash
# Linux
which google-chrome

# Add to .env if needed
CHROME_EXECUTABLE_PATH=/usr/bin/google-chrome
```

### "User data directory is locked"

**Solution**: Another Chrome instance is using the profile:

```bash
# Linux
pkill chrome

# Windows
taskkill /F /IM chrome.exe
```

Or use a different profile:

```env
USER_DATA_DIR=chrome-automation-profile
```

### VNC Not Working

Run the VNC diagnostic script:

```bash
./diagnose-vnc.sh
```

Or fix common issues:

```bash
./fix-vnc.sh
```

## Getting Help

If you're still stuck:

1. Run `./check-server-deps.sh` and share the output
2. Check PM2 logs: `pm2 logs loyverse-automation-api`
3. Enable debug mode in `.env`: `LOG_LEVEL=debug`
4. Check Chrome process: `ps aux | grep chrome`
