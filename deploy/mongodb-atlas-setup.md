# MongoDB Atlas Setup for PackCode

## Quick Setup Guide

### 1. Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Sign up for free account
3. Create new organization: "PackCode"

### 2. Create Database Cluster
```bash
# Recommended configuration:
Cluster Name: packcode-prod
Cloud Provider: AWS (or your preferred)
Region: us-east-1 (closest to your users)
Cluster Tier: M2 ($9/month) - Perfect for starting
MongoDB Version: 7.0 (latest stable)
```

### 3. Database Configuration
```bash
Database Name: packcode
Collections:
- users
- projects  
- licenses
- reviews
- sessions
```

### 4. Security Setup

#### Network Access
```bash
# Add your server IP to IP Access List
IP Address: YOUR_DIGITALOCEAN_SERVER_IP
Description: PackCode Production Server

# For development, you can use:
IP Address: 0.0.0.0/0 (Allow access from anywhere)
Description: Temporary - remove after production setup
```

#### Database User
```bash
Username: packcode-prod
Password: [Generate secure password]
Built-in Role: readWrite
Database: packcode
```

### 5. Connection String
After setup, your connection string will look like:
```
mongodb+srv://packcode-prod:<password>@packcode-prod.xxxxx.mongodb.net/packcode?retryWrites=true&w=majority
```

### 6. Environment Configuration
Update your `.env.production` file:
```bash
MONGODB_URI=mongodb+srv://packcode-prod:YOUR_PASSWORD@packcode-prod.xxxxx.mongodb.net/packcode?retryWrites=true&w=majority
```

## Performance Optimization

### Indexes to Create
Run these commands in MongoDB Compass or Atlas Data Explorer:

```javascript
// Users collection
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "username": 1 }, { unique: true })
db.users.createIndex({ "createdAt": -1 })

// Projects collection  
db.projects.createIndex({ "title": "text", "description": "text" })
db.projects.createIndex({ "author": 1 })
db.projects.createIndex({ "category": 1 })
db.projects.createIndex({ "technologies": 1 })
db.projects.createIndex({ "createdAt": -1 })
db.projects.createIndex({ "featured": 1, "createdAt": -1 })
db.projects.createIndex({ "price": 1 })

// Reviews collection
db.reviews.createIndex({ "project": 1 })
db.reviews.createIndex({ "user": 1 })
db.reviews.createIndex({ "createdAt": -1 })

// Licenses collection
db.licenses.createIndex({ "project": 1 })
db.licenses.createIndex({ "buyer": 1 })
db.licenses.createIndex({ "createdAt": -1 })
```

## Backup Strategy

### Automated Backups
Atlas provides automatic backups:
- **M2 Tier**: Continuous backups with 2-day retention
- **M10+ Tiers**: Point-in-time recovery available

### Manual Backup
```bash
# Using mongodump (install MongoDB tools)
mongodump --uri="mongodb+srv://packcode-prod:PASSWORD@cluster.mongodb.net/packcode" --out=./backup-$(date +%Y%m%d)
```

## Monitoring & Alerts

### Set up Atlas Alerts
1. Go to Alerts tab in Atlas
2. Create alerts for:
   - High CPU usage (>80%)
   - High memory usage (>80%) 
   - Connection count (>80% of limit)
   - Slow query performance

### Performance Advisor
Use Atlas Performance Advisor to:
- Identify slow queries
- Get index recommendations
- Monitor query patterns

## Migration from Local MongoDB

### Export Development Data
```bash
# Export from local development
mongodump --db packcode --out ./dev-backup

# Import to Atlas
mongorestore --uri="mongodb+srv://packcode-prod:PASSWORD@cluster.mongodb.net/" ./dev-backup
```

### Data Validation
```javascript
// Verify data migration
db.users.countDocuments()
db.projects.countDocuments()  
db.reviews.countDocuments()
db.licenses.countDocuments()
```

## Security Best Practices

### Connection Security
- ✅ Use SRV connection string
- ✅ Enable SSL/TLS (default in Atlas)
- ✅ Restrict IP access to your server
- ✅ Use strong database user password
- ✅ Rotate passwords regularly

### Application Security
```javascript
// In your Node.js app, add connection options:
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  bufferMaxEntries: 0, // Disable mongoose buffering
  bufferCommands: false // Disable mongoose buffering
};
```

## Cost Optimization

### M2 Tier Limits
- Storage: 2 GB
- RAM: Shared
- vCPUs: Shared  
- Connections: 500
- Cost: $9/month

### Upgrade Path
When you need more resources:
- **M10** ($57/month): 10GB storage, dedicated resources
- **M20** ($114/month): 20GB storage, better performance
- **M30** ($207/month): 40GB storage, replica set

### Monitoring Usage
```bash
# Check current usage in Atlas dashboard:
- Storage used
- Connection count
- Operations per second
- Data transfer
```

## Troubleshooting

### Common Connection Issues
```bash
# Test connection from your server
mongo "mongodb+srv://packcode-prod:PASSWORD@cluster.mongodb.net/packcode" --eval "db.runCommand({connectionStatus: 1})"

# Check network connectivity  
nslookup cluster.mongodb.net
telnet cluster.mongodb.net 27017
```

### Performance Issues
1. Check slow query log in Atlas
2. Review Performance Advisor recommendations
3. Add missing indexes
4. Consider upgrading cluster tier

## Atlas CLI Setup (Optional)
```bash
# Install Atlas CLI
curl -fLo atlas-cli.rpm https://fastdl.mongodb.org/mongocli/mongodb-atlas-cli-1.14.0-1.x86_64.rpm
sudo rpm -ivh atlas-cli.rpm

# Login and configure
atlas auth login
atlas config set project-id YOUR_PROJECT_ID
```

Your MongoDB Atlas cluster will be production-ready with this configuration!