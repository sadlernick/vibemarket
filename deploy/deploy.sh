#!/bin/bash

# PackCode Automated Deployment Script
# Handles full deployment with zero-downtime updates

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/packcode"
BACKUP_DIR="/var/backups/packcode"
LOG_FILE="/var/log/packcode/deploy.log"
MAX_BACKUPS=5

# Ensure we're running as the packcode user
if [ "$USER" != "packcode" ]; then
    echo -e "${RED}❌ This script must be run as the packcode user${NC}"
    echo "Run: sudo su - packcode"
    exit 1
fi

# Create log directory if it doesn't exist
sudo mkdir -p /var/log/packcode
sudo chown packcode:packcode /var/log/packcode

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

echo -e "${BLUE}🚀 PackCode Deployment Starting...${NC}"
log "Deployment started by $USER"

# Pre-deployment checks
echo -e "${YELLOW}🔍 Running pre-deployment checks...${NC}"

# Check if app directory exists
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}❌ Application directory not found: $APP_DIR${NC}"
    exit 1
fi

cd "$APP_DIR"

# Check if git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Not a git repository. Please clone your repository first.${NC}"
    exit 1
fi

# Check if environment file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Environment file not found. Run environment-setup.sh first.${NC}"
    exit 1
fi

# Check if Node.js and npm are available
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Pre-deployment checks passed${NC}"

# Create backup
echo -e "${YELLOW}💾 Creating backup...${NC}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="packcode_backup_$TIMESTAMP"

sudo mkdir -p "$BACKUP_DIR"

# Create backup excluding node_modules and git
tar --exclude='node_modules' --exclude='.git' --exclude='client/build' \
    -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" -C "$(dirname $APP_DIR)" "$(basename $APP_DIR)"

sudo chown packcode:packcode "$BACKUP_DIR/$BACKUP_NAME.tar.gz"
log "Backup created: $BACKUP_DIR/$BACKUP_NAME.tar.gz"

# Clean up old backups
echo -e "${YELLOW}🧹 Cleaning up old backups...${NC}"
cd "$BACKUP_DIR"
ls -t packcode_backup_*.tar.gz | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm --
log "Cleaned up old backups, keeping $MAX_BACKUPS most recent"

cd "$APP_DIR"

# Git operations
echo -e "${YELLOW}📥 Pulling latest changes...${NC}"
log "Pulling from git repository"

# Stash any local changes
git stash push -m "Auto-stash before deployment $TIMESTAMP" || true

# Fetch and pull latest changes
git fetch origin
git pull origin main

COMMIT_HASH=$(git rev-parse --short HEAD)
log "Updated to commit: $COMMIT_HASH"

# Install/update server dependencies
echo -e "${YELLOW}📦 Installing server dependencies...${NC}"
log "Installing server dependencies"
npm ci --production

# Install/update client dependencies and build
echo -e "${YELLOW}📦 Building client application...${NC}"
log "Building client application"
cd client

# Install client dependencies
npm ci

# Build production client
npm run build

if [ ! -d "build" ]; then
    echo -e "${RED}❌ Client build failed - build directory not found${NC}"
    log "ERROR: Client build failed"
    exit 1
fi

log "Client build completed successfully"
cd ..

# Database migration (if needed)
echo -e "${YELLOW}🗄️  Checking database...${NC}"
log "Running database checks"

# Test database connection
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Database connection successful');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  });
" || {
    echo -e "${RED}❌ Database connection failed${NC}"
    log "ERROR: Database connection failed"
    exit 1
}

log "Database connection verified"

# PM2 operations
echo -e "${YELLOW}🔄 Managing application process...${NC}"

# Check if PM2 process exists
if pm2 describe packcode > /dev/null 2>&1; then
    echo -e "${YELLOW}🔄 Restarting existing application...${NC}"
    log "Restarting PM2 process"
    pm2 restart packcode
else
    echo -e "${YELLOW}🚀 Starting new application...${NC}"
    log "Starting new PM2 process"
    
    # Use ecosystem file if available
    if [ -f "ecosystem.config.js" ]; then
        pm2 start ecosystem.config.js
    else
        pm2 start server/index.js --name packcode
    fi
fi

# Wait for application to start
sleep 5

# Health check
echo -e "${YELLOW}🏥 Running health checks...${NC}"
log "Running post-deployment health checks"

# Check if PM2 process is running
if ! pm2 describe packcode | grep -q "online"; then
    echo -e "${RED}❌ Application failed to start${NC}"
    log "ERROR: Application failed to start"
    
    # Show PM2 logs
    echo -e "${YELLOW}📋 Recent logs:${NC}"
    pm2 logs packcode --lines 20 --nostream
    exit 1
fi

# Test API endpoint
sleep 3
API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/api/health || echo "000")

if [ "$API_HEALTH" = "200" ]; then
    echo -e "${GREEN}✅ API health check passed${NC}"
    log "API health check passed"
else
    echo -e "${RED}❌ API health check failed (HTTP $API_HEALTH)${NC}"
    log "ERROR: API health check failed (HTTP $API_HEALTH)"
    
    # Show recent logs
    echo -e "${YELLOW}📋 Recent application logs:${NC}"
    pm2 logs packcode --lines 10 --nostream
    exit 1
fi

# Reload nginx
echo -e "${YELLOW}🌐 Reloading nginx...${NC}"
sudo systemctl reload nginx

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Nginx reloaded successfully${NC}"
    log "Nginx reloaded successfully"
else
    echo -e "${RED}❌ Nginx reload failed${NC}"
    log "ERROR: Nginx reload failed"
fi

# Final verification
echo -e "${YELLOW}🔍 Final verification...${NC}"

# Test HTTPS endpoint (if SSL is configured)
if curl -s -k https://localhost > /dev/null 2>&1; then
    echo -e "${GREEN}✅ HTTPS endpoint responding${NC}"
    log "HTTPS endpoint verification passed"
else
    echo -e "${YELLOW}⚠️  HTTPS endpoint not responding (may not be configured yet)${NC}"
    log "WARNING: HTTPS endpoint not responding"
fi

# Clean up
echo -e "${YELLOW}🧹 Cleaning up...${NC}"

# Clear npm cache
npm cache clean --force > /dev/null 2>&1 || true

# Remove any stale lock files
rm -f package-lock.json.bak
rm -f client/package-lock.json.bak

log "Cleanup completed"

# Success message
echo
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo
echo -e "${BLUE}📋 Deployment Summary:${NC}"
echo "Timestamp: $(date)"
echo "Commit: $COMMIT_HASH"
echo "Backup: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
echo "PM2 Status: $(pm2 describe packcode | grep 'status' | awk '{print $4}' || echo 'Unknown')"
echo "API Health: HTTP $API_HEALTH"
echo
echo -e "${BLUE}🔧 Useful Commands:${NC}"
echo "View logs: pm2 logs packcode"
echo "Monitor: pm2 monit"
echo "Restart: pm2 restart packcode"
echo "Stop: pm2 stop packcode"
echo
echo -e "${BLUE}🌐 Test Your Site:${NC}"
echo "API: curl http://localhost:5001/api/health"
echo "Web: Open your domain in a browser"

log "Deployment completed successfully - commit: $COMMIT_HASH"

# Send deployment notification (if configured)
if [ ! -z "$SLACK_WEBHOOK" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🚀 PackCode deployed successfully - commit: $COMMIT_HASH\"}" \
        "$SLACK_WEBHOOK" > /dev/null 2>&1 || true
fi

echo -e "${GREEN}✅ PackCode is now running the latest version!${NC}"