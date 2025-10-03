#!/bin/bash

# 🔍 Check Server Dependencies for Loyverse Automation API
# Run this on your Hostinger server to verify all dependencies are installed

echo "🔍 Checking Loyverse Automation API Dependencies..."
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "⚠️  Warning: Not running as root. Some checks may fail."
  echo ""
fi

# Check Node.js
echo "📦 Node.js:"
if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  echo "   ✅ Node.js installed: $NODE_VERSION"
else
  echo "   ❌ Node.js not found"
fi

# Check npm
echo "📦 npm:"
if command -v npm &> /dev/null; then
  NPM_VERSION=$(npm --version)
  echo "   ✅ npm installed: $NPM_VERSION"
else
  echo "   ❌ npm not found"
fi

# Check Yarn
echo "📦 Yarn:"
if command -v yarn &> /dev/null; then
  YARN_VERSION=$(yarn --version)
  echo "   ✅ Yarn installed: $YARN_VERSION"
else
  echo "   ❌ Yarn not found"
fi

# Check PM2
echo "📦 PM2:"
if command -v pm2 &> /dev/null; then
  PM2_VERSION=$(pm2 --version)
  echo "   ✅ PM2 installed: $PM2_VERSION"
else
  echo "   ❌ PM2 not found"
fi

# Check Chrome
echo "🌐 Google Chrome:"
if command -v google-chrome &> /dev/null; then
  CHROME_VERSION=$(google-chrome --version)
  echo "   ✅ Chrome installed: $CHROME_VERSION"
  CHROME_PATH=$(which google-chrome)
  echo "   📍 Location: $CHROME_PATH"
else
  echo "   ❌ Chrome not found"
fi

# Check DISPLAY environment variable
echo "🖥️  Display Configuration:"
if [ -n "$DISPLAY" ]; then
  echo "   ✅ DISPLAY set to: $DISPLAY"
else
  echo "   ⚠️  DISPLAY not set (headless mode will be used)"
fi

# Check Xvfb
echo "🖥️  Xvfb (Virtual Display):"
if command -v Xvfb &> /dev/null; then
  echo "   ✅ Xvfb installed"
  if pgrep -x "Xvfb" > /dev/null; then
    echo "   ✅ Xvfb is running"
    XVFB_DISPLAY=$(ps aux | grep Xvfb | grep -v grep | awk '{print $12}')
    echo "   📍 Display: $XVFB_DISPLAY"
  else
    echo "   ⚠️  Xvfb not running"
  fi
else
  echo "   ❌ Xvfb not found"
fi

# Check VNC
echo "🖥️  VNC Server:"
if command -v vncserver &> /dev/null; then
  echo "   ✅ VNC Server installed"
  if pgrep -x "Xvnc" > /dev/null; then
    echo "   ✅ VNC is running"
  else
    echo "   ⚠️  VNC not running"
  fi
else
  echo "   ❌ VNC Server not found"
fi

# Check Chrome dependencies
echo "🔧 Chrome Dependencies:"
MISSING_DEPS=()

DEPS=(
  "libnss3"
  "libatk-bridge2.0-0"
  "libdrm2"
  "libgtk-3-0"
  "libgbm1"
  "libasound2"
)

for dep in "${DEPS[@]}"; do
  if dpkg -l | grep -q "$dep"; then
    echo "   ✅ $dep"
  else
    echo "   ❌ $dep (missing)"
    MISSING_DEPS+=("$dep")
  fi
done

# Summary
echo ""
echo "📊 Summary:"
if [ ${#MISSING_DEPS[@]} -eq 0 ]; then
  echo "   ✅ All dependencies installed!"
else
  echo "   ⚠️  Missing ${#MISSING_DEPS[@]} dependencies"
  echo ""
  echo "   Install missing dependencies with:"
  echo "   sudo apt-get install -y ${MISSING_DEPS[*]}"
fi

# Check environment file
echo ""
echo "📝 Environment Configuration:"
if [ -f ".env" ]; then
  echo "   ✅ .env file exists"

  # Check DISPLAY in .env
  if grep -q "^DISPLAY=" .env; then
    DISPLAY_VALUE=$(grep "^DISPLAY=" .env | cut -d '=' -f2)
    echo "   ✅ DISPLAY configured: $DISPLAY_VALUE"
  else
    echo "   ⚠️  DISPLAY not configured in .env"
    echo "   💡 Add: DISPLAY=:1"
  fi

  # Check FORCE_HEADLESS
  if grep -q "^FORCE_HEADLESS=" .env; then
    HEADLESS_VALUE=$(grep "^FORCE_HEADLESS=" .env | cut -d '=' -f2)
    echo "   ✅ FORCE_HEADLESS configured: $HEADLESS_VALUE"
  else
    echo "   ⚠️  FORCE_HEADLESS not configured in .env"
  fi
else
  echo "   ❌ .env file not found"
  echo "   💡 Copy .env.example to .env and configure"
fi

# Test Chrome launch
echo ""
echo "🧪 Testing Chrome Launch:"
echo "   Running quick Chrome test..."

CHROME_TEST=$(google-chrome --headless --disable-gpu --dump-dom https://www.google.com 2>&1 | head -1)
if [ $? -eq 0 ]; then
  echo "   ✅ Chrome can launch successfully"
else
  echo "   ❌ Chrome failed to launch"
  echo "   Error: $CHROME_TEST"
fi

echo ""
echo "✅ Dependency check complete!"
echo ""
echo "💡 Next Steps:"
echo "   1. Fix any missing dependencies shown above"
echo "   2. Ensure DISPLAY=:1 in your .env file"
echo "   3. Start Xvfb if not running: sudo systemctl start xvfb"
echo "   4. Test the application: yarn test:browser"
