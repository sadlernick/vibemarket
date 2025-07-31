# PackCode AWS Deployment Guide

## 🏗️ AWS Infrastructure Overview

PackCode on AWS uses a modern, scalable architecture:

- **Application Load Balancer** - Routes traffic and handles SSL
- **Auto Scaling Group** - Manages EC2 instances (scales based on traffic)
- **EC2 Instances** - Run your Node.js application
- **S3** - Stores deployment packages and static assets
- **Route53** - DNS management for pack-code.com
- **Systems Manager** - Automated deployments and configuration
- **CloudWatch** - Monitoring and logging

## 💰 Cost Breakdown

### **Minimal Setup** (~$40/month)
- t3.small instance: $15/month
- Application Load Balancer: $18/month
- Data transfer: $5-10/month

### **Production Setup** (~$80/month)
- t3.medium instances (2x): $35/month
- Application Load Balancer: $18/month
- Route53 hosted zone: $0.50/month
- S3 storage: $2/month
- Data transfer: $15/month
- CloudWatch logs: $5/month

### **High-Traffic Setup** (~$200/month)
- t3.large instances (3x): $100/month
- Application Load Balancer: $18/month
- Route53 + Certificate Manager: $1/month
- S3 + CloudFront CDN: $10/month
- Enhanced monitoring: $15/month
- Data transfer: $50/month

## 🚀 Quick Setup (30 minutes)

### 1. Prerequisites
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install

# Configure AWS credentials
aws configure
# Enter: Access Key ID, Secret Access Key, Region (us-east-1), Output format (json)
```

### 2. Run Infrastructure Setup
```bash
cd deploy
chmod +x *.sh
./aws-setup.sh
```

This creates:
- S3 bucket for deployments
- IAM roles and policies
- Security groups
- Application Load Balancer
- Auto Scaling Group with launch template
- CloudFormation template for DNS/SSL

### 3. Deploy DNS and SSL
```bash
# Deploy additional infrastructure
aws cloudformation create-stack \
  --stack-name packcode \
  --template-body file://packcode-infrastructure.yaml \
  --capabilities CAPABILITY_IAM

# Wait for stack creation
aws cloudformation wait stack-create-complete --stack-name packcode
```

### 4. Update DNS
Point your domain to the load balancer:
```bash
# Get load balancer DNS
ALB_DNS=$(aws elbv2 describe-load-balancers --names packcode-alb --query 'LoadBalancers[0].DNSName' --output text)
echo "Point pack-code.com CNAME to: $ALB_DNS"
```

### 5. Deploy Application
```bash
./aws-deploy.sh
```

## 🔧 Configuration Details

### Environment Variables (AWS Systems Manager)
```bash
# Store secrets securely
aws ssm put-parameter --name "/packcode/MONGODB_URI" --value "mongodb+srv://..." --type SecureString
aws ssm put-parameter --name "/packcode/JWT_SECRET" --value "your-secret" --type SecureString
aws ssm put-parameter --name "/packcode/STRIPE_SECRET_KEY" --value "sk_live_..." --type SecureString
```

### Auto Scaling Configuration
- **Min instances**: 1
- **Max instances**: 3  
- **Desired capacity**: 1
- **Scale up**: CPU > 70% for 5 minutes
- **Scale down**: CPU < 30% for 10 minutes

### Load Balancer Health Checks
- **Path**: `/api/health`
- **Interval**: 30 seconds
- **Timeout**: 5 seconds
- **Healthy threshold**: 2 consecutive successes
- **Unhealthy threshold**: 3 consecutive failures

## 🔄 Deployment Options

### Option 1: GitHub Actions (Recommended)
```yaml
# Automatically deploys on push to main branch
# File: .github/workflows/deploy.yml (already created)

# Setup required secrets in GitHub:
# AWS_ACCESS_KEY_ID
# AWS_SECRET_ACCESS_KEY  
# SLACK_WEBHOOK (optional)
```

### Option 2: Manual Deployment
```bash
# From your local machine
./deploy/aws-deploy.sh

# From CI/CD pipeline
curl -X POST -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/yourusername/appmarketplace/actions/workflows/deploy.yml/dispatches" \
  -d '{"ref":"main"}'
```

### Option 3: AWS CodePipeline (Advanced)
```bash
# Create CodePipeline for advanced CI/CD
aws codepipeline create-pipeline --cli-input-json file://codepipeline.json
```

## 📊 Monitoring & Logging

### CloudWatch Dashboards
```bash
# Create custom dashboard
aws cloudwatch put-dashboard --dashboard-name PackCode --dashboard-body file://dashboard.json
```

### Log Analysis
```bash
# View application logs
aws logs tail /aws/ec2/packcode --follow

# Search for errors
aws logs filter-log-events --log-group-name /aws/ec2/packcode --filter-pattern "ERROR"

