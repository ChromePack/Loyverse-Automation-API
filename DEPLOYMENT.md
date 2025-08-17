# 🚀 VPS Deployment Guide

This guide explains how to deploy the Loyverse Automation API on your VPS with PM2, VNC, and virtual display support.

## 📋 Prerequisites

- VPS with Ubuntu 20.04+ or Debian 11+
- SSH access to the server
- Node.js 18.x or higher
- At least 2GB RAM and 20GB storage

## 🎯 Quick Deployment

### Option 1: Automated Setup (Recommended)

1. **Run the setup script on your VPS**:
   ```bash
   ssh root@72.60.32.173
   wget https://raw.githubusercontent.com/ChromePack/Loyverse-Automation-API/main/setup-vps.sh
   chmod +x setup-vps.sh
   ./setup-vps.sh
   ```

2. **Deploy the application**:
   ```bash
   # From your local machine
   ./deploy-vps.sh
   ```

### Option 2: Manual Setup

1. **Initial server setup**:
   ```bash
   ssh root@72.60.32.173
   apt-get update && apt-get upgrade -y
   ```

2. **Install Node.js and PM2**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
   apt-get install -y nodejs
   npm install -g yarn pm2
   ```

3. **Install Chrome and VNC**:
   ```bash
   # Install Chrome
   wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
   echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list
   apt-get update
   apt-get install -y google-chrome-stable
   
   # Install VNC and Xvfb
   apt-get install -y xfce4 tightvncserver xvfb x11vnc
   ```

4. **Clone and setup project**:
   ```bash
   mkdir -p /var/www/loyverse-automation-api
   cd /var/www/loyverse-automation-api
   git clone https://github.com/ChromePack/Loyverse-Automation-API .
   yarn install --production
   chmod +x start-server.sh
   ```

5. **Start services**:
   ```bash
   # Start virtual display
   Xvfb :1 -screen 0 1920x1080x24 &
   
   # Start VNC (optional for viewing)
   vncserver :1
   
   # Start application with PM2
   pm2 start ecosystem.config.js --env production
   pm2 save
   pm2 startup
   ```

## 🖥️ VNC Configuration

### Setting up VNC for Remote Viewing

1. **Configure VNC password**:
   ```bash
   vncpasswd
   # Enter password: loyverse123 (or your preferred password)
   ```

2. **Start VNC server**:
   ```bash
   vncserver :1 -geometry 1920x1080 -depth 24
   ```

3. **Connect from your local machine**:
   - **Windows**: Use VNC Viewer, connect to `72.60.32.173:5901`
   - **Mac**: Use VNC Viewer or Screen Sharing, connect to `vnc://72.60.32.173:5901`
   - **Linux**: Use `vncviewer 72.60.32.173:5901`

### VNC Service Setup (Auto-start)

Create systemd service for automatic VNC startup:

```bash
# Create service file
sudo tee /etc/systemd/system/vncserver@.service << 'EOF'
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

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable vncserver@1.service
sudo systemctl start vncserver@1.service
```

## 🔧 PM2 Configuration

The `ecosystem.config.js` file configures:

- **Display**: `:1` (virtual display)
- **Memory limit**: 2GB with auto-restart
- **Environment**: Production variables
- **Logging**: Structured logs in `./logs/`
- **Auto-restart**: On crashes or memory limit

### PM2 Commands

```bash
# Status and monitoring
pm2 status
pm2 monit
pm2 logs loyverse-automation-api

# Control
pm2 restart loyverse-automation-api
pm2 stop loyverse-automation-api
pm2 delete loyverse-automation-api

# Deployment
pm2 deploy production setup    # First time setup
pm2 deploy production         # Deploy updates
```

## 🌐 Application Access

Once deployed, access your application:

- **API**: `http://72.60.32.173:3000`
- **Health Check**: `http://72.60.32.173:3000/health`
- **API Documentation**: `http://72.60.32.173:3000/api`

## 🔍 Troubleshooting

### Check Services Status

```bash
# Check all services
systemctl status xvfb.service
systemctl status vncserver@1.service
pm2 status

# Check application logs
pm2 logs loyverse-automation-api
tail -f /var/www/loyverse-automation-api/logs/pm2-combined.log
```

### Common Issues

1. **Browser won't start**:
   ```bash
   # Check Chrome installation
   google-chrome --version
   
   # Check display
   echo $DISPLAY
   xdpyinfo -display :1
   ```

2. **VNC connection issues**:
   ```bash
   # Check VNC processes
   ps aux | grep vnc
   
   # Restart VNC
   vncserver -kill :1
   vncserver :1 -geometry 1920x1080 -depth 24
   ```

3. **Application crashes**:
   ```bash
   # Check memory usage
   free -h
   
   # Check Chrome processes
   ps aux | grep chrome
   
   # Restart with more memory
   pm2 restart loyverse-automation-api
   ```

### Memory Optimization

If you encounter memory issues:

```bash
# Increase swap (if needed)
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Add to /etc/fstab for persistence
echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
```

## 🔐 Security Considerations

1. **Change VNC password**:
   ```bash
   vncpasswd
   ```

2. **Firewall configuration**:
   ```bash
   # Allow only necessary ports
   ufw allow 22    # SSH
   ufw allow 3000  # Application
   ufw allow 5901  # VNC (optional, can be restricted to specific IPs)
   ufw enable
   ```

3. **Environment variables**:
   - Store sensitive data in environment variables
   - Use `.env` file for local development only
   - Consider using PM2's keymetrics for secrets management

## 📊 Monitoring

### PM2 Plus Integration (Optional)

```bash
# Register with PM2 Plus for advanced monitoring
pm2 link <secret_key> <public_key>
```

### Basic Monitoring

```bash
# Real-time monitoring
pm2 monit

# Log rotation
pm2 install pm2-logrotate
```

## 🎉 Success Indicators

Your deployment is successful when:

- ✅ PM2 shows application as `online`
- ✅ Health check returns `200 OK`
- ✅ VNC connection works (if configured)
- ✅ Browser automation runs without errors
- ✅ Logs show no critical errors

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review application logs: `pm2 logs loyverse-automation-api`
3. Check system resources: `htop` or `pm2 monit`
4. Verify Chrome installation and display configuration