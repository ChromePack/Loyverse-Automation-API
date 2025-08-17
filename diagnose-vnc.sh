#!/bin/bash

# 🔍 VNC Diagnostic Script
# This script diagnoses VNC connection issues

echo "🔍 VNC Diagnostic Report"
echo "======================="
echo

# Check system info
echo "📊 System Information:"
echo "Hostname: $(hostname)"
echo "IP Address: $(hostname -I | awk '{print $1}')"
echo "OS: $(lsb_release -d 2>/dev/null | cut -f2 || cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
echo

# Check VNC processes
echo "🖥️  VNC Processes:"
ps aux | grep -E "(vnc|Xvnc)" | grep -v grep || echo "No VNC processes found"
echo

# Check listening ports
echo "🔌 Network Ports:"
netstat -tlnp | grep -E ":(590[0-9]|580[0-9])" || echo "No VNC ports listening"
echo

# Check VNC configuration
echo "📁 VNC Configuration:"
if [ -d ~/.vnc ]; then
    echo "VNC directory exists: ~/.vnc"
    ls -la ~/.vnc/
    echo
    if [ -f ~/.vnc/passwd ]; then
        echo "✅ VNC password file exists"
    else
        echo "❌ VNC password file missing"
    fi
    
    if [ -f ~/.vnc/xstartup ]; then
        echo "✅ VNC startup script exists"
        echo "Startup script content:"
        cat ~/.vnc/xstartup
    else
        echo "❌ VNC startup script missing"
    fi
else
    echo "❌ VNC directory does not exist"
fi
echo

# Check VNC logs
echo "📋 Recent VNC Logs:"
if ls ~/.vnc/*.log 1> /dev/null 2>&1; then
    for log in ~/.vnc/*.log; do
        echo "=== $log ==="
        tail -10 "$log"
        echo
    done
else
    echo "No VNC log files found"
fi

# Check X11 and display
echo "🖼️  Display Information:"
echo "DISPLAY variable: ${DISPLAY:-'not set'}"
echo "Xvfb processes:"
ps aux | grep Xvfb | grep -v grep || echo "No Xvfb processes found"
echo

# Check installed packages
echo "📦 Installed VNC Packages:"
dpkg -l | grep -E "(vnc|xvfb|x11)" | awk '{print $2 " " $3}' || echo "Package check failed"
echo

# Check firewall
echo "🛡️  Firewall Status:"
ufw status 2>/dev/null || iptables -L -n | head -10 2>/dev/null || echo "Cannot check firewall"
echo

# Test VNC connection locally
echo "🧪 Local VNC Test:"
if command -v vncviewer >/dev/null 2>&1; then
    timeout 3 vncviewer -autopass localhost:1 2>&1 | head -5 || echo "Local VNC test failed"
else
    echo "vncviewer not available for local testing"
fi
echo

# Recommendations
echo "💡 Recommendations:"
echo "1. Make sure VNC server is running: vncserver :1"
echo "2. Check password: vncpasswd"
echo "3. Verify network connectivity: telnet your-server 5901"
echo "4. Check firewall: ufw allow 5901"
echo "5. Try view-only mode: x11vnc -display :1 -nopw"
echo

echo "🔧 Quick fixes:"
echo "./fix-vnc.sh          # Fix VNC configuration"
echo "vncserver -kill :1    # Stop VNC server"
echo "vncserver :1          # Start VNC server"