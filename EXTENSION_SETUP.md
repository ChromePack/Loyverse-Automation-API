# CapSolver Extension Setup Guide

## 🧩 Extension Configuration

This project is optimized to work with the CapSolver Browser Extension for automated CAPTCHA solving.

### 🚀 Extension Features Enabled

1. **Extension Loading**: Automatically loads CapSolver extension
2. **Permission Management**: Proper permissions for extension functionality  
3. **Anti-Detection**: Stealth mode compatible with extensions
4. **CAPTCHA Integration**: Ready for automated CAPTCHA solving

### 🔧 Configuration Modes

#### Headed Mode (Recommended for Extensions)
```bash
# Normal mode with virtual display (best for extensions)
./start-server.sh

# Or manually set display
export DISPLAY=:99
./start-xvfb.sh
yarn start
```

#### Headless Mode (Server Only)
```bash
# Force headless mode (limited extension functionality)
export FORCE_HEADLESS=true
./start-server.sh
```

### 🧪 Testing Extension

```bash
# Test extension loading and functionality
yarn test:extension

# Simple browser test
yarn test:simple

# Full browser functionality test
yarn test:browser
```

### 📋 Extension Settings

The following settings are optimized for CapSolver:

- **Extension Path**: `./CapSolver.Browser.Extension`
- **Extension ID**: `pgojnojmmhpofjgdmaebadhbocahppod`
- **Permissions**: Full access to web pages and extension APIs
- **Stealth Mode**: Enabled to avoid detection
- **Timeout**: Extended to 60 seconds for extension loading

### 🔍 Troubleshooting

#### Extension Not Loading
1. Check if extension folder exists: `ls -la CapSolver.Browser.Extension/`
2. Verify manifest.json: `cat CapSolver.Browser.Extension/manifest.json`
3. Test extension manually: `yarn test:extension`

#### CAPTCHA Not Solving
1. Ensure extension is loaded in headed mode
2. Check extension console messages
3. Verify CapSolver API key configuration

#### Performance Issues
1. Use headed mode for better extension compatibility
2. Increase timeout values if needed
3. Monitor memory usage: `free -h`

### 💡 Best Practices

1. **Use Headed Mode**: Extensions work better with virtual display
2. **Monitor Resources**: Extensions consume more memory
3. **Test Regularly**: Use `yarn test:extension` to verify functionality
4. **Update Extensions**: Keep CapSolver extension updated

### 🌐 Environment Variables

- `FORCE_HEADLESS=true`: Force headless mode (limited extension support)
- `DISPLAY=:99`: Set virtual display for headed mode
- `NODE_ENV=production`: Production optimizations

### 📚 Related Commands

```bash
# Setup system dependencies
./setup-ubuntu.sh

# Start with extension support  
./start-server.sh

# Test extension functionality
yarn test:extension

# Monitor server
pm2 logs loyverse-api
pm2 monit
```
