#!/bin/bash

# PackCode Environment Setup Script
# Sets up production environment variables and configurations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}⚙️  PackCode Environment Setup Starting...${NC}"

# Function to generate secure random string
generate_secret() {
    openssl rand -hex 32
}

# Function to prompt for input with default
prompt_with_default() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"
    
    echo -n -e "${YELLOW}$prompt${NC}"
    if [ ! -z "$default" ]; then
        echo -n " (default: $default)"
    fi
    echo -n ": "
    read input
    
    if [ -z "$input" ] && [ ! -z "$default" ]; then
        input="$default"
    fi
    
    eval "$var_name='$input'"
}

# Check if .env already exists
ENV_FILE="/var/www/packcode/.env"
if [ -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  Environment file already exists at $ENV_FILE${NC}"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Using existing environment file. You can edit it manually if needed.${NC}"
        exit 0
    fi
    
    # Backup existing file
    cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${GREEN}✅ Backed up existing environment file${NC}"
fi

echo -e "${BLUE}🔧 Setting up production environment configuration...${NC}"
echo

# Basic Configuration
echo -e "${BLUE}📝 Basic Configuration${NC}"
prompt_with_default "Domain name" "pack-code.com" "DOMAIN"
CLIENT_URL="https://$DOMAIN"
API_URL="https://$DOMAIN/api"

# Database Configuration
echo
echo -e "${BLUE}🗄️  Database Configuration${NC}"
echo "Enter your MongoDB Atlas connection string:"
echo "Format: mongodb+srv://username:password@cluster.mongodb.net/packcode"
prompt_with_default "MongoDB URI" "" "MONGODB_URI"

while [ -z "$MONGODB_URI" ]; do
    echo -e "${RED}❌ MongoDB URI is required!${NC}"
    prompt_with_default "MongoDB URI" "" "MONGODB_URI"
done

# Security Configuration
echo
echo -e "${BLUE}🔐 Security Configuration${NC}"
echo "Generating secure secrets..."
JWT_SECRET=$(generate_secret)
SESSION_SECRET=$(generate_secret)
echo -e "${GREEN}✅ Generated JWT and session secrets${NC}"

# OAuth Configuration
echo
echo -e "${BLUE}🔑 OAuth Configuration${NC}"
echo "You can skip these and configure later if needed."
echo
echo "GitHub OAuth (create app at: https://github.com/settings/applications/new)"
echo "  - Homepage URL: $CLIENT_URL"
echo "  - Callback URL: $CLIENT_URL/auth/github/callback"
prompt_with_default "GitHub Client ID" "" "GITHUB_CLIENT_ID"
prompt_with_default "GitHub Client Secret" "" "GITHUB_CLIENT_SECRET"

echo
echo "Google OAuth (create app at: https://console.developers.google.com/)"
echo "  - Authorized origins: $CLIENT_URL"
echo "  - Authorized redirect URIs: $CLIENT_URL/auth/google/callback"
prompt_with_default "Google Client ID" "" "GOOGLE_CLIENT_ID"
prompt_with_default "Google Client Secret" "" "GOOGLE_CLIENT_SECRET"

# Stripe Configuration
echo
echo -e "${BLUE}💳 Stripe Configuration${NC}"
echo "Get your keys from: https://dashboard.stripe.com/apikeys"
echo "⚠️  Use TEST keys initially, switch to LIVE keys when ready for production"
prompt_with_default "Stripe Secret Key" "" "STRIPE_SECRET_KEY"
prompt_with_default "Stripe Publishable Key" "" "STRIPE_PUBLISHABLE_KEY"

# OpenAI Configuration
echo
echo -e "${BLUE}🤖 OpenAI Configuration (Optional)${NC}"
echo "Get your API key from: https://platform.openai.com/api-keys"
echo "Leave empty to use AI fallback features"
prompt_with_default "OpenAI API Key" "" "OPENAI_API_KEY"

# Email Configuration
echo
echo -e "${BLUE}📧 Email Configuration${NC}"
echo "For transactional emails (registration, password reset, etc.)"
prompt_with_default "Email Host" "smtp.gmail.com" "EMAIL_HOST"
prompt_with_default "Email Port" "587" "EMAIL_PORT"
prompt_with_default "Email User" "noreply@$DOMAIN" "EMAIL_USER"
prompt_with_default "Email Password" "" "EMAIL_PASS"

# File Upload Configuration
echo
echo -e "${BLUE}📁 File Upload Configuration${NC}"
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="10485760"  # 10MB

# Generate environment file
echo
echo -e "${YELLOW}📝 Generating environment file...${NC}"

cat > "$ENV_FILE" << EOF
# PackCode Production Environment Variables
# Generated on: $(date)

# Environment
NODE_ENV=production

# Domain Configuration
CLIENT_URL=$CLIENT_URL
API_URL=$API_URL

# Database
MONGODB_URI=$MONGODB_URI

# Security
JWT_SECRET=$JWT_SECRET
SESSION_SECRET=$SESSION_SECRET

# OAuth Configuration
GITHUB_CLIENT_ID=$GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET=$GITHUB_CLIENT_SECRET
GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET

# Stripe Payment Processing
STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=$STRIPE_PUBLISHABLE_KEY

# OpenAI API (Optional)
OPENAI_API_KEY=$OPENAI_API_KEY

# Email Configuration
EMAIL_HOST=$EMAIL_HOST
EMAIL_PORT=$EMAIL_PORT
EMAIL_USER=$EMAIL_USER
EMAIL_PASS=$EMAIL_PASS

# File Upload Configuration
UPLOAD_DIR=$UPLOAD_DIR
MAX_FILE_SIZE=$MAX_FILE_SIZE

# Server Configuration
PORT=5001
EOF

# Set proper permissions
chown packcode:packcode "$ENV_FILE"
chmod 600 "$ENV_FILE"

echo -e "${GREEN}✅ Environment file created at $ENV_FILE${NC}"

# Create client environment file
CLIENT_ENV_FILE="/var/www/packcode/client/.env.production"
echo
echo -e "${YELLOW}📝 Creating client environment file...${NC}"

cat > "$CLIENT_ENV_FILE" << EOF
# PackCode Client Production Environment
# Generated on: $(date)

REACT_APP_API_URL=$API_URL
REACT_APP_STRIPE_PUBLISHABLE_KEY=$STRIPE_PUBLISHABLE_KEY
REACT_APP_DOMAIN=$DOMAIN

# Build optimizations
GENERATE_SOURCEMAP=false
INLINE_RUNTIME_CHUNK=false
EOF

chown packcode:packcode "$CLIENT_ENV_FILE"
chmod 644 "$CLIENT_ENV_FILE"

echo -e "${GREEN}✅ Client environment file created at $CLIENT_ENV_FILE${NC}"

# Validation and next steps
echo
echo -e "${BLUE}🔍 Environment Validation${NC}"

# Check if required fields are set
REQUIRED_VARS=("MONGODB_URI" "JWT_SECRET" "SESSION_SECRET")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ All required environment variables are configured${NC}"
else
    echo -e "${RED}❌ Missing required variables: ${MISSING_VARS[*]}${NC}"
    echo -e "${YELLOW}Please edit $ENV_FILE and add the missing variables${NC}"
fi

# Display summary
echo
echo -e "${BLUE}📋 Configuration Summary${NC}"
echo "Domain: $CLIENT_URL"
echo "Database: $(echo $MONGODB_URI | sed 's/\/\/.*@/\/\/***:***@/')"
echo "JWT Secret: [Generated]"
echo "Session Secret: [Generated]"
echo "GitHub OAuth: $([ ! -z "$GITHUB_CLIENT_ID" ] && echo "✅ Configured" || echo "❌ Not configured")"
echo "Google OAuth: $([ ! -z "$GOOGLE_CLIENT_ID" ] && echo "✅ Configured" || echo "❌ Not configured")"
echo "Stripe: $([ ! -z "$STRIPE_SECRET_KEY" ] && echo "✅ Configured" || echo "❌ Not configured")"
echo "OpenAI: $([ ! -z "$OPENAI_API_KEY" ] && echo "✅ Configured" || echo "❌ Not configured (will use fallbacks)")"
echo "Email: $([ ! -z "$EMAIL_USER" ] && echo "✅ Configured" || echo "❌ Not configured")"

echo
echo -e "${BLUE}🎯 Next Steps${NC}"
echo "1. Review and edit environment files if needed:"
echo "   - Server: $ENV_FILE"
echo "   - Client: $CLIENT_ENV_FILE"
echo
echo "2. Test database connection:"
echo "   cd /var/www/packcode && node -e \"require('mongoose').connect(process.env.MONGODB_URI || '$MONGODB_URI').then(() => console.log('✅ Database connected')).catch(err => console.error('❌ Database error:', err.message))\""
echo
echo "3. Configure OAuth applications:"
echo "   - GitHub: https://github.com/settings/applications/new"
echo "   - Google: https://console.developers.google.com/"
echo
echo "4. Set up Stripe webhooks:"
echo "   - Endpoint URL: $API_URL/stripe/webhook"
echo "   - Events: payment_intent.succeeded, payment_intent.payment_failed"
echo
echo "5. Deploy and test your application"

echo
echo -e "${GREEN}🎉 Environment setup complete!${NC}"