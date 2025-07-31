#!/bin/bash

echo "🔧 Updating MongoDB Connection for PackCode"
echo "=========================================="

# The correct MongoDB URI with password
MONGODB_URI="mongodb+srv://vibemarket:br1wxDvVnPyjUFwY@cluster0.yaq2z34.mongodb.net/packcode?retryWrites=true&w=majority&appName=Cluster0"

# Update local .env file
echo "Updating local .env file..."
cp .env .env.backup
sed -i '' "s|MONGODB_URI=.*|MONGODB_URI=$MONGODB_URI|g" .env

# Remove old MongoDB URI from Vercel
echo "Updating Vercel environment variable..."
echo "y" | vercel env rm MONGODB_URI production 2>/dev/null || true

# Add new MongoDB URI to Vercel
echo "$MONGODB_URI" | vercel env add MONGODB_URI production

echo "✅ MongoDB URI updated!"

# Deploy to Vercel
echo ""
echo "🚀 Deploying to Vercel..."
vercel --prod

echo ""
echo "⏳ Waiting for deployment to complete..."
sleep 20

echo ""
echo "🧪 Testing API endpoints..."

# Test health endpoint
echo "Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s https://www.pack-code.com/api/health)
echo "Response: $HEALTH_RESPONSE"

if [[ "$HEALTH_RESPONSE" == *"\"status\":\"ok\""* ]]; then
    echo "✅ Health endpoint working with database!"
else
    echo "❌ Health endpoint issue"
fi

# Test projects endpoint
echo ""
echo "Testing projects endpoint..."
PROJECTS_RESPONSE=$(curl -s https://www.pack-code.com/api/projects)
echo "Response: $PROJECTS_RESPONSE"

if [[ "$PROJECTS_RESPONSE" == *"projects"* ]] && [[ "$PROJECTS_RESPONSE" != *"error"* ]]; then
    echo "✅ Projects endpoint working!"
else
    echo "⚠️  Projects endpoint returned: $PROJECTS_RESPONSE"
fi

echo ""
echo "🎉 PackCode should now be fully working!"
echo "🌐 Visit: https://www.pack-code.com"
echo "📦 Find Projects: https://www.pack-code.com/find-projects"
echo ""
echo "Your MongoDB is connected to cluster: cluster0.yaq2z34.mongodb.net"
echo "Database name: packcode"