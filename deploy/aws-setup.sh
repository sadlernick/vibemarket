#!/bin/bash

# PackCode AWS Infrastructure Setup Script
# Creates AWS resources for PackCode deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}☁️  PackCode AWS Setup Starting...${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install it first:${NC}"
    echo "curl 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip' -o 'awscliv2.zip'"
    echo "unzip awscliv2.zip && sudo ./aws/install"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured. Run: aws configure${NC}"
    exit 1
fi

# Configuration
PROJECT_NAME="packcode"
REGION="us-east-1"  # Change this to your preferred region
DOMAIN="pack-code.com"
ENVIRONMENT="production"

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "Project: $PROJECT_NAME"
echo "Region: $REGION"
echo "Domain: $DOMAIN"
echo "Environment: $ENVIRONMENT"
echo

# Prompt for confirmation
read -p "Continue with this configuration? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
fi

# Create S3 bucket for deployments
echo -e "${YELLOW}📦 Creating S3 bucket for deployments...${NC}"
BUCKET_NAME="${PROJECT_NAME}-deployments-$(date +%s)"

aws s3 mb s3://$BUCKET_NAME --region $REGION
aws s3api put-bucket-versioning --bucket $BUCKET_NAME --versioning-configuration Status=Enabled

echo -e "${GREEN}✅ S3 bucket created: $BUCKET_NAME${NC}"

# Create IAM role for EC2 instances
echo -e "${YELLOW}👤 Creating IAM roles...${NC}"

# Trust policy for EC2
cat > ec2-trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create IAM role
aws iam create-role \
    --role-name ${PROJECT_NAME}-ec2-role \
    --assume-role-policy-document file://ec2-trust-policy.json \
    --description "IAM role for PackCode EC2 instances" || true

# Create policy for EC2 instances
cat > ec2-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::$BUCKET_NAME",
        "arn:aws:s3:::$BUCKET_NAME/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath"
      ],
      "Resource": "arn:aws:ssm:$REGION:*:parameter/$PROJECT_NAME/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
EOF

# Attach policy to role
aws iam put-role-policy \
    --role-name ${PROJECT_NAME}-ec2-role \
    --policy-name ${PROJECT_NAME}-ec2-policy \
    --policy-document file://ec2-policy.json

# Create instance profile
aws iam create-instance-profile --instance-profile-name ${PROJECT_NAME}-ec2-profile || true
aws iam add-role-to-instance-profile \
    --instance-profile-name ${PROJECT_NAME}-ec2-profile \
    --role-name ${PROJECT_NAME}-ec2-role || true

echo -e "${GREEN}✅ IAM roles created${NC}"

# Create security group
echo -e "${YELLOW}🔒 Creating security group...${NC}"

# Get default VPC
VPC_ID=$(aws ec2 describe-vpcs --filters Name=is-default,Values=true --query 'Vpcs[0].VpcId' --output text)

if [ "$VPC_ID" = "None" ]; then
    echo -e "${RED}❌ No default VPC found. Please create a VPC first.${NC}"
    exit 1
fi

# Create security group
SECURITY_GROUP_ID=$(aws ec2 create-security-group \
    --group-name ${PROJECT_NAME}-sg \
    --description "Security group for PackCode application" \
    --vpc-id $VPC_ID \
    --query 'GroupId' --output text) || {
    # Get existing security group if creation fails
    SECURITY_GROUP_ID=$(aws ec2 describe-security-groups \
        --filters Name=group-name,Values=${PROJECT_NAME}-sg \
        --query 'SecurityGroups[0].GroupId' --output text)
}

# Add security group rules
aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp --port 22 --cidr 0.0.0.0/0 || true  # SSH

aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp --port 80 --cidr 0.0.0.0/0 || true  # HTTP

aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp --port 443 --cidr 0.0.0.0/0 || true  # HTTPS

echo -e "${GREEN}✅ Security group created: $SECURITY_GROUP_ID${NC}"

# Create Application Load Balancer (ALB)
echo -e "${YELLOW}⚖️  Creating Application Load Balancer...${NC}"

# Get subnets for ALB
SUBNET_IDS=$(aws ec2 describe-subnets \
    --filters Name=vpc-id,Values=$VPC_ID Name=default-for-az,Values=true \
    --query 'Subnets[*].SubnetId' --output text | tr '\t' ' ')

