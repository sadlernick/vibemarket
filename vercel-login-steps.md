# 🔐 Vercel CLI Login Steps

## Quick Login Process:

1. **Run this command in your terminal:**
   ```bash
   vercel login
   ```

2. **Select "Continue with GitHub"** (press Enter or use arrow keys)

3. **Browser will open** - you should already be logged in to Vercel

4. **Authorize the CLI** in the browser

5. **Return to terminal** and run:
   ```bash
   vercel --prod --yes
   ```

## If Login Issues Persist:

**Alternative: Use browser to deploy**
1. Go to https://vercel.com/new
2. Import your GitHub repository: `nicksadler/appmarketplace`
3. Vercel will auto-detect the configuration from `vercel.json`

## Environment Variables to Set After Deployment:

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=packcode-secret-key-2024
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret  
CLIENT_URL=https://your-app.vercel.app
```

## GitHub OAuth Update:
After deployment, update your GitHub OAuth app:
- Callback URL: `https://your-app.vercel.app/auth/github/callback`
- Homepage URL: `https://your-app.vercel.app`

---

**Your build is already optimized and ready!** ✅