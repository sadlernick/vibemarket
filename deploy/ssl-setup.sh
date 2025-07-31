#!/bin/bash

# PackCode SSL Setup with Let's Encrypt
# Run this script after your domain DNS is properly configured

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔒 PackCode SSL Setup Starting...${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Domain configuration
DOMAIN="pack-code.com"
WWW_DOMAIN="www.pack-code.com"
EMAIL="admin@pack-code.com"  # Change this to your email

# Verify domains are pointing to this server
echo -e "${YELLOW}🌐 Checking DNS configuration...${NC}"
CURRENT_IP=$(curl -s ifconfig.me)
DOMAIN_IP=$(dig +short $DOMAIN | tail -n1)
WWW_IP=$(dig +short $WWW_DOMAIN | tail -n1)

echo "Current server IP: $CURRENT_IP"
echo "Domain ($DOMAIN) points to: $DOMAIN_IP"
echo "WWW domain ($WWW_DOMAIN) points to: $WWW_IP"

if [ "$CURRENT_IP" != "$DOMAIN_IP" ] || [ "$CURRENT_IP" != "$WWW_IP" ]; then
    echo -e "${RED}❌ DNS configuration issue detected!${NC}"
    echo -e "${YELLOW}Please ensure both $DOMAIN and $WWW_DOMAIN point to $CURRENT_IP${NC}"
    echo -e "${YELLOW}You may need to wait for DNS propagation (up to 48 hours)${NC}"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✅ DNS configuration looks good!${NC}"
fi

# Install/Update certbot if needed
echo -e "${YELLOW}📦 Ensuring certbot is installed...${NC}"
apt update
apt install -y certbot python3-certbot-nginx

# Stop nginx temporarily for standalone verification
echo -e "${YELLOW}🔄 Stopping nginx for certificate generation...${NC}"
systemctl stop nginx

# Generate SSL certificates
echo -e "${YELLOW}🔒 Generating SSL certificates...${NC}"
certbot certonly \
    --standalone \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d $WWW_DOMAIN

# Check if certificates were generated successfully
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo -e "${RED}❌ Certificate generation failed!${NC}"
    echo -e "${YELLOW}Please check the error messages above and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ SSL certificates generated successfully!${NC}"

# Copy the production nginx configuration
echo -e "${YELLOW}🌐 Setting up nginx configuration...${NC}"
if [ -f "/var/www/packcode/deploy/nginx-production.conf" ]; then
    cp /var/www/packcode/deploy/nginx-production.conf /etc/nginx/sites-available/packcode
    
    # Enable the site
    ln -sf /etc/nginx/sites-available/packcode /etc/nginx/sites-enabled/
    
    # Remove default site
    rm -f /etc/nginx/sites-enabled/default
else
    echo -e "${YELLOW}⚠️  nginx-production.conf not found, using basic configuration...${NC}"
    
    # Create basic SSL configuration
    cat > /etc/nginx/sites-available/packcode << EOF
server {
    listen 80;
    server_name $DOMAIN $WWW_DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN $WWW_DOMAIN;
    
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    
    root /var/www/packcode/client/build;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:5001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
    
    ln -sf /etc/nginx/sites-available/packcode /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
fi

# Test nginx configuration
echo -e "${YELLOW}🧪 Testing nginx configuration...${NC}"
nginx -t

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Nginx configuration test failed!${NC}"
    exit 1
fi

# Start nginx
echo -e "${YELLOW}🔄 Starting nginx...${NC}"
systemctl start nginx
systemctl enable nginx

# Set up automatic certificate renewal
echo -e "${YELLOW}🔄 Setting up automatic certificate renewal...${NC}"

# Create renewal hook script
cat > /etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh << 'EOF'
#!/bin/bash
systemctl reload nginx
EOF

chmod +x /etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh

# Add renewal cron job
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

# Test certificate renewal (dry run)
echo -e "${YELLOW}🧪 Testing certificate renewal...${NC}"
certbot renew --dry-run

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Certificate renewal test passed!${NC}"
else
    echo -e "${YELLOW}⚠️  Certificate renewal test had issues, but continuing...${NC}"
fi

# Display SSL information
echo -e "${GREEN}🎉 SSL Setup Complete!${NC}"
echo
echo -e "${BLUE}📋 SSL Certificate Information:${NC}"
echo "Domain: $DOMAIN"
echo "Certificate location: /etc/letsencrypt/live/$DOMAIN/"
echo "Certificate expires: $(openssl x509 -enddate -noout -in /etc/letsencrypt/live/$DOMAIN/cert.pem | cut -d= -f2)"
echo
echo -e "${BLUE}🔍 Next Steps:${NC}"
echo "1. Test your site: https://$DOMAIN"
echo "2. Check SSL rating: https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
echo "3. Certificates will auto-renew via cron job"
echo
echo -e "${YELLOW}🛠️  Commands for managing certificates:${NC}"
echo "- View certificates: certbot certificates"
echo "- Renew certificates: certbot renew"
echo "- Test renewal: certbot renew --dry-run"
echo
echo -e "${GREEN}✅ Your PackCode site is now secured with SSL!${NC}"

# Test HTTPS connection
echo -e "${YELLOW}🧪 Testing HTTPS connection...${NC}"
if curl -s -I https://$DOMAIN | grep -q "HTTP/2 200"; then
    echo -e "${GREEN}✅ HTTPS is working correctly!${NC}"
else
    echo -e "${YELLOW}⚠️  HTTPS test inconclusive, please test manually${NC}"
fi