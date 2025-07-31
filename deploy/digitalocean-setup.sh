#!/bin/bash

# PackCode DigitalOcean Production Setup Script
# This script sets up a DigitalOcean droplet for hosting PackCode

set -e

echo "🚀 PackCode DigitalOcean Setup Starting..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
apt update && apt upgrade -y

# Install Node.js 18.x
echo -e "${YELLOW}📦 Installing Node.js 18.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install PM2 globally
echo -e "${YELLOW}📦 Installing PM2...${NC}"
npm install -g pm2

# Install nginx
echo -e "${YELLOW}📦 Installing nginx...${NC}"
apt install -y nginx

# Install certbot for SSL
echo -e "${YELLOW}📦 Installing certbot for SSL...${NC}"
apt install -y certbot python3-certbot-nginx

# Install Git
echo -e "${YELLOW}📦 Installing Git...${NC}"
apt install -y git

# Create application user
echo -e "${YELLOW}👤 Creating packcode user...${NC}"
useradd -m -s /bin/bash packcode
usermod -aG sudo packcode

# Create application directory
echo -e "${YELLOW}📁 Setting up application directory...${NC}"
mkdir -p /var/www/packcode
chown packcode:packcode /var/www/packcode

# Setup firewall
echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# Configure nginx (basic setup)
echo -e "${YELLOW}🌐 Setting up nginx basic configuration...${NC}"
cat > /etc/nginx/sites-available/packcode << 'EOF'
server {
    listen 80;
    server_name pack-code.com www.pack-code.com;
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name pack-code.com www.pack-code.com;
    
    # SSL configuration will be added by certbot
    
    # Serve React app
    location / {
        root /var/www/packcode/client/build;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API routes
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
    }
    
    # Security headers for all routes
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin";
}
EOF

# Enable the site
ln -s /etc/nginx/sites-available/packcode /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t

# Start and enable services
echo -e "${YELLOW}🔄 Starting services...${NC}"
systemctl start nginx
systemctl enable nginx

# Create deploy script for packcode user
echo -e "${YELLOW}📝 Creating deployment script...${NC}"
cat > /home/packcode/deploy.sh << 'EOF'
#!/bin/bash

# PackCode Deployment Script
set -e

echo "🚀 Starting PackCode deployment..."

# Navigate to application directory
cd /var/www/packcode

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Install server dependencies
echo "📦 Installing server dependencies..."
npm install --production

# Install client dependencies and build
echo "📦 Building client..."
cd client
npm install
npm run build
cd ..

# Restart PM2 application
echo "🔄 Restarting application..."
pm2 restart packcode || pm2 start server/index.js --name packcode

# Reload nginx
echo "🌐 Reloading nginx..."
sudo systemctl reload nginx

echo "✅ Deployment complete!"
EOF

chmod +x /home/packcode/deploy.sh
chown packcode:packcode /home/packcode/deploy.sh

# Create PM2 ecosystem file
cat > /home/packcode/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'packcode',
    script: '/var/www/packcode/server/index.js',
    cwd: '/var/www/packcode',
    env: {
      NODE_ENV: 'production',
      PORT: 5001
    },
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/log/packcode/error.log',
    out_file: '/var/log/packcode/out.log',
    log_file: '/var/log/packcode/combined.log',
    time: true
  }]
};
EOF

chown packcode:packcode /home/packcode/ecosystem.config.js

# Create log directory
mkdir -p /var/log/packcode
chown packcode:packcode /var/log/packcode

echo -e "${GREEN}✅ DigitalOcean setup complete!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Switch to packcode user: sudo su - packcode"
echo "2. Clone your repository: git clone https://github.com/yourusername/appmarketplace.git /var/www/packcode"
echo "3. Set up environment variables: cp /var/www/packcode/.env.production /var/www/packcode/.env"
echo "4. Run initial deployment: /home/packcode/deploy.sh"
echo "5. Set up SSL: sudo certbot --nginx -d pack-code.com -d www.pack-code.com"
echo "6. Set up PM2 startup: pm2 startup && pm2 save"