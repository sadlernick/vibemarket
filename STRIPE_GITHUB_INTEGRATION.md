# PackCode Stripe & GitHub Integration Guide

## 🎯 Overview

PackCode now includes complete **Stripe payment processing** and **GitHub authentication/verification** systems that work seamlessly together to create a secure, verified marketplace for code projects.

## 💳 Stripe Integration

### Payment Flow
1. **Seller Setup**: Sellers connect Stripe accounts to receive payments
2. **Project Pricing**: Projects have marketplace fee (20%) added on top of seller price
3. **Buyer Payment**: Secure checkout with Stripe Elements
4. **Fund Distribution**: Automatic split between seller and marketplace
5. **License Generation**: Digital license created upon successful payment

### Fee Structure
```javascript
const sellerPrice = 20.00;           // What seller sets
const marketplaceFee = 4.00;         // 20% fee added on top  
const totalPrice = 24.00;            // What customer pays
const sellerEarnings = 20.00;        // What seller receives
```

### Stripe Connect Setup
```bash
# Seller onboarding flow
POST /api/payments/create-connect-account
-> Creates Stripe Express account for seller
-> Returns onboarding URL for KYC/banking setup

# Check seller status
GET /api/payments/connect-account-status
-> Returns account verification status
```

### Payment Processing
```bash
# Create payment intent
POST /api/payments/create-payment-intent
{
  "projectId": "project_123"
}

# Confirm payment
POST /api/payments/confirm-payment
{
  "paymentIntentId": "pi_123"
}
-> Creates license record
-> Updates project stats
```

## 🐙 GitHub Integration

### Authentication Flow
1. **OAuth Login**: Users can sign up/login with GitHub
2. **Repository Access**: GitHub token stored for repository verification
3. **Project Verification**: Ensures users own repositories they're posting
4. **Seamless Experience**: Auto-populate project details from GitHub

### GitHub OAuth Setup
```bash
# Initiate OAuth
GET /api/github/oauth/login
-> Returns GitHub authorization URL

# Handle callback
POST /api/github/oauth/callback
{
  "code": "oauth_code",
  "state": "oauth_state"
}
-> Creates/updates user with GitHub profile
-> Returns JWT token for app authentication
```

### Repository Verification
```bash
# Verify repository ownership
POST /api/github/verify-repository
{
  "repositoryUrl": "https://github.com/user/repo"
}
-> Checks user has push/admin access
-> Returns repository metadata

# List user repositories
GET /api/github/repositories
-> Returns user's accessible repositories
```

## 🔗 Integration Points

### 1. User Registration/Login
```typescript
// Users can register via:
1. Email/password (traditional)
2. GitHub OAuth (seamless, auto-verified)
3. Google OAuth (if configured)

// GitHub users get:
- Auto-verified status
- Profile picture from GitHub
- Repository access for project posting
```

### 2. Project Posting Workflow
```typescript
// Enhanced project posting with GitHub:
1. User connects GitHub (if not already)
2. Select repository from dropdown or enter URL
3. System verifies repository ownership
4. Auto-populate project details from GitHub
5. Set pricing and payment setup
6. Publish with verified repository links
```

### 3. Payment + Verification Flow
```typescript
// Buyers get confidence through:
1. GitHub-verified repository ownership
2. Secure Stripe payment processing
3. Automatic license generation
4. Repository access verification before purchase
```

## 🛠️ Frontend Components

### GitHub Components
```typescript
// GitHub OAuth login button
<GitHubLogin 
  onSuccess={() => navigate('/dashboard')}
  onError={(error) => setError(error)}
/>

// Repository picker with verification
<GitHubRepositoryPicker
  value={repositoryUrl}
  onChange={(url, repo) => handleRepoChange(url, repo)}
  label="Project Repository"
  required={true}
/>
```

### Payment Components
```typescript
// Stripe checkout form
<CheckoutForm
  projectId="123"
  projectTitle="Awesome Project"
  amount={24.99}
  marketplaceFee={4.99}
  sellerAmount={20.00}
  onSuccess={() => handlePurchaseSuccess()}
  onCancel={() => handleCancel()}
/>
```

## 🔧 Configuration

### Environment Variables
```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_... # or sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_live_... # or pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# App URLs
CLIENT_URL=https://pack-code.com
API_URL=https://pack-code.com/api
```

### Stripe Setup Checklist
- [ ] Create Stripe account
- [ ] Enable Stripe Connect for marketplace
- [ ] Configure webhook endpoints
- [ ] Set up Express accounts for sellers
- [ ] Test with Stripe test cards

### GitHub Setup Checklist
- [ ] Create GitHub OAuth App
- [ ] Set authorization callback URL: `https://pack-code.com/auth/github/callback`
- [ ] Configure homepage URL: `https://pack-code.com`
- [ ] Add environment variables
- [ ] Test OAuth flow

