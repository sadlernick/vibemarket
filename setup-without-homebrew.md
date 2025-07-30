# VibeMarket Setup (Without Homebrew)

## Option 1: Download MongoDB Directly

1. **Download MongoDB Community Server:**
   - Go to: https://www.mongodb.com/try/download/community
   - Select macOS, Version 7.0, Package: tgz
   - Download and extract to `/usr/local/mongodb`

2. **Add MongoDB to PATH:**
   ```bash
   echo 'export PATH="/usr/local/mongodb/bin:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```

3. **Create data directory:**
   ```bash
   sudo mkdir -p /usr/local/var/mongodb
   sudo mkdir -p /usr/local/var/log/mongodb
   sudo chown `id -un` /usr/local/var/mongodb
   sudo chown `id -un` /usr/local/var/log/mongodb
   ```

4. **Start MongoDB:**
   ```bash
   mongod --dbpath /usr/local/var/mongodb --logpath /usr/local/var/log/mongodb/mongo.log --fork
   ```

## Option 2: Use MongoDB Atlas (Cloud - Easier)

1. **Create free account:** https://cloud.mongodb.com
2. **Create a cluster** (free tier)
3. **Get connection string** and update `.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vibemarket
   ```

## Option 3: Use Docker (If you have Docker)

```bash
docker run --name mongodb -p 27017:27017 -d mongo:7
```

## Quick Start (No Database Required)

For immediate testing without MongoDB:

```bash
# Start the test server (works without DB)
node quick-start.js
```

Visit: http://localhost:3001

This gives you a working login test page with your admin credentials!

## Full Application Start

Once MongoDB is running:

```bash
# Install dependencies
npm install

# Create admin user
node server/scripts/createAdmin.js

# Start backend (Terminal 1)
npm run server

# Start frontend (Terminal 2) 
npm run client
```

**URLs:**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Test: http://localhost:3001

**Admin Login:**
- Email: nick@sportwise.ai
- Password: Sloan2018!