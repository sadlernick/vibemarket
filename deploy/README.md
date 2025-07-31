# PackCode Production Deployment Scripts

This directory contains all the scripts and configurations needed to deploy PackCode to production on pack-code.com.

## 🚀 Quick Start

### 1. Server Setup (DigitalOcean)
```bash
# On your DigitalOcean droplet as root
curl -o setup.sh https://raw.githubusercontent.com/yourusername/appmarketplace/main/deploy/digitalocean-setup.sh
chmod +x setup.sh
sudo ./setup.sh
```

### 2. Clone Repository
```bash
# Switch to packcode user
sudo su - packcode

# Clone your repository
git clone https://github.com/yourusername/appmarketplace.git /var/www/packcode
cd /var/www/packcode
```

### 3. Environment Setup
```bash
# Make scripts executable
chmod +x deploy/*.sh

# Set up environment variables
sudo ./deploy/environment-setup.sh
```

### 4. SSL Setup
```bash
# Configure SSL certificates (after DNS is pointing to your server)
sudo ./deploy/ssl-setup.sh
```

### 5. Deploy Application
```bash
# Switch to packcode user and deploy
sudo su - packcode
cd /var/www/packcode
./deploy/deploy.sh
```

## 📁 Files Overview

### Core Scripts
- **`digitalocean-setup.sh`** - Complete server setup for DigitalOcean
- **`environment-setup.sh`** - Interactive environment variable configuration
- **`ssl-setup.sh`** - SSL certificate setup with Let's Encrypt
- **`deploy.sh`** - Zero-downtime deployment script

### Configuration Files
- **`nginx-production.conf`** - Production nginx configuration
- **`mongodb-atlas-setup.md`** - MongoDB Atlas setup guide

## 🛠️ Detailed Setup Guide

### Prerequisites
- DigitalOcean droplet (or similar VPS) with Ubuntu 20.04+
- Domain name (pack-code.com) pointing to your server
- MongoDB Atlas account (or self-hosted MongoDB)
- GitHub repository with your code

### Step-by-Step Deployment

#### 1. Server Initial Setup
```bash
# Update system and install basic tools
apt update && apt upgrade -y
apt install -y curl git ufw

# Run the setup script
./deploy/digitalocean-setup.sh
```

This script will:
- Install Node.js 18.x, PM2, nginx, certbot
- Create packcode user
- Configure firewall
- Set up basic nginx configuration
- Create deployment scripts

#### 2. Database Setup
Follow the MongoDB Atlas guide: `mongodb-atlas-setup.md`

Key points:
- Create M2 cluster ($9/month)
- Set up database user and network access
- Create performance indexes
- Get connection string

#### 3. Environment Configuration
```bash
# Run interactive setup
./deploy/environment-setup.sh
```

This will prompt for:
- MongoDB connection string
- OAuth credentials (GitHub, Google)
- Stripe API keys
- Email configuration
- OpenAI API key (optional)

#### 4. SSL Certificate Setup
```bash
# Ensure DNS is pointing to your server first!
./deploy/ssl-setup.sh
```

This script will:
- Verify DNS configuration
- Generate Let's Encrypt certificates
- Configure nginx with SSL
- Set up auto-renewal

#### 5. Application Deployment
```bash
# Deploy the application
./deploy/deploy.sh
```

This script will:
- Create backup of current version
- Pull latest code from git
- Install dependencies
- Build React application
- Restart PM2 processes
- Run health checks
- Reload nginx

## 🔧 Configuration Details

### Nginx Configuration
The production nginx config includes:
- HTTP to HTTPS redirect
- Rate limiting for API endpoints
- Security headers
- Gzip compression
- Static asset caching
- Proxy configuration for API

### PM2 Process Management
- Automatic restart on crashes
- Log rotation
- Memory limits
- Health monitoring

### SSL Configuration
- Let's Encrypt certificates
- Strong SSL protocols (TLS 1.2+)
- HSTS headers
- Auto-renewal via cron

## 📊 Monitoring & Maintenance

### Application Monitoring
```bash
# View application status
pm2 status

# View logs
pm2 logs packcode

# Monitor in real-time
pm2 monit

# Restart application
pm2 restart packcode
```

### System Monitoring
```bash
# Check nginx status
sudo systemctl status nginx

# View nginx logs
sudo tail -f /var/log/nginx/packcode_access.log
sudo tail -f /var/log/nginx/packcode_error.log

# Check SSL certificate
certbot certificates

# Test SSL renewal
certbot renew --dry-run
```

### Database Monitoring
- Use MongoDB Atlas dashboard
- Monitor connection count
- Check slow queries
- Review performance metrics

## 🔄 Updates & Deployment

### Regular Deployments
```bash
# Simple deployment (as packcode user)
cd /var/www/packcode
./deploy/deploy.sh
```

### Rollback Process
```bash
# List available backups
ls -la /var/backups/packcode/

# Restore from backup if needed
sudo tar -xzf /var/backups/packcode/packcode_backup_TIMESTAMP.tar.gz -C /var/www/

# Restart application
pm2 restart packcode
```

### Emergency Procedures
```bash
# Stop application
pm2 stop packcode

# Check what's wrong
pm2 logs packcode --lines 50

# Start in fork mode for debugging
pm2 start server/index.js --name packcode-debug --no-daemon
```

## 🔒 Security Considerations

### Server Security
- Firewall configured (UFW)
- SSH key authentication (disable password auth)
- Regular security updates
- Non-root application user
- Rate limiting in nginx

### Application Security
- Environment variables secured
- HTTPS enforced
- Security headers configured
- Input validation
- SQL injection prevention

### Database Security
- MongoDB Atlas network restrictions
- Strong database passwords
- Regular backups
- Connection encryption

## 💰 Cost Breakdown

### Minimal Setup (~$35/month)
- DigitalOcean Droplet (2GB): $20/month
- MongoDB Atlas M2: $9/month  
- Domain: $12/year (~$1/month)
- SSL: Free (Let's Encrypt)

### Recommended Setup (~$75/month)
- DigitalOcean Droplet (4GB): $25/month
- MongoDB Atlas M10: $57/month
- Domain: $12/year
- Monitoring/backup services: ~$10/month

## 🆘 Troubleshooting

### Common Issues

#### DNS Not Propagating
```bash
# Check DNS
dig pack-code.com
nslookup pack-code.com

# Wait up to 48 hours for full propagation
```

#### SSL Certificate Fails
```bash
# Check nginx is stopped
sudo systemctl stop nginx

# Try manual certificate generation
certbot certonly --standalone -d pack-code.com -d www.pack-code.com
```

#### Application Won't Start
```bash
# Check logs
pm2 logs packcode

# Check environment variables
cd /var/www/packcode && node -e "console.log(process.env.MONGODB_URI)"

# Test database connection
node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('OK')).catch(console.error)"
```

#### High Memory Usage
```bash
# Check PM2 memory usage
pm2 monit

# Restart if needed
pm2 restart packcode

# Consider upgrading server
```

## 📞 Support

### Log Locations
- Application logs: `/var/log/packcode/`
- Nginx logs: `/var/log/nginx/`
- PM2 logs: `~/.pm2/logs/`
- System logs: `/var/log/syslog`

### Health Checks
- API: `curl https://pack-code.com/api/health`
- Application: `pm2 status`
- Database: MongoDB Atlas dashboard
- SSL: `openssl s_client -connect pack-code.com:443`

### Getting Help
1. Check logs first
2. Review this documentation
3. Search GitHub issues
4. Create new issue with logs and error details

Your PackCode application should now be running securely in production! 🎉