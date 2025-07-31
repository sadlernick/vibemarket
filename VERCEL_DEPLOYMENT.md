# 🚀 PackCode Vercel Deployment Guide

This guide will help you deploy PackCode to Vercel with optimized build times and serverless functions.

## 📋 Prerequisites

1. **Vercel CLI**: Install globally
   ```bash
   npm install -g vercel
   ```

2. **Environment Variables**: Prepare these values
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - Random secret for JWT tokens
   - `GITHUB_CLIENT_ID` - GitHub OAuth app client ID
   - `GITHUB_CLIENT_SECRET` - GitHub OAuth app client secret
   - `STRIPE_SECRET_KEY` - Stripe secret key
   - `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
   - `CLIENT_URL` - Your Vercel app URL (e.g., https://packcode.vercel.app)

## 🏗️ Build Optimizations

The project has been optimized for Vercel deployment:

- ✅ **Sourcemaps disabled** for faster builds
- ✅ **Environment-specific configurations**
- ✅ **Serverless-friendly MongoDB connections**
- ✅ **Optimized bundle size**
- ✅ **Vercel routing configuration**

## 🚀 Deployment Steps

### Option 1: Quick Deploy (Recommended)

1. **Run the deployment script**:
   ```bash
   ./deploy-vercel.sh
   ```

2. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

### Option 2: Manual Deploy

1. **Install dependencies**:
   ```bash
   npm install
   cd client && npm install && cd ..
   ```

2. **Build the client**:
   ```bash
   cd client && npm run build:vercel && cd ..
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

## ⚙️ Environment Configuration

After deployment, set your environment variables in the Vercel dashboard:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each required variable for **Production**

### GitHub OAuth Setup

Update your GitHub OAuth app settings:
- **Authorization callback URL**: `https://your-app.vercel.app/auth/github/callback`
- **Application home page**: `https://your-app.vercel.app`

## 🔧 Project Structure

```
├── client/                 # React frontend
│   ├── build/             # Production build (generated)
│   └── package.json       # Client dependencies
├── server/                # Express backend
│   └── index.js          # Serverless function entry
├── vercel.json           # Vercel configuration
└── deploy-vercel.sh      # Deployment script
```

## 📁 Key Files

- **vercel.json**: Vercel deployment configuration
- **client/.env.production**: Production environment variables
- **.vercelignore**: Files excluded from deployment
- **deploy-vercel.sh**: Automated deployment script

## 🐛 Troubleshooting

### Build Timeout
If the build times out, the project is optimized with:
- Disabled source maps (`GENERATE_SOURCEMAP=false`)
- Excluded test files and unnecessary assets
- Optimized TypeScript compilation

### Environment Variables
- Use absolute environment variable names in Vercel dashboard
- Don't include quotes around values
- CLIENT_URL should be your full Vercel app URL

### Database Connection
The MongoDB connection is optimized for serverless:
- Connection pooling enabled
- Proper timeout configurations
- Connection reuse across requests

## 📊 Performance

Expected build times:
- **Client build**: 2-4 minutes
- **Server build**: 30-60 seconds
- **Total deployment**: 3-5 minutes

## 🔗 Post-Deployment

1. **Test the application**: Visit your Vercel URL
2. **Check API endpoints**: `https://your-app.vercel.app/api/health`
3. **Test GitHub OAuth**: Try signing in with GitHub
4. **Monitor logs**: Use Vercel dashboard for debugging

## 💡 Tips

- Use `vercel --prod` for production deployments
- Use `vercel` for preview deployments
- Environment variables are automatically injected
- Logs are available in the Vercel dashboard

## 🆘 Support

If you encounter issues:
1. Check Vercel function logs
2. Verify environment variables are set
3. Ensure MongoDB URI is accessible from Vercel
4. Test GitHub OAuth callback URL configuration