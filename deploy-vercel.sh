#!/bin/bash

# Vercel Deployment Script for PackCode
echo "🚀 Preparing PackCode for Vercel deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf client/build
rm -rf node_modules/.cache
rm -rf client/node_modules/.cache

# Install dependencies
echo "📦 Installing dependencies..."
npm install
cd client && npm install --legacy-peer-deps && cd ..

# Build the client
echo "🏗️  Building client for production..."
cd client && npm run build:vercel && cd ..

# Verify build
if [ ! -d "client/build" ]; then
    echo "❌ Error: Build failed - client/build directory not found"
    exit 1
fi

echo "✅ Build completed successfully!"
echo "📁 Build size:"
du -sh client/build

echo ""
echo "🚀 Ready for Vercel deployment!"
echo "💡 Next steps:"
echo "   1. Make sure you have the Vercel CLI installed: npm i -g vercel"
echo "   2. Run: vercel --prod"
echo "   3. Set your environment variables in Vercel dashboard"
echo ""
echo "🔧 Required environment variables for Vercel:"
echo "   - MONGODB_URI"
echo "   - JWT_SECRET" 
echo "   - GITHUB_CLIENT_ID"
echo "   - GITHUB_CLIENT_SECRET"
echo "   - STRIPE_SECRET_KEY"
echo "   - STRIPE_PUBLISHABLE_KEY"
echo "   - CLIENT_URL (your Vercel app URL)"