if [ -z "$SUBNET_IDS" ]; then
    echo -e "${RED}❌ No suitable subnets found${NC}"
    exit 1
fi

# Create ALB
ALB_ARN=$(aws elbv2 create-load-balancer \
    --name ${PROJECT_NAME}-alb \
    --subnets $SUBNET_IDS \
    --security-groups $SECURITY_GROUP_ID \
    --scheme internet-facing \
    --type application \
    --query 'LoadBalancers[0].LoadBalancerArn' --output text)

# Get ALB DNS name
ALB_DNS=$(aws elbv2 describe-load-balancers \
    --load-balancer-arns $ALB_ARN \
    --query 'LoadBalancers[0].DNSName' --output text)

echo -e "${GREEN}✅ Load balancer created: $ALB_DNS${NC}"

# Create target group
TARGET_GROUP_ARN=$(aws elbv2 create-target-group \
    --name ${PROJECT_NAME}-tg \
    --protocol HTTP \
    --port 5001 \
    --vpc-id $VPC_ID \
    --health-check-path /api/health \
    --health-check-interval-seconds 30 \
    --health-check-timeout-seconds 5 \
    --healthy-threshold-count 2 \
    --unhealthy-threshold-count 3 \
    --query 'TargetGroups[0].TargetGroupArn' --output text)

echo -e "${GREEN}✅ Target group created${NC}"

# Create ALB listener
aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn=$TARGET_GROUP_ARN

echo -e "${GREEN}✅ ALB listener created${NC}"

# Create Launch Template
echo -e "${YELLOW}🚀 Creating launch template...${NC}"

# Get latest Amazon Linux 2 AMI
AMI_ID=$(aws ec2 describe-images \
    --owners amazon \
    --filters Name=name,Values=amzn2-ami-hvm-* Name=root-device-type,Values=ebs Name=state,Values=available \
    --query 'Images | sort_by(@, &CreationDate) | [-1].ImageId' --output text)

# Create user data script
cat > user-data.sh << 'EOF'
#!/bin/bash
yum update -y

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs git

# Install PM2
npm install -g pm2

# Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install

# Install CloudWatch agent
yum install -y amazon-cloudwatch-agent

# Create application user
useradd -m -s /bin/bash packcode

# Create application directory
mkdir -p /var/www/packcode
chown packcode:packcode /var/www/packcode

# Install nginx
amazon-linux-extras install nginx1 -y
systemctl enable nginx

# Create deployment script
cat > /home/packcode/deploy.sh << 'DEPLOY_EOF'
#!/bin/bash
set -e

# Get latest deployment from S3
aws s3 cp s3://BUCKET_NAME/latest.tar.gz /tmp/packcode.tar.gz
cd /var/www/packcode
tar -xzf /tmp/packcode.tar.gz --strip-components=1

# Install dependencies
npm ci --production
cd client && npm ci && npm run build && cd ..

# Start/restart application
pm2 restart packcode || pm2 start server/index.js --name packcode
DEPLOY_EOF

chmod +x /home/packcode/deploy.sh
chown packcode:packcode /home/packcode/deploy.sh

# Signal that the instance is ready
/opt/aws/bin/cfn-signal -e $? --stack ${AWS::StackName} --resource AutoScalingGroup --region ${AWS::Region}
EOF

# Base64 encode user data
USER_DATA=$(base64 -w 0 user-data.sh)

# Create launch template
aws ec2 create-launch-template \
    --launch-template-name ${PROJECT_NAME}-template \
    --launch-template-data "{
        \"ImageId\": \"$AMI_ID\",
        \"InstanceType\": \"t3.small\",
        \"SecurityGroupIds\": [\"$SECURITY_GROUP_ID\"],
        \"IamInstanceProfile\": {\"Name\": \"${PROJECT_NAME}-ec2-profile\"},
        \"UserData\": \"$USER_DATA\",
        \"TagSpecifications\": [{
            \"ResourceType\": \"instance\",
            \"Tags\": [{\"Key\": \"Name\", \"Value\": \"${PROJECT_NAME}-instance\"}]
        }]
    }"

echo -e "${GREEN}✅ Launch template created${NC}"

# Create Auto Scaling Group
echo -e "${YELLOW}📈 Creating Auto Scaling Group...${NC}"

