# PackCode Code Deployment Guide

## 🚀 How Code Deployment Works

PackCode uses **code-based deployments** (not WordPress-style admin panels). You make changes by editing code files, committing to Git, and deploying through automated pipelines.

## 📝 Making Changes to Your Website

### 1. **Content Changes** (Text, Images, etc.)

#### Update Homepage Content
```javascript
// File: client/src/pages/Home.tsx
export default function Home() {
  return (
    <div className="hero-section">
      <h1>Welcome to PackCode</h1>  {/* Edit this text */}
      <p>Your marketplace for vibe coders</p>  {/* Edit this text */}
    </div>
  );
}
```

#### Update Navigation Menu
```javascript
// File: client/src/components/Navbar.tsx
const navigation = [
  { name: 'Browse Projects', href: '/projects' },
  { name: 'Categories', href: '/categories' },  // Add new menu item
  { name: 'Blog', href: '/blog' },             // Add new menu item
];
```

#### Add New Pages
```bash
# Create new page file
touch client/src/pages/Blog.tsx

# Add route in App.tsx
<Route path="/blog" element={<Blog />} />
```

### 2. **Styling Changes** (Colors, Layout, etc.)

#### Update Colors
```css
/* File: client/src/index.css */
:root {
  --primary-color: #3B82F6;    /* Change brand color */
  --secondary-color: #10B981;  /* Change accent color */
}
```

#### Update Layout
```javascript
// File: client/src/components/Layout.tsx
<div className="max-w-7xl mx-auto px-4">  {/* Change container width */}
  {children}
</div>
```

### 3. **Feature Changes** (Functionality)

#### Add New Project Categories
```javascript
// File: server/models/Project.js
const categorySchema = {
  enum: [
    'web-app', 
    'mobile-app', 
    'desktop-app', 
    'api',
    'ai-tool',        // Add new category
    'blockchain'      // Add new category
  ]
};
```

#### Modify Pricing Logic
```javascript
// File: client/src/pages/PostProjects.tsx
const calculateFees = (sellerPrice) => {
  const marketplaceFee = (sellerPrice * 0.15);  // Change from 20% to 15%
  return { 
    totalPrice: Math.round(sellerPrice + marketplaceFee),
    sellerEarnings: sellerPrice 
  };
};
```

## 🔄 Deployment Workflows

### Option 1: Automatic Deployment (Recommended)

**Setup GitHub Actions** (already configured):
1. Push code to `main` branch
2. GitHub automatically runs tests
3. If tests pass, deploys to AWS
4. Website updates in ~5 minutes

```bash
# Make your changes
git add .
git commit -m "Update homepage hero text"
git push origin main

# GitHub Actions automatically deploys!
```

### Option 2: Manual Deployment

**From your local machine:**
```bash
# Deploy to AWS
./deploy/aws-deploy.sh

# Or deploy to DigitalOcean
./deploy/deploy.sh
```

### Option 3: Development Preview

**Test changes locally first:**
```bash
# Start development server
npm run dev

# Open http://localhost:3001 to preview changes
# Make changes and see them instantly
```

## 📁 Key Files to Know

### **Content & Pages**
```
client/src/pages/
├── Home.tsx          # Homepage
├── ProjectDetail.tsx # Individual project pages  
├── Dashboard.tsx     # User dashboard
├── PostProjects.tsx  # Create project page
└── AuthorProfile.tsx # Author profile pages
```

### **Components**
```
client/src/components/
├── Navbar.tsx        # Navigation menu
├── Footer.tsx        # Site footer
├── ProjectCard.tsx   # Project display cards
└── Layout.tsx        # Overall site layout
```

### **Styling**
```
client/src/
├── index.css         # Global styles
└── tailwind.config.js # Design system config
```

### **Backend Logic**
```
server/
├── routes/           # API endpoints  
├── models/           # Database schemas
└── middleware/       # Authentication, etc.
```

### **Configuration**
```
├── .env.production   # Environment variables
├── package.json      # Dependencies
└── deploy/           # Deployment scripts
```

## 🛠️ Common Modification Examples

### Change Marketplace Fee
```javascript
// File: client/src/pages/PostProjects.tsx
const MARKETPLACE_FEE_PCT = 15; // Change from 20 to 15
```