# Monitor deployment logs
aws logs tail /aws/codedeploy/packcode --follow
```

### Alerts
```bash
# Create CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name packcode-high-cpu \
  --alarm-description "PackCode high CPU usage" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

## 🔒 Security Best Practices

### IAM Roles
- **EC2 instances**: Minimal permissions (S3 read, SSM parameters)
- **Deployment**: Separate role for CI/CD
- **Monitoring**: CloudWatch access only

### Network Security
- **ALB**: Public subnets only
- **EC2**: Private subnets (communicate through ALB)
- **Security Groups**: Least privilege access
- **NACLs**: Additional network-level protection

### Application Security
```bash
# Enable AWS WAF on ALB
aws wafv2 create-web-acl --name packcode-waf --scope REGIONAL

# Enable VPC Flow Logs
aws ec2 create-flow-logs --resource-type VPC --resource-ids $VPC_ID
```

## 🚀 Scaling Strategies

### Horizontal Scaling
```bash
# Update Auto Scaling Group
aws autoscaling update-auto-scaling-group \
  --auto-scaling-group-name packcode-asg \
  --min-size 2 \
  --max-size 5 \
  --desired-capacity 2
```

### Vertical Scaling
```bash
# Update launch template with larger instance
aws ec2 create-launch-template-version \
  --launch-template-name packcode-template \
  --source-version 1 \
  --launch-template-data '{"InstanceType":"t3.medium"}'
```

### Database Scaling
```bash
# Scale MongoDB Atlas cluster
# Done through MongoDB Atlas dashboard
# M2 ($9) → M10 ($57) → M20 ($114) → M30 ($207)
```

## 🔄 Backup & Recovery

### Automated Backups
```bash
# Create AMI backup
aws ec2 create-image --instance-id i-1234567890abcdef0 --name packcode-backup-$(date +%Y%m%d)

# S3 versioning (already enabled)
aws s3api get-bucket-versioning --bucket packcode-deployments-123456
```

### Disaster Recovery
```bash
# Deploy to multiple regions
./aws-setup.sh --region us-west-2

# Database backup
# MongoDB Atlas handles automated backups
```

## 🛡️ SSL/TLS Configuration

### Certificate Manager
```bash
# Request SSL certificate
aws acm request-certificate \
  --domain-name pack-code.com \
  --subject-alternative-names www.pack-code.com \
  --validation-method DNS

# Add to load balancer
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTPS \
  --port 443 \
  --ssl-policy ELBSecurityPolicy-TLS-1-2-2017-01 \
  --certificates CertificateArn=$CERT_ARN
```

## 📈 Performance Optimization

### CloudFront CDN
```bash
# Create CloudFront distribution
aws cloudfront create-distribution --distribution-config file://cloudfront.json
```

### ElastiCache Redis
```bash
# Add Redis for sessions/caching
aws elasticache create-cache-cluster \
  --cache-cluster-id packcode-redis \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --num-cache-nodes 1
```

### Database Optimization
- **Indexes**: Add on frequently queried fields
- **Connection pooling**: Limit concurrent connections
- **Read replicas**: For read-heavy workloads

## 🆘 Troubleshooting

### Common Issues

#### Deployment Fails
```bash
# Check EC2 instance logs
aws ssm send-command \
  --instance-ids i-1234567890abcdef0 \
  --document-name "AWS-RunShellScript" \
  --parameters commands="journalctl -u packcode -n 50"
```

#### Health Check Fails
```bash
# Test health endpoint
ALB_DNS=$(aws elbv2 describe-load-balancers --names packcode-alb --query 'LoadBalancers[0].DNSName' --output text)
curl -v http://$ALB_DNS/api/health
```

#### High Memory Usage
```bash
# Check instance metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/EC2 \
  --metric-name MemoryUtilization \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 3600 \
  --statistics Average
```

#### SSL Certificate Issues
```bash
# Check certificate status
aws acm describe-certificate --certificate-arn $CERT_ARN

# Validate DNS records
dig _acme-challenge.pack-code.com TXT
```

## 📞 Support Resources

### AWS Documentation
- [Application Load Balancer Guide](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/)
- [Auto Scaling User Guide](https://docs.aws.amazon.com/autoscaling/ec2/userguide/)
- [Systems Manager Documentation](https://docs.aws.amazon.com/systems-manager/)

### Monitoring
- **AWS Console**: CloudWatch dashboard
- **Command line**: `aws logs tail`
- **Third-party**: Datadog, New Relic integration

### Getting Help
1. Check AWS CloudWatch logs first
2. Review GitHub Actions workflow logs  
3. Test individual components (ALB, EC2, database)
4. Use AWS Support (if you have a support plan)

## 🎯 Next Steps

1. **Complete setup** with the scripts provided
2. **Configure monitoring** and alerts
3. **Set up automated backups**
4. **Test scaling** under load
5. **Optimize performance** based on metrics
6. **Plan disaster recovery** procedures

Your PackCode marketplace will be running on enterprise-grade AWS infrastructure! 🚀