aws autoscaling create-auto-scaling-group \
    --auto-scaling-group-name ${PROJECT_NAME}-asg \
    --launch-template LaunchTemplateName=${PROJECT_NAME}-template,Version='$Latest' \
    --min-size 1 \
    --max-size 3 \
    --desired-capacity 1 \
    --target-group-arns $TARGET_GROUP_ARN \
    --health-check-type ELB \
    --health-check-grace-period 300 \
    --vpc-zone-identifier "$(echo $SUBNET_IDS | tr ' ' ',')"

echo -e "${GREEN}✅ Auto Scaling Group created${NC}"

# Create CloudFormation template for additional resources
echo -e "${YELLOW}📄 Creating CloudFormation template...${NC}"

cat > packcode-infrastructure.yaml << EOF
AWSTemplateFormatVersion: '2010-09-09'
Description: 'PackCode Infrastructure'

Parameters:
  ProjectName:
    Type: String
    Default: $PROJECT_NAME
  Domain:
    Type: String
    Default: $DOMAIN

Resources:
  # Route53 Hosted Zone (if domain management is needed)
  HostedZone:
    Type: AWS::Route53::HostedZone
    Properties:
      Name: !Ref Domain
      HostedZoneConfig:
        Comment: !Sub 'Hosted zone for \${Domain}'

  # ACM Certificate for HTTPS
  SSLCertificate:
    Type: AWS::CertificateManager::Certificate
    Properties:
      DomainName: !Ref Domain
      SubjectAlternativeNames:
        - !Sub 'www.\${Domain}'
      ValidationMethod: DNS
      DomainValidationOptions:
        - DomainName: !Ref Domain
          HostedZoneId: !Ref HostedZone
        - DomainName: !Sub 'www.\${Domain}'
          HostedZoneId: !Ref HostedZone

  # CloudWatch Log Group
  LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/\${ProjectName}'
      RetentionInDays: 14

  # Systems Manager Parameters for configuration
  MongoDBURI:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/\${ProjectName}/MONGODB_URI'
      Type: SecureString
      Value: 'mongodb+srv://user:pass@cluster.mongodb.net/packcode'
      Description: 'MongoDB connection string'

  JWTSecret:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/\${ProjectName}/JWT_SECRET'
      Type: SecureString
      Value: !Sub '\${AWS::StackId}-jwt-secret'
      Description: 'JWT signing secret'

Outputs:
  LoadBalancerDNS:
    Description: 'Load Balancer DNS Name'
    Value: '$ALB_DNS'
    Export:
      Name: !Sub '\${AWS::StackName}-LoadBalancerDNS'
      
  HostedZoneId:
    Description: 'Route53 Hosted Zone ID'
    Value: !Ref HostedZone
    Export:
      Name: !Sub '\${AWS::StackName}-HostedZoneId'
EOF

echo -e "${GREEN}✅ CloudFormation template created${NC}"

# Clean up temporary files
rm -f ec2-trust-policy.json ec2-policy.json user-data.sh

# Summary
echo
echo -e "${GREEN}🎉 AWS Infrastructure Setup Complete!${NC}"
echo
echo -e "${BLUE}📋 Resources Created:${NC}"
echo "S3 Bucket: $BUCKET_NAME"
echo "Security Group: $SECURITY_GROUP_ID"
echo "Load Balancer: $ALB_DNS"
echo "Target Group: $TARGET_GROUP_ARN"
echo "Launch Template: ${PROJECT_NAME}-template"
echo "Auto Scaling Group: ${PROJECT_NAME}-asg"
echo
echo -e "${BLUE}🎯 Next Steps:${NC}"
echo "1. Deploy CloudFormation template:"
echo "   aws cloudformation create-stack --stack-name $PROJECT_NAME --template-body file://packcode-infrastructure.yaml --capabilities CAPABILITY_IAM"
echo
echo "2. Update Route53 DNS to point to load balancer:"
echo "   Domain: $DOMAIN -> $ALB_DNS"
echo
echo "3. Deploy your application:"
echo "   ./deploy/aws-deploy.sh"
echo
echo "4. Configure SSL certificate in ALB after DNS validation"
echo
echo -e "${YELLOW}💰 Estimated Monthly Costs:${NC}"
echo "- t3.small instance: ~\$15/month"
echo "- Application Load Balancer: ~\$20/month"
echo "- Data transfer: ~\$5-10/month"
echo "- Total: ~\$40-45/month"
echo
echo -e "${GREEN}✅ Your AWS infrastructure is ready for PackCode!${NC}"