### Add New Social Media Links
```javascript
// File: client/src/components/Footer.tsx
const socialLinks = [
  { name: 'Twitter', url: 'https://twitter.com/packcode' },
  { name: 'Discord', url: 'https://discord.gg/packcode' },  // Add new
  { name: 'LinkedIn', url: 'https://linkedin.com/company/packcode' } // Add new
];
```

### Update Contact Information
```javascript
// File: client/src/pages/Contact.tsx
const contactInfo = {
  email: 'hello@pack-code.com',      // Update email
  phone: '+1 (555) 123-4567',        // Update phone
  address: 'San Francisco, CA'       // Update location
};
```

### Add New Payment Methods
```javascript
// File: client/src/components/CheckoutForm.tsx
const paymentMethods = [
  'credit_card',
  'paypal',          // Add PayPal
  'crypto',          // Add cryptocurrency
  'bank_transfer'    // Add bank transfer
];
```

## 🎨 Design Customization

### Update Brand Colors
```css
/* File: client/tailwind.config.js */
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',    // Main brand color
          900: '#1e3a8a',
        }
      }
    }
  }
}
```

### Change Fonts
```css
/* File: client/src/index.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

body {
  font-family: 'Inter', sans-serif;  /* Change font */
}
```

### Update Logo
```javascript
// File: client/src/components/Navbar.tsx
<img 
  src="/logo-new.png"      // Replace logo file
  alt="PackCode" 
  className="h-8 w-auto" 
/>
```

## 🔒 Environment Configuration

### Update Production Settings
```bash
# File: .env.production
CLIENT_URL=https://pack-code.com
MONGODB_URI=mongodb+srv://...
STRIPE_SECRET_KEY=sk_live_...    # Switch to live keys
OPENAI_API_KEY=sk-...            # Add AI features
EMAIL_HOST=smtp.pack-code.com    # Custom email
```

### Add New Environment Variables
```bash
# Add to .env.production
ANALYTICS_ID=GA-123456789
SLACK_WEBHOOK=https://hooks.slack.com/...
SENTRY_DSN=https://...
```

## 📊 Analytics & Monitoring

### Add Google Analytics
```javascript
// File: client/public/index.html
<script async src="https://www.googletagmanager.com/gtag/js?id=GA-123456789"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA-123456789');
</script>
```

### Add Error Tracking
```javascript
// File: client/src/index.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
});
```

## 🚀 Deployment Checklist

### Before Making Changes
- [ ] Create backup: `git checkout -b backup-$(date +%Y%m%d)`
- [ ] Test locally: `npm run dev`
- [ ] Run tests: `npm test`

### After Making Changes
- [ ] Commit changes: `git commit -m "Description of changes"`
- [ ] Push to main: `git push origin main`
- [ ] Monitor deployment in GitHub Actions
- [ ] Test live site after deployment
- [ ] Check error logs if issues arise

### Rollback if Needed
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or restore from backup
git checkout backup-20241201
git checkout -b hotfix
# Fix issues, then merge
```

## 🆘 Troubleshooting

### Deployment Fails
1. Check GitHub Actions logs
2. Look for test failures
3. Check AWS CloudWatch logs
4. Verify environment variables

### Website Not Loading
1. Check load balancer health
2. Verify database connection
3. Check SSL certificate
4. Review nginx configuration

### Features Not Working
1. Check browser console for errors
2. Verify API endpoints
3. Test database queries
4. Check third-party integrations

## 📞 Getting Help

### Log Locations
- **GitHub Actions**: Repository → Actions tab
- **AWS Logs**: CloudWatch → Log Groups
- **Application Logs**: PM2 or server logs
- **Database Logs**: MongoDB Atlas dashboard

### Development Tools
```bash
# View local logs
npm run dev

# Run specific tests
npm test -- --watch

# Check code quality
npm run lint

# Preview production build
npm run build && npm run preview
```

## 🎯 Summary

**PackCode is fully code-based** - no admin panels or WordPress-style editors. You modify the website by:

1. **Editing code files** (React components, CSS, config)
2. **Committing to Git** 
3. **Automatic deployment** via GitHub Actions
4. **Changes go live** in ~5 minutes

This approach gives you complete control, version history, and professional deployment practices. Perfect for a developer marketplace! 🚀