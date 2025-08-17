#!/bin/bash

# 🚀 Deployment Script for Loyverse Automation API
# This script handles the complete deployment process

set -e

SERVER_IP="72.60.32.173"
PROJECT_PATH="/var/www/loyverse-automation-api"
REPO_URL="https://github.com/ChromePack/Loyverse-Automation-API"

echo "🚀 Starting deployment to VPS: $SERVER_IP"

# Function to run commands on remote server
run_remote() {
    ssh root@$SERVER_IP "$1"
}

# Function to check if command exists on remote server
command_exists() {
    run_remote "command -v $1 >/dev/null 2>&1"
}

echo "🔍 Checking server connection..."
if ! ssh -o ConnectTimeout=10 root@$SERVER_IP "echo 'Connected successfully'"; then
    echo "❌ Cannot connect to server. Please check your SSH connection."
    exit 1
fi

echo "✅ Server connection established"

echo "📦 Checking if project directory exists..."
if run_remote "[ -d '$PROJECT_PATH' ]"; then
    echo "📂 Project directory exists, updating..."
    run_remote "cd $PROJECT_PATH && git pull origin main"
else
    echo "📂 Creating project directory and cloning repository..."
    run_remote "mkdir -p $PROJECT_PATH"
    run_remote "cd $PROJECT_PATH && git clone $REPO_URL ."
fi

echo "📦 Installing dependencies..."
run_remote "cd $PROJECT_PATH && yarn install --production"

echo "🔧 Setting up file permissions..."
run_remote "cd $PROJECT_PATH && chmod +x start-server.sh setup-vps.sh deploy-vps.sh"

echo "📊 Creating logs directory..."
run_remote "cd $PROJECT_PATH && mkdir -p logs"

echo "🖥️  Checking display services..."
if run_remote "systemctl is-active --quiet xvfb.service"; then
    echo "✅ Xvfb service is running"
else
    echo "🔄 Starting Xvfb service..."
    run_remote "systemctl start xvfb.service"
fi

if run_remote "systemctl is-active --quiet vncserver@1.service"; then
    echo "✅ VNC service is running"
else
    echo "🔄 Starting VNC service..."
    run_remote "systemctl start vncserver@1.service"
fi

echo "🔄 Stopping existing PM2 processes..."
run_remote "cd $PROJECT_PATH && pm2 delete loyverse-automation-api || true"

echo "🚀 Starting application with PM2..."
run_remote "cd $PROJECT_PATH && pm2 start ecosystem.config.js --env production"

echo "💾 Saving PM2 configuration..."
run_remote "pm2 save"

echo "📊 Checking application status..."
run_remote "cd $PROJECT_PATH && pm2 status"

echo "🧪 Testing application health..."
sleep 5
if run_remote "curl -f http://localhost:3000/health >/dev/null 2>&1"; then
    echo "✅ Application is running and healthy!"
else
    echo "⚠️  Application might not be responding yet. Check logs with: pm2 logs loyverse-automation-api"
fi

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📊 Application Information:"
echo "   - URL: http://$SERVER_IP:3000"
echo "   - Health Check: http://$SERVER_IP:3000/health"
echo "   - API Docs: http://$SERVER_IP:3000/api"
echo ""
echo "🖥️  VNC Information:"
echo "   - VNC Server: $SERVER_IP:5901"
echo "   - Password: loyverse123 (change this!)"
echo ""
echo "🔧 Useful Commands:"
echo "   - Check status: ssh root@$SERVER_IP 'pm2 status'"
echo "   - View logs: ssh root@$SERVER_IP 'pm2 logs loyverse-automation-api'"
echo "   - Restart app: ssh root@$SERVER_IP 'pm2 restart loyverse-automation-api'"
echo "   - Monitor: ssh root@$SERVER_IP 'pm2 monit'"