## 🧪 Testing

### Payment Testing
```bash
# Run payment integration tests
npm test -- PaymentGitHubIntegration.test.tsx

# Stripe test cards
4242424242424242  # Visa - succeeds
4000000000000002  # Visa - declined
4000000000009995  # Visa - insufficient funds
```

### GitHub Testing
```bash
# Test GitHub OAuth flow
1. Click "Continue with GitHub"
2. Authorize on GitHub
3. Verify user creation/login
4. Test repository verification

# Test repository picker
1. Connect GitHub account
2. Browse repositories
3. Select repository
4. Verify ownership validation
```

## 🚀 Production Deployment

### Stripe Production Setup
```bash
# Switch to live keys
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Configure webhooks
Endpoint URL: https://pack-code.com/api/payments/webhook
Events: payment_intent.succeeded, account.updated

# Verify SSL certificate
curl -I https://pack-code.com/api/health
```

### GitHub Production Setup
```bash
# Update OAuth app settings
Homepage URL: https://pack-code.com
Authorization callback URL: https://pack-code.com/auth/github/callback

# Test production OAuth
1. Navigate to https://pack-code.com/login
2. Click "Continue with GitHub"
3. Verify redirect and authentication
```

## 🔒 Security Considerations

### Payment Security
- ✅ **PCI Compliance**: Stripe handles card data
- ✅ **Webhook Verification**: Signed webhook payloads
- ✅ **Environment Separation**: Test vs live keys
- ✅ **HTTPS Enforced**: All payment endpoints secure
- ✅ **Token Validation**: JWT authentication required

### GitHub Security  
- ✅ **OAuth Security**: Standard OAuth 2.0 flow
- ✅ **Token Storage**: Encrypted GitHub tokens
- ✅ **Repository Verification**: Ownership validation
- ✅ **Scope Limitation**: Minimal required permissions
- ✅ **Token Refresh**: Handle token expiration

## 📊 Analytics & Monitoring

### Payment Metrics
```bash
# Key metrics to track:
- Payment success rate
- Average transaction value
- Seller onboarding completion
- Revenue per project category
- Chargeback/dispute rates
```

### GitHub Metrics
```bash
# Key metrics to track:
- GitHub authentication success rate
- Repository verification success rate
- % of projects with verified repositories
- OAuth token refresh rates
- API rate limit usage
```

## 🆘 Troubleshooting

### Common Payment Issues
```bash
# Payment fails
1. Check Stripe webhook configuration
2. Verify SSL certificate
3. Test with Stripe test cards
4. Check seller account status

# Seller onboarding fails
1. Verify Stripe Connect configuration
2. Check return/refresh URLs
3. Validate business type settings
```

### Common GitHub Issues
```bash
# OAuth fails
1. Verify GitHub app configuration
2. Check callback URL matches exactly
3. Test with different browsers
4. Clear browser cache/cookies

# Repository verification fails
1. Check repository permissions
2. Verify GitHub token is valid
3. Test repository URL format
4. Check API rate limits
```

## 🎯 Best Practices

### User Experience
1. **Clear Messaging**: Explain why GitHub connection helps
2. **Progressive Enhancement**: Works without GitHub
3. **Error Handling**: Helpful error messages
4. **Mobile Friendly**: OAuth popup works on mobile
5. **Fast Loading**: Async verification

### Developer Experience
1. **Environment Parity**: Same flow across environments
2. **Error Logging**: Comprehensive error tracking
3. **Rate Limiting**: Respect GitHub API limits
4. **Caching**: Cache repository data appropriately
5. **Monitoring**: Track integration health

## 🚀 Future Enhancements

### Potential Improvements
- **GitLab Support**: Add GitLab OAuth and repository verification
- **Bitbucket Support**: Support for Bitbucket repositories
- **Automated Testing**: Run tests on repository updates
- **Code Quality Metrics**: Integration with code analysis tools
- **License Scanning**: Automatic open-source license detection
- **Security Scanning**: Vulnerability detection integration

### Payment Enhancements
- **Multiple Currencies**: Support international payments
- **Subscription Models**: Recurring payment support
- **Affiliate System**: Referral fee distribution
- **Bulk Purchases**: Volume discount support
- **Refund Management**: Automated refund processing

## 🎉 Summary

PackCode now provides a **complete marketplace solution** with:

✅ **Secure Payments**: Industry-standard Stripe integration
✅ **GitHub Verification**: Repository ownership validation
✅ **Seamless UX**: One-click authentication and verification
✅ **Production Ready**: Comprehensive testing and error handling
✅ **Scalable Architecture**: Built for growth and additional integrations

Your marketplace is ready to handle real transactions with verified code repositories! 🚀