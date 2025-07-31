#!/bin/bash

echo "🚀 PackCode Vercel Setup Script"
echo "==============================="

# Step 1: Login to Vercel
echo "Step 1: Authenticating with Vercel..."
echo "Please run: vercel login --github"
echo "Then come back and run this script again with 'skip-login' argument"
echo ""

if [ "$1" != "skip-login" ]; then
    echo "After logging in, run: ./setup-vercel.sh skip-login"
    exit 0
fi

# Step 2: Link to existing project
echo "Step 2: Linking to existing Vercel project..."
vercel link --yes

# Step 3: Set environment variables
echo "Step 3: Setting up environment variables..."

# Check if .env exists and read from it
if [ -f .env ]; then
    echo "Found .env file, reading variables..."
    source .env
fi

# Set critical environment variables
echo "Setting MONGODB_URI..."
if [ ! -z "$MONGODB_URI" ]; then
    vercel env add MONGODB_URI production <<< "$MONGODB_URI"
else
    echo "❌ MONGODB_URI not found in .env file"
    echo "Please set it manually: vercel env add MONGODB_URI production"
fi

echo "Setting JWT_SECRET..."
if [ ! -z "$JWT_SECRET" ]; then
    vercel env add JWT_SECRET production <<< "$JWT_SECRET"
else
    echo "Setting default JWT_SECRET..."
    vercel env add JWT_SECRET production <<< "your-super-secure-jwt-secret-$(date +%s)"
fi

echo "Setting CLIENT_URL..."
vercel env add CLIENT_URL production <<< "https://pack-code.com"

echo "Setting GitHub OAuth..."
if [ ! -z "$GITHUB_CLIENT_ID" ]; then
    vercel env add GITHUB_CLIENT_ID production <<< "$GITHUB_CLIENT_ID"
fi
if [ ! -z "$GITHUB_CLIENT_SECRET" ]; then
    vercel env add GITHUB_CLIENT_SECRET production <<< "$GITHUB_CLIENT_SECRET"
fi

echo "Setting Stripe keys..."
if [ ! -z "$STRIPE_SECRET_KEY" ]; then
    vercel env add STRIPE_SECRET_KEY production <<< "$STRIPE_SECRET_KEY"
fi

# Step 4: Deploy
echo "Step 4: Deploying to production..."
vercel --prod

# Step 5: Test API
echo "Step 5: Testing API endpoints..."
sleep 10  # Wait for deployment

echo "Testing health endpoint..."
curl -s https://pack-code.com/api/health | jq . || echo "Health endpoint test failed"

echo "Testing projects endpoint..."
curl -s https://pack-code.com/api/projects | jq . || echo "Projects endpoint test failed"

echo ""
echo "✅ Setup complete!"
echo "🌐 Your app should now be working at: https://pack-code.com"
echo ""
echo "If there are still issues, check the Vercel function logs:"
echo "vercel logs https://pack-code.com"