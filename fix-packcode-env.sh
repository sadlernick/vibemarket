#!/bin/bash

echo "🔧 Setting up PackCode Vercel Environment Variables"
echo "=================================================="

# Get values from .env file
if [ -f .env ]; then
    source .env
    echo "✅ Found .env file"
else
    echo "❌ No .env file found"
fi

# Set all required environment variables for packcode project
echo "Setting up environment variables for packcode project..."

# Basic required variables
echo "CLIENT_URL=https://www.pack-code.com" | vercel env add CLIENT_URL production --project=packcode
echo "NODE_ENV=production" | vercel env add NODE_ENV production --project=packcode

# Generate JWT secret if not in .env
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET="packcode-jwt-$(openssl rand -hex 32)"
fi
echo "$JWT_SECRET" | vercel env add JWT_SECRET production --project=packcode

# Set OpenAI key (dummy for now)
echo "dummy-openai-key-replace-with-real-key" | vercel env add OPENAI_API_KEY production --project=packcode

# MongoDB URI
if [ ! -z "$MONGODB_URI" ]; then
    echo "$MONGODB_URI" | vercel env add MONGODB_URI production --project=packcode
    echo "✅ Added MONGODB_URI"
else
    echo "❌ MONGODB_URI not found in .env"
fi

# GitHub OAuth
if [ ! -z "$GITHUB_CLIENT_ID" ]; then
    echo "$GITHUB_CLIENT_ID" | vercel env add GITHUB_CLIENT_ID production --project=packcode
    echo "✅ Added GITHUB_CLIENT_ID"
fi

if [ ! -z "$GITHUB_CLIENT_SECRET" ]; then
    echo "$GITHUB_CLIENT_SECRET" | vercel env add GITHUB_CLIENT_SECRET production --project=packcode
    echo "✅ Added GITHUB_CLIENT_SECRET"  
fi

# Stripe
if [ ! -z "$STRIPE_SECRET_KEY" ]; then
    echo "$STRIPE_SECRET_KEY" | vercel env add STRIPE_SECRET_KEY production --project=packcode
    echo "✅ Added STRIPE_SECRET_KEY"
fi

echo ""
echo "🚀 Deploying to packcode project..."
vercel --project=packcode --prod

echo ""
echo "⏳ Waiting for deployment..."
sleep 20

echo ""
echo "🧪 Testing API endpoints..."
echo "Testing test endpoint..."
TEST_RESPONSE=$(curl -s https://www.pack-code.com/api/test)
echo "Test response: $TEST_RESPONSE"

if [[ "$TEST_RESPONSE" == *"MONGODB_URI\":\"set\""* ]]; then
    echo "✅ Environment variables are now working!"
    
    echo "Testing health endpoint..."
    HEALTH_RESPONSE=$(curl -s https://www.pack-code.com/api/health)
    if [[ "$HEALTH_RESPONSE" == *"status"* ]]; then
        echo "✅ Health endpoint working!"
    else
        echo "Health response: $HEALTH_RESPONSE"
    fi
    
    echo "Testing projects endpoint..."
    PROJECTS_RESPONSE=$(curl -s https://www.pack-code.com/api/projects)
    if [[ "$PROJECTS_RESPONSE" == *"projects"* ]] || [[ "$PROJECTS_RESPONSE" == *"[]"* ]]; then
        echo "✅ Projects endpoint working!"
    else
        echo "Projects response: $PROJECTS_RESPONSE"
    fi
else
    echo "❌ Environment variables still not working"
    echo "Test response: $TEST_RESPONSE"
fi

echo ""
echo "🌐 Your app should now be working at: https://www.pack-code.com"
echo "🎯 Test the Find Projects page: https://www.pack-code.com/find-projects"