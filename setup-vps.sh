#!/bin/bash

# 🚀 VPS Setup Script for Loyverse Automation API
# This script sets up the complete environment with VNC, Chrome, and PM2

set -e

echo "🚀 Starting VPS setup for Loyverse Automation API..."

# Update system packages
echo "📦 Updating system packages..."
apt-get update -y
apt-get upgrade -y

# Install essential packages
echo "🔧 Installing essential packages..."
apt-get install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

# Install Node.js 18.x
echo "📦 Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install Yarn
echo "📦 Installing Yarn..."
npm install -g yarn

# Install PM2
echo "📦 Installing PM2..."
npm install -g pm2

# Install Chrome and dependencies
echo "🌐 Installing Google Chrome..."
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list
apt-get update -y
apt-get install -y google-chrome-stable

# Install VNC and desktop environment
echo "🖥️  Installing VNC and desktop environment..."
apt-get install -y \
    xfce4 \
    xfce4-goodies \
    tightvncserver \
    xvfb \
    x11vnc \
    fluxbox \
    wmctrl

# Install additional packages for Chrome
echo "🔧 Installing Chrome dependencies..."
apt-get install -y \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatspi2.0-0 \
    libdrm2 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    libxss1 \
    libgconf-2-4

# Create VNC password setup script
echo "🔐 Setting up VNC..."
mkdir -p /root/.vnc

# Remove any existing VNC sessions
vncserver -kill :1 >/dev/null 2>&1 || true

# Create VNC password (you should change this)
echo "loyverse123" | vncpasswd -f > /root/.vnc/passwd
chmod 600 /root/.vnc/passwd

# Create VNC startup script
cat > /root/.vnc/xstartup << 'EOF'
#!/bin/bash

# Uncomment the following two lines for normal desktop:
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS

# Load X resources
xrdb $HOME/.Xresources 2>/dev/null || true

# Set background
xsetroot -solid grey

# Start XFCE desktop environment
startxfce4 &

# Alternative for minimal setup (uncomment if XFCE doesn't work):
# exec /etc/X11/Xsession
EOF

chmod +x /root/.vnc/xstartup

# Create systemd service for VNC
cat > /etc/systemd/system/vncserver@.service << 'EOF'
[Unit]
Description=Start TightVNC server at startup
After=syslog.target network.target

[Service]
Type=forking
User=root
Group=root
WorkingDirectory=/root

PIDFile=/root/.vnc/%H:%i.pid
ExecStartPre=-/usr/bin/vncserver -kill :%i > /dev/null 2>&1
ExecStart=/usr/bin/vncserver -depth 24 -geometry 1920x1080 :%i
ExecStop=/usr/bin/vncserver -kill :%i

[Install]
WantedBy=multi-user.target
EOF

# Create X11VNC service for viewing the actual display
cat > /etc/systemd/system/x11vnc.service << 'EOF'
[Unit]
Description=x11vnc service
After=display-manager.service network.target syslog.target

[Service]
Type=simple
ExecStart=/usr/bin/x11vnc -forever -display :1 -bg -nopw -listen localhost -xkb
ExecStop=/usr/bin/killall x11vnc
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

# Start and enable VNC services
systemctl daemon-reload
systemctl enable vncserver@1.service

# Start VNC server manually first to ensure it works
echo "🚀 Starting VNC server manually..."
vncserver :1 -geometry 1920x1080 -depth 24 -localhost no

# Then start the systemd service
systemctl start vncserver@1.service

# Create Xvfb service for headless display
cat > /etc/systemd/system/xvfb.service << 'EOF'
[Unit]
Description=X Virtual Frame Buffer Service
After=network.target

[Service]
ExecStart=/usr/bin/Xvfb :1 -screen 0 1920x1080x24
Restart=on-failure
RestartSec=2

[Install]
WantedBy=multi-user.target
EOF

systemctl enable xvfb.service
systemctl start xvfb.service

# Install project dependencies
echo "📂 Setting up project directory..."
mkdir -p /var/www/loyverse-automation-api
cd /var/www/loyverse-automation-api

# Set up PM2 to start on boot
pm2 startup systemd -u root --hp /root

echo "✅ VPS setup completed!"
echo ""
echo "🔧 Next steps:"
echo "1. Clone your repository to /var/www/loyverse-automation-api"
echo "2. Run 'yarn install' in the project directory"
echo "3. Configure your environment variables"
echo "4. Start the application with PM2"
echo ""
echo "🖥️  VNC Information:"
echo "   - VNC Server running on display :1"
echo "   - Connect to: your-server-ip:5901"
echo "   - Password: loyverse123 (change this!)"
echo ""
echo "🌐 Xvfb Virtual Display:"
echo "   - Running on display :1"
echo "   - Resolution: 1920x1080x24"
echo ""
echo "📊 Services Status:"
systemctl status vncserver@1.service --no-pager
systemctl status xvfb.service --no-pager

echo ""
echo "🔍 VNC Connection Test:"
ps aux | grep -E "(vnc|Xvnc)" | grep -v grep || echo "⚠️  No VNC processes found"

echo ""
echo "🔌 VNC Ports:"
netstat -tlnp | grep -E ":(590[0-9])" || echo "⚠️  No VNC ports listening"

echo ""
echo "🧪 Testing VNC manually (if needed):"
echo "   vncserver -kill :1"
echo "   vncserver :1 -geometry 1920x1080 -depth 24 -localhost no"
echo ""
echo "🔧 Troubleshooting commands:"
echo "   ./diagnose-vnc.sh  # Comprehensive VNC diagnostics"
echo "   ./fix-vnc.sh       # Fix common VNC issues"