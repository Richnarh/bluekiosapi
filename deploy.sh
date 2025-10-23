#!/bin/bash

# VARIABLES
SERVER_USER="root"
SERVER_IP="194.163.144.61"
REMOTE_PATH="/var/www/bluekios"
PM2_APP_NAME="bluekios"

echo "🚀 Starting Deployment..."

#  Install and build backend locally
echo "Installing dependencies..."
npm install --production=false

echo "Building project..."
npm run build

# Copy build folder to VPS
echo "Uploading build to server..."
rsync -avz --delete ./dist/ $SERVER_USER@$SERVER_IP:$REMOTE_PATH/dist/

# Restart PM2 service on VPS
echo "Restarting PM2 app..."
ssh $SERVER_USER@$SERVER_IP "pm2 restart $PM2_APP_NAME"

echo "Deployment completed successfully!"
