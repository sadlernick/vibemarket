#!/bin/bash

echo "🔧 Setting up Vercel Environment Variables"
echo "========================================="

# Set basic required variables
echo "Setting basic environment variables..."

echo "CLIENT_URL=https://www.pack-code.com" | vercel env add CLIENT_URL production

echo "NODE_ENV=production" | vercel env add NODE_ENV production

# Set a dummy OpenAI key for now (can be updated later)
echo "dummy-openai-key-replace-with-real-key" | vercel env add OPENAI_API_KEY production

# Generate a secure JWT secret
JWT_SECRET="packcode-jwt-$(openssl rand -hex 32)"
echo "$JWT_SECRET" | vercel env add JWT_SECRET production

echo "✅ Basic environment variables set!"
echo ""
echo "Now we need to check your .env file for other important variables..."

if [ -f .env ]; then
    echo "Found .env file. Checking for additional variables..."
    
    # Check for MongoDB URI
    if grep -q "MONGODB_URI" .env; then
        MONGODB_URI=$(grep "MONGODB_URI" .env | cut -d '=' -f2-)
        echo "$MONGODB_URI" | vercel env add MONGODB_URI production
        echo "✅ Added MONGODB_URI"
    else
        echo "❌ MONGODB_URI not found in .env"
        echo "You'll need to add this manually - see instructions below"
    fi
    
    # Check for GitHub OAuth
    if grep -q "GITHUB_CLIENT_ID" .env; then
        GITHUB_CLIENT_ID=$(grep "GITHUB_CLIENT_ID" .env | cut -d '=' -f2-)
        echo "$GITHUB_CLIENT_ID" | vercel env add GITHUB_CLIENT_ID production
        echo "✅ Added GITHUB_CLIENT_ID"
    fi
    
    if grep -q "GITHUB_CLIENT_SECRET" .env; then
        GITHUB_CLIENT_SECRET=$(grep "GITHUB_CLIENT_SECRET" .env | cut -d '=' -f2-)
        echo "$GITHUB_CLIENT_SECRET" | vercel env add GITHUB_CLIENT_SECRET production
        echo "✅ Added GITHUB_CLIENT_SECRET"
    fi
    
    # Check for Stripe
    if grep -q "STRIPE_SECRET_KEY" .env; then
        STRIPE_SECRET_KEY=$(grep "STRIPE_SECRET_KEY" .env | cut -d '=' -f2-)
        echo "$STRIPE_SECRET_KEY" | vercel env add STRIPE_SECRET_KEY production
        echo "✅ Added STRIPE_SECRET_KEY"
    fi
else
    echo "❌ No .env file found"
fi

echo ""
echo "🚀 Deploying with new environment variables..."
vercel --prod

echo ""
echo "⏳ Waiting for deployment to complete..."
sleep 15

echo ""
echo "🧪 Testing API endpoints..."
echo "Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s https://www.pack-code.com/api/health)
if [[ "$HEALTH_RESPONSE" == *"status"* ]]; then
    echo "✅ Health endpoint working!"
else
    echo "❌ Health endpoint failed: $HEALTH_RESPONSE"
fi

echo "Testing projects endpoint..."
PROJECTS_RESPONSE=$(curl -s https://www.pack-code.com/api/projects)
if [[ "$PROJECTS_RESPONSE" == *"projects"* ]] || [[ "$PROJECTS_RESPONSE" == *"[]"* ]]; then
    echo "✅ Projects endpoint working!"
else
    echo "❌ Projects endpoint failed: $PROJECTS_RESPONSE"
fi

echo ""
echo "🌐 Testing the website..."
echo "Visit: https://www.pack-code.com/find-projects"
echo ""

if [[ "$HEALTH_RESPONSE" == *"status"* ]]; then
    echo "🎉 SUCCESS! Your app should now be working!"
else
    echo "❌ Still having issues. Check the manual steps below."
fi

echo ""
echo "📋 MANUAL STEPS (if needed):"
echo "1. Go to https://vercel.com/dashboard"
echo "2. Find your 'appmarketplace' project"
echo "3. Go to Settings → Environment Variables"
echo "4. Make sure you have:"
echo "   - MONGODB_URI (your MongoDB connection string)"
echo "   - CLIENT_URL (https://www.pack-code.com)"
echo "   - JWT_SECRET (any random string)"
echo "   - NODE_ENV (production)"
echo ""
echo "5. If missing MONGODB_URI, add it with your MongoDB Atlas connection string"
echo "6. Redeploy by running: vercel --prod"