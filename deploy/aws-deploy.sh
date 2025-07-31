#!/bin/bash

# PackCode AWS Deployment Script
# Deploys code changes to AWS infrastructure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}☁️  PackCode AWS Deployment Starting...${NC}"

# Configuration
PROJECT_NAME="packcode"
REGION="us-east-1"
BUCKET_NAME=""  # Will be detected from existing resources
BUILD_DIR="./build"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Check if AWS CLI is installed and configured
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found${NC}"
    exit 1
fi

if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    exit 1
fi

# Find S3 bucket for deployments
echo -e "${YELLOW}🔍 Finding deployment bucket...${NC}"
BUCKET_NAME=$(aws s3api list-buckets --query "Buckets[?contains(Name, '${PROJECT_NAME}-deployments')].Name" --output text | head -n1)

if [ -z "$BUCKET_NAME" ]; then
    echo -e "${RED}❌ No deployment bucket found. Run aws-setup.sh first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Using bucket: $BUCKET_NAME${NC}"

# Pre-deployment checks
echo -e "${YELLOW}🔍 Running pre-deployment checks...${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Not in project root directory${NC}"
    exit 1
fi

# Check git status
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  You have uncommitted changes${NC}"
    git status --short
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

# Get current commit
COMMIT_HASH=$(git rev-parse --short HEAD)
BRANCH_NAME=$(git branch --show-current)

echo -e "${GREEN}✅ Deploying commit $COMMIT_HASH from branch $BRANCH_NAME${NC}"

# Build the application
echo -e "${YELLOW}🔨 Building application...${NC}"

# Clean previous builds
rm -rf $BUILD_DIR
mkdir -p $BUILD_DIR

# Install server dependencies
echo "Installing server dependencies..."
npm ci --production

# Build client
echo "Building client application..."
cd client
npm ci
npm run build

# Check if build succeeded
if [ ! -d "build" ]; then
    echo -e "${RED}❌ Client build failed${NC}"
    exit 1
fi

cd ..

# Create deployment package
echo -e "${YELLOW}📦 Creating deployment package...${NC}"

# Copy server files
cp -r server $BUILD_DIR/
cp package*.json $BUILD_DIR/
cp -r client/build $BUILD_DIR/client/

# Copy environment and config files
cp .env.production $BUILD_DIR/.env 2>/dev/null || echo "No .env.production file found"

# Create deployment info
cat > $BUILD_DIR/deployment-info.json << EOF
{
  "timestamp": "$TIMESTAMP",
  "commit": "$COMMIT_HASH",
  "branch": "$BRANCH_NAME",
  "deployer": "$(whoami)",
  "version": "$(node -p "require('./package.json').version")"
}
EOF

# Create tarball
echo -e "${YELLOW}📦 Creating deployment tarball...${NC}"
cd $BUILD_DIR
tar -czf ../packcode-$TIMESTAMP.tar.gz .
cd ..

# Upload to S3
echo -e "${YELLOW}☁️  Uploading to S3...${NC}"
aws s3 cp packcode-$TIMESTAMP.tar.gz s3://$BUCKET_NAME/releases/packcode-$TIMESTAMP.tar.gz
aws s3 cp packcode-$TIMESTAMP.tar.gz s3://$BUCKET_NAME/latest.tar.gz

echo -e "${GREEN}✅ Upload complete${NC}"

# Get Auto Scaling Group instances
echo -e "${YELLOW}🔍 Finding application instances...${NC}"
ASG_NAME="${PROJECT_NAME}-asg"

INSTANCE_IDS=$(aws autoscaling describe-auto-scaling-groups \
    --auto-scaling-group-names $ASG_NAME \
    --query 'AutoScalingGroups[0].Instances[?LifecycleState==`InService`].InstanceId' \
    --output text)

if [ -z "$INSTANCE_IDS" ]; then
    echo -e "${RED}❌ No running instances found in Auto Scaling Group${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found instances: $INSTANCE_IDS${NC}"

# Deploy to instances using Systems Manager
echo -e "${YELLOW}🚀 Deploying to instances...${NC}"

# Create deployment command
DEPLOYMENT_COMMAND="
cd /var/www/packcode
sudo -u packcode aws s3 cp s3://$BUCKET_NAME/latest.tar.gz /tmp/packcode.tar.gz
sudo -u packcode tar -xzf /tmp/packcode.tar.gz -C /var/www/packcode --overwrite
sudo -u packcode npm ci --production
sudo -u packcode pm2 restart packcode || sudo -u packcode pm2 start server/index.js --name packcode
sudo systemctl reload nginx
rm -f /tmp/packcode.tar.gz
echo 'Deployment completed on instance'
"

