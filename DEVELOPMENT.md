# Development Setup Guide

This guide covers setting up the PackCode marketplace for local development and production deployment.

## Prerequisites

- Node.js 18+ 
- MongoDB Atlas account (or local MongoDB)
- GitHub OAuth App
- OpenAI API Key (optional - will use mock responses if not provided)

---

## Environment Variables

### Required Variables

Create a `.env` file in the root directory with these variables:

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/packcode

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secure-jwt-secret-here

# GitHub OAuth (create app at https://github.com/settings/applications/new)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Client URL
CLIENT_URL=http://localhost:3001
```

### Optional Variables (for AI features)

```bash
# OpenAI API Key (get from https://platform.openai.com/account/api-keys)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
```

**Note:** If `OPENAI_API_KEY` is not provided or is invalid, the system will automatically use mock AI responses. This allows full development without requiring an OpenAI subscription.

---

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/sadlernick/vibemarket.git
cd vibemarket

# Install server dependencies
npm install

# Install client dependencies
cd client
npm install --legacy-peer-deps
cd ..
```

### 2. Configure GitHub OAuth

1. Go to [GitHub OAuth Apps](https://github.com/settings/applications/new)
2. Create a new OAuth App with these settings:
   - **Application name:** PackCode Local
   - **Homepage URL:** `http://localhost:3001`
   - **Authorization callback URL:** `http://localhost:3001/auth/github/callback`
3. Copy the Client ID and Client Secret to your `.env` file

### 3. Setup MongoDB Atlas

1. Create a free MongoDB Atlas account at [mongodb.com](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Create database user with read/write permissions
4. Get connection string and add to `.env` file
5. Whitelist your IP address (or use 0.0.0.0/0 for development)

### 4. Start Development Servers

```bash
# Start backend server (port 3000)
npm run dev

# In another terminal, start frontend (port 3001)
cd client
npm start
```

The application will be available at:
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000

---

## API Endpoints Status

All major API endpoints are working correctly:

### ✅ Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login  
- `GET /api/auth/profile` - Get user profile

### ✅ Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### ✅ AI Features (with fallback)
- `POST /api/projects/ai-generate` - Generate project content
- `POST /api/ai/analyze-repository` - Analyze GitHub repository
- `GET /api/tools/idea-generator` - AI project idea generator

### ✅ GitHub Integration
- `GET /api/github/oauth/login` - GitHub OAuth URL
- `GET /api/github/status` - GitHub connection status
- `GET /api/github/repositories` - User's GitHub repositories

### ✅ Other Features
- `GET /api/licenses` - User licenses
- `GET /api/reviews` - User reviews
- `GET /api/dashboard` - User dashboard
- `GET /api/health` - Health check

---

## Testing

Run the comprehensive test suite:

```bash
node test-full-user-flow.js
```

This tests all pages and API endpoints with a real user account.

---

## Production Deployment (Vercel)

The application is configured for Vercel deployment:

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Vercel Environment Variables

Set these in your Vercel project settings:

- `MONGODB_URI`
- `JWT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET` 
- `CLIENT_URL` (your production domain)
- `OPENAI_API_KEY` (optional)

---

## AI Features Behavior

### With Valid OpenAI API Key
- Real AI-powered content generation
- Intelligent repository analysis
- Smart project categorization

### Without OpenAI API Key (or invalid key)
- Falls back to mock responses automatically
- No errors or service disruption
- Provides realistic placeholder content
- Full functionality for development and testing

---

## Common Development Issues

### MongoDB Connection Issues
- Verify your connection string format
- Check IP whitelist in MongoDB Atlas
- Ensure database user has correct permissions

### GitHub OAuth Issues  
- Verify callback URL matches exactly
- Check CLIENT_URL environment variable
- Ensure GitHub app is not suspended

### Port Conflicts
- Backend runs on port 3000
- Frontend runs on port 3001
- Change ports in package.json if needed

### AI Endpoints Returning 500 Errors
- This is now fixed with lazy OpenAI client initialization
- Invalid API keys will automatically use mock responses
- Check logs for specific error details

---

## Need GitHub Credentials for Testing?

If you need to test the full GitHub OAuth flow and repository analysis features, you can:

1. **Use your own GitHub account** - Create a personal OAuth app for testing
2. **Contact the maintainer** - If you need production-level testing access

The application works fully without GitHub OAuth (users can register with email/password), but GitHub integration provides enhanced features like:
- Repository import and analysis
- Automatic project metadata extraction
- GitHub-verified project badges

---

## Support

For issues or questions:
1. Check this development guide
2. Review error logs in console
3. Run the test suite to identify specific failures
4. Create an issue in the GitHub repository

The system is designed to be resilient - most features have fallbacks and will continue working even if external services (OpenAI, GitHub) are unavailable.