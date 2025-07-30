# PackCode Deployment Guide

## Domain: pack-code.com

This guide covers deploying PackCode to the pack-code.com domain.

## 🚀 Production Deployment

### Prerequisites

1. **Domain Setup**: Ensure pack-code.com DNS is pointing to your server
2. **SSL Certificate**: Set up SSL/TLS certificate for HTTPS
3. **MongoDB**: Production MongoDB instance
4. **Node.js**: Version 18+ installed on production server

### Environment Configuration

1. Copy `.env.example` to `.env.production`
2. Update production values:

```bash
NODE_ENV=production
CLIENT_URL=https://pack-code.com
API_URL=https://pack-code.com/api
MONGODB_URI=mongodb://your-production-db/packcode
JWT_SECRET=your-secure-jwt-secret
SESSION_SECRET=your-secure-session-secret
```

### Build & Deploy Steps

1. **Build the client**:
```bash
cd client
npm run build
```

2. **Set up reverse proxy** (nginx example):
```nginx
server {
    listen 80;
    server_name pack-code.com www.pack-code.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name pack-code.com www.pack-code.com;
    
    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;
    
    # Serve React app
    location / {
        root /path/to/packcode/client/build;
        try_files $uri $uri/ /index.html;
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
    }
}
```

3. **Start the server**:
```bash
npm start
```

Or use PM2 for process management:
```bash
pm2 start server/index.js --name packcode
pm2 startup
pm2 save
```

## 🔧 Configuration Checklist

### Database Setup
- [ ] MongoDB production instance configured
- [ ] Collections indexed for performance
- [ ] Backup strategy in place

### Security
- [ ] SSL certificate installed
- [ ] Environment variables secured
- [ ] JWT secrets are strong and unique
- [ ] CORS configured for production domain
- [ ] Rate limiting enabled

### Integrations
- [ ] GitHub OAuth app configured for pack-code.com
- [ ] Google OAuth app configured for pack-code.com
- [ ] Stripe webhook endpoints updated
- [ ] OpenAI API key configured (optional)
- [ ] Email SMTP configured

### DNS Configuration
```
Type  Name         Value
A     pack-code.com     YOUR_SERVER_IP
A     www              YOUR_SERVER_IP
```

## 🔍 Monitoring

### Health Check
- API: `https://pack-code.com/api/health`
- Should return: `{"message":"PackCode API is running!"}`

### Log Monitoring
```bash
# View server logs
pm2 logs packcode

# Monitor in real-time
pm2 monit
```

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**: Update `CLIENT_URL` in environment variables
2. **Database Connection**: Check MongoDB URI and network access
3. **SSL Issues**: Verify certificate installation and paths
4. **OAuth Redirects**: Update callback URLs in OAuth apps

### Performance Optimization

1. **Enable gzip compression** in nginx
2. **Set up CDN** for static assets
3. **Configure database indexes**
4. **Enable caching** for static resources

## 📊 Post-Deployment Verification

- [ ] Homepage loads at https://pack-code.com
- [ ] User registration/login works
- [ ] Project browsing functional
- [ ] AI features operational
- [ ] Payment processing works (test mode first)
- [ ] Email notifications sending
- [ ] Mobile responsiveness verified

## 🔄 Updates & Maintenance

### Deployment Pipeline
1. Test changes locally
2. Push to staging environment
3. Run automated tests
4. Deploy to production
5. Verify functionality
6. Monitor for issues

### Backup Strategy
- Database: Daily automated backups
- Files: Regular file system backups
- Code: Git repository with tags for releases

## 📧 Support

For deployment issues, check:
1. Server logs: `pm2 logs packcode`
2. Database connectivity
3. Environment variable configuration
4. SSL certificate validity

## 🎯 SEO Configuration

The app is pre-configured with:
- Meta tags for PackCode branding
- Open Graph tags for social sharing
- Structured data for search engines
- Sitemap generation ready
- pack-code.com domain references

Domain is ready for pack-code.com deployment!