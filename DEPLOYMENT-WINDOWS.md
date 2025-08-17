# 🚀 Windows Deployment Guide

This guide explains how to deploy from Windows to your VPS server.

## 🚨 PM2 Deploy Issue on Windows

The `pm2 deploy` command doesn't work well on Windows due to shell compatibility issues. Use the alternative methods below.

## 📋 Prerequisites

- **Windows with SSH client** (Windows 10+ has built-in SSH)
- **Git Bash** or **PowerShell** 
- **SSH access to your VPS** configured

## 🎯 Deployment Methods

### Method 1: Windows Batch Scripts (Recommended)

#### Step 1: Setup VPS
```cmd
setup-vps.bat
```

#### Step 2: Deploy Application
```cmd
deploy-manual.bat
```

### Method 2: Git Bash/WSL (Alternative)

#### Step 1: Use Git Bash or WSL
```bash
# In Git Bash or WSL
./setup-vps.sh     # Setup VPS
./deploy-vps.sh    # Deploy application
```

### Method 3: Manual SSH Commands

#### Step 1: Setup VPS
```cmd
ssh root@72.60.32.173 "curl -fsSL https://raw.githubusercontent.com/ChromePack/Loyverse-Automation-API/main/setup-vps.sh | bash"
```

#### Step 2: Deploy Application
```cmd
# Clone/update repository
ssh root@72.60.32.173 "mkdir -p /var/www/loyverse-automation-api && cd /var/www/loyverse-automation-api && git clone https://github.com/ChromePack/Loyverse-Automation-API.git . || (git fetch origin && git reset --hard origin/main)"

# Install dependencies
ssh root@72.60.32.173 "cd /var/www/loyverse-automation-api && yarn install --production"

# Set permissions
ssh root@72.60.32.173 "cd /var/www/loyverse-automation-api && chmod +x *.sh"

# Create logs directory
ssh root@72.60.32.173 "cd /var/www/loyverse-automation-api && mkdir -p logs"

# Stop existing PM2 process
ssh root@72.60.32.173 "cd /var/www/loyverse-automation-api && pm2 delete loyverse-automation-api || true"

# Start with PM2
ssh root@72.60.32.173 "cd /var/www/loyverse-automation-api && pm2 start ecosystem.config.js --env production"

# Save PM2 config
ssh root@72.60.32.173 "pm2 save"

# Check status
ssh root@72.60.32.173 "pm2 status"
```

## 🔧 SSH Configuration

### Configure SSH Key (Recommended)

1. **Generate SSH key** (if you don't have one):
```cmd
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"
```

2. **Copy public key to server**:
```cmd
type %USERPROFILE%\.ssh\id_rsa.pub | ssh root@72.60.32.173 "cat >> ~/.ssh/authorized_keys"
```

3. **Test SSH connection**:
```cmd
ssh root@72.60.32.173 "echo 'SSH connection works!'"
```

### SSH Config File (Optional)

Create `%USERPROFILE%\.ssh\config`:
```
Host loyverse-vps
    HostName 72.60.32.173
    User root
    Port 22
    IdentityFile ~/.ssh/id_rsa
    StrictHostKeyChecking no
```

Then use: `ssh loyverse-vps` instead of `ssh root@72.60.32.173`

## 🖥️ VNC Setup for Windows

### Install VNC Viewer

1. **Download VNC Viewer**: https://www.realvnc.com/en/connect/download/viewer/
2. **Connect to**: `72.60.32.173:5901`
3. **Password**: `loyverse123` (change this!)

### Alternative VNC Clients

- **TightVNC Viewer**: https://www.tightvnc.com/download.php
- **UltraVNC**: https://www.uvnc.com/downloads/ultravnc.html

## 📊 Monitoring from Windows

### PowerShell Commands
```powershell
# Check application status
ssh root@72.60.32.173 'pm2 status'

# View logs
ssh root@72.60.32.173 'pm2 logs loyverse-automation-api'

# Restart application
ssh root@72.60.32.173 'pm2 restart loyverse-automation-api'

# Monitor real-time
ssh root@72.60.32.173 'pm2 monit'

# Check health
Invoke-WebRequest -Uri "http://72.60.32.173:3000/health"
```

### Batch Scripts for Common Tasks

Create `monitor.bat`:
```batch
@echo off
echo Checking PM2 status...
ssh root@72.60.32.173 "pm2 status"
echo.
echo Checking application health...
curl -f http://72.60.32.173:3000/health
```

Create `restart.bat`:
```batch
@echo off
echo Restarting application...
ssh root@72.60.32.173 "pm2 restart loyverse-automation-api"
echo Application restarted!
```

## 🐛 Troubleshooting

### Common Issues

1. **SSH Connection Failed**:
   - Verify server IP and port
   - Check if SSH service is running: `ssh root@72.60.32.173 "systemctl status ssh"`
   - Test with verbose output: `ssh -v root@72.60.32.173`

2. **Permission Denied**:
   - Make sure you're using the correct SSH key
   - Check server firewall settings
   - Verify SSH key is added to server

3. **PM2 Command Not Found**:
   - Install PM2 on server: `ssh root@72.60.32.173 "npm install -g pm2"`
   - Check PATH: `ssh root@72.60.32.173 "which pm2"`

4. **Application Won't Start**:
   - Check logs: `ssh root@72.60.32.173 "pm2 logs loyverse-automation-api"`
   - Verify Chrome installation: `ssh root@72.60.32.173 "google-chrome --version"`
   - Check display: `ssh root@72.60.32.173 "echo $DISPLAY"`

### Windows-Specific Issues

1. **Line Ending Problems**:
   ```cmd
   git config --global core.autocrlf false
   ```

2. **Path Issues**:
   - Use forward slashes in paths
   - Escape spaces in paths: `"path with spaces"`

3. **SSH Client Issues**:
   - Use Git Bash for better compatibility
   - Install Windows Subsystem for Linux (WSL)

## ✅ Success Verification

Your deployment is successful when:

1. **SSH connection works**: `ssh root@72.60.32.173 "echo 'Connected!'"`
2. **PM2 shows online**: `ssh root@72.60.32.173 "pm2 status"`
3. **Health check passes**: `curl http://72.60.32.173:3000/health`
4. **VNC connection works**: Connect to `72.60.32.173:5901`

## 🚀 Quick Start Summary

```cmd
# 1. Setup VPS (one time)
setup-vps.bat

# 2. Deploy application
deploy-manual.bat

# 3. Monitor
ssh root@72.60.32.173 "pm2 monit"

# 4. Connect VNC to see browser
# VNC Viewer -> 72.60.32.173:5901 -> password: loyverse123
```