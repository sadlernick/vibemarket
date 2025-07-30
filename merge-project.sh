#!/bin/bash

echo "🔄 Merging project files from Desktop to main directory..."

# Create directory structure
mkdir -p server/{models,routes,middleware,scripts,uploads,sandbox,temp}

# Copy server files
echo "📁 Copying server files..."
if [ -d "/Users/nicksadler/Desktop/appmarketplace/server" ]; then
    cp -r /Users/nicksadler/Desktop/appmarketplace/server/* server/ 2>/dev/null
fi

# Copy .env and other config files
echo "⚙️ Copying config files..."
if [ -f "/Users/nicksadler/Desktop/appmarketplace/.env" ]; then
    cp /Users/nicksadler/Desktop/appmarketplace/.env . 2>/dev/null
fi

if [ -f "/Users/nicksadler/Desktop/appmarketplace/.env.example" ]; then
    cp /Users/nicksadler/Desktop/appmarketplace/.env.example . 2>/dev/null
fi

if [ -f "/Users/nicksadler/Desktop/appmarketplace/.gitignore" ]; then
    cp /Users/nicksadler/Desktop/appmarketplace/.gitignore . 2>/dev/null
fi

# Copy package-lock.json if it exists
if [ -f "/Users/nicksadler/Desktop/appmarketplace/package-lock.json" ]; then
    cp /Users/nicksadler/Desktop/appmarketplace/package-lock.json . 2>/dev/null
fi

# Copy node_modules if it exists (this might take a while)
if [ -d "/Users/nicksadler/Desktop/appmarketplace/node_modules" ]; then
    echo "📦 Copying node_modules (this may take a moment)..."
    cp -r /Users/nicksadler/Desktop/appmarketplace/node_modules . 2>/dev/null || echo "⚠️  Could not copy node_modules, you'll need to run 'npm install'"
fi

echo "✅ Project merge complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Install dependencies: npm install"
echo "2. Install MongoDB: brew install mongodb-community"
echo "3. Start MongoDB: brew services start mongodb-community"
echo "4. Create admin user: node server/scripts/createAdmin.js"
echo "5. Start backend: npm run server"
echo "6. Start frontend: npm run client"
echo ""
echo "🌐 URLs:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:5000"
echo "- Test server: node quick-start.js (http://localhost:3001)"
echo ""
echo "👤 Admin Login:"
echo "- Email: nick@sportwise.ai"
echo "- Password: Sloan2018!"