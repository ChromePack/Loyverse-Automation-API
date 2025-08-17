#!/bin/bash

# Set up virtual display for VNC
export DISPLAY=:1

# Set production environment
export NODE_ENV=production

# Ensure logs directory exists
mkdir -p logs

# Start the Node.js server
echo "🚀 Starting Loyverse Automation API server with VNC display..."
echo "📊 Environment: $NODE_ENV"
echo "🖥️  Display: $DISPLAY"
echo "🚪 Port: ${PORT:-3000}"

# Start the server
node src/server.js