# Execute deployment on all instances
for INSTANCE_ID in $INSTANCE_IDS; do
    echo -e "${YELLOW}📡 Deploying to instance $INSTANCE_ID...${NC}"
    
    COMMAND_ID=$(aws ssm send-command \
        --instance-ids $INSTANCE_ID \
        --document-name "AWS-RunShellScript" \
        --parameters commands="$DEPLOYMENT_COMMAND" \
        --query 'Command.CommandId' \
        --output text)
    
    echo "Command ID: $COMMAND_ID"
    
    # Wait for command to complete
    echo "Waiting for deployment to complete..."
    aws ssm wait command-executed \
        --command-id $COMMAND_ID \
        --instance-id $INSTANCE_ID
    
    # Check command status
    STATUS=$(aws ssm get-command-invocation \
        --command-id $COMMAND_ID \
        --instance-id $INSTANCE_ID \
        --query 'Status' \
        --output text)
    
    if [ "$STATUS" = "Success" ]; then
        echo -e "${GREEN}✅ Instance $INSTANCE_ID deployed successfully${NC}"
    else
        echo -e "${RED}❌ Instance $INSTANCE_ID deployment failed${NC}"
        
        # Show error output
        aws ssm get-command-invocation \
            --command-id $COMMAND_ID \
            --instance-id $INSTANCE_ID \
            --query 'StandardErrorContent' \
            --output text
        
        exit 1
    fi
done

# Health check
echo -e "${YELLOW}🏥 Running health checks...${NC}"

# Get load balancer DNS
ALB_NAME="${PROJECT_NAME}-alb"
ALB_DNS=$(aws elbv2 describe-load-balancers \
    --names $ALB_NAME \
    --query 'LoadBalancers[0].DNSName' \
    --output text 2>/dev/null || echo "")

if [ ! -z "$ALB_DNS" ]; then
    echo "Testing load balancer health..."
    sleep 10  # Wait for instances to register
    
    # Test health endpoint
    for i in {1..5}; do
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$ALB_DNS/api/health || echo "000")
        
        if [ "$HTTP_STATUS" = "200" ]; then
            echo -e "${GREEN}✅ Health check passed (HTTP $HTTP_STATUS)${NC}"
            break
        else
            echo -e "${YELLOW}⏳ Health check attempt $i/5 (HTTP $HTTP_STATUS)${NC}"
            if [ $i -eq 5 ]; then
                echo -e "${RED}❌ Health check failed after 5 attempts${NC}"
                exit 1
            fi
            sleep 10
        fi
    done
else
    echo -e "${YELLOW}⚠️  Could not find load balancer for health check${NC}"
fi

# Update deployment tracking
echo -e "${YELLOW}📝 Updating deployment tracking...${NC}"

# Store deployment info in Systems Manager Parameter Store
aws ssm put-parameter \
    --name "/${PROJECT_NAME}/last-deployment" \
    --value "{\"timestamp\":\"$TIMESTAMP\",\"commit\":\"$COMMIT_HASH\",\"branch\":\"$BRANCH_NAME\"}" \
    --type String \
    --overwrite

# Clean up local files
rm -rf $BUILD_DIR
rm -f packcode-$TIMESTAMP.tar.gz

# Success message
echo
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo
echo -e "${BLUE}📋 Deployment Summary:${NC}"
echo "Timestamp: $TIMESTAMP"
echo "Commit: $COMMIT_HASH"
echo "Branch: $BRANCH_NAME"
echo "Instances: $(echo $INSTANCE_IDS | wc -w) instances updated"
echo "S3 Package: s3://$BUCKET_NAME/releases/packcode-$TIMESTAMP.tar.gz"

if [ ! -z "$ALB_DNS" ]; then
    echo "Load Balancer: http://$ALB_DNS"
fi

echo
echo -e "${BLUE}🔧 Useful Commands:${NC}"
echo "View logs: aws logs tail /aws/ec2/$PROJECT_NAME --follow"
echo "Check instances: aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names $ASG_NAME"
echo "Rollback: aws s3 cp s3://$BUCKET_NAME/releases/[previous-version].tar.gz s3://$BUCKET_NAME/latest.tar.gz"

echo
echo -e "${GREEN}✅ PackCode is now running the latest version on AWS!${NC}"

# Optional: Send deployment notification
if [ ! -z "$SLACK_WEBHOOK" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🚀 PackCode deployed to AWS - commit: $COMMIT_HASH\"}" \
        "$SLACK_WEBHOOK" > /dev/null 2>&1 || true
fi