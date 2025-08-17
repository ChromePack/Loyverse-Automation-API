#!/bin/bash

# 🔧 VNC Fix Script
# This script properly configures and starts VNC server

echo "🔧 Fixing VNC server configuration..."

# Kill any existing VNC servers
echo "🔄 Stopping existing VNC servers..."
vncserver -kill :1 >/dev/null 2>&1 || true
vncserver -kill :0 >/dev/null 2>&1 || true

# Remove existing VNC configuration
echo "🗑️  Cleaning VNC configuration..."
rm -rf ~/.vnc

# Create VNC directory
echo "📁 Creating VNC directory..."
mkdir -p ~/.vnc

# Set VNC password
echo "🔐 Setting VNC password..."
echo "loyverse123" | vncpasswd -f > ~/.vnc/passwd
chmod 600 ~/.vnc/passwd

# Create proper xstartup script
echo "📝 Creating VNC startup script..."
cat > ~/.vnc/xstartup << 'EOF'
#!/bin/bash

# Uncomment the following two lines for normal desktop:
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS

# Set background
xsetroot -solid grey

# Start window manager
startxfce4 &

# Alternative for minimal setup:
# exec /etc/X11/Xsession
EOF

chmod +x ~/.vnc/xstartup

# Start VNC server with proper configuration
echo "🚀 Starting VNC server..."
vncserver :1 -geometry 1920x1080 -depth 24 -localhost no

# Check if VNC is running
echo "📊 Checking VNC server status..."
if pgrep -f "Xvnc.*:1" > /dev/null; then
    echo "✅ VNC server is running on display :1"
    echo "🔗 Connect to: $(hostname -I | awk '{print $1}'):5901"
    echo "🔑 Password: loyverse123"
else
    echo "❌ VNC server failed to start"
    echo "🔍 Checking logs..."
    cat ~/.vnc/*.log | tail -20
fi

# Alternative: Start x11vnc for real display sharing
echo "🖥️  Starting x11vnc for display :1..."
pkill x11vnc >/dev/null 2>&1 || true
x11vnc -display :1 -forever -shared -viewonly -nopw -listen 0.0.0.0 -rfbport 5902 &

echo "📊 VNC Services Status:"
echo "Port 5901: TightVNC server (full control)"
echo "Port 5902: x11vnc server (view only)"
echo ""
echo "🔧 To connect:"
echo "- Full control: your-vnc-viewer -> server-ip:5901 (password: loyverse123)"
echo "- View only: your-vnc-viewer -> server-ip:5902 (no password)"