#!/bin/bash

# Quick Vercel Deployment Script for PackCode
echo "🚀 Quick deployment to Vercel..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf client/build
rm -rf client/node_modules/.cache

# Build the client directly (skip dependency reinstall to avoid conflicts)
echo "🏗️  Building client for production..."
cd client && GENERATE_SOURCEMAP=false npm run build && cd ..

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
echo "💡 Run: vercel --prod"