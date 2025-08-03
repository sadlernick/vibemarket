# 🚀 Development Setup Guide

This guide will help you set up a complete development environment for PackCode with proper testing, multiple environments, and production-ready configurations.

## 📋 Prerequisites

- **Node.js** 18+ (LTS recommended)
- **MongoDB** 6.0+ (local installation or MongoDB Atlas)
- **Git** for version control
- **A GitHub account** for OAuth testing

## 🏗️ Quick Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd appmarketplace

# Install dependencies
npm install
cd client && npm install --legacy-peer-deps && cd ..
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Generate secure secrets (copy the output to your .env file)
npm run validate:env generate-secrets

# Edit .env file with your values
# At minimum, set: JWT_SECRET, SESSION_SECRET, MONGODB_URI
```

### 3. Database Setup

```bash
# Start MongoDB (if using local installation)
mongod

# Seed the database with sample data
npm run db:seed
```

### 4. Start Development

```bash
# Start both frontend and backend in development mode
npm run dev

# Or start them separately:
npm run server:dev  # Backend on http://localhost:3000
npm run client:dev  # Frontend on http://localhost:3001
```

## 🌍 Environment Configurations

### Development Environment
- **Database**: `appmarketplace_dev`
- **Port**: 3000 (API), 3001 (Client)
- **Features**: Debug logging, API docs, hot reloading
- **External Services**: Can be mocked for faster development

### Test Environment
- **Database**: `appmarketplace_test` (automatically cleaned between tests)
- **Features**: Minimal logging, all external services mocked
- **Isolation**: Each test runs in a clean environment

### Production Environment
- **Database**: MongoDB Atlas (recommended)
- **Features**: Optimized builds, security hardened, monitoring
- **External Services**: Real integrations required

## 🧪 Testing Strategy

### Unit Tests
```bash
# Run unit tests
npm run test:unit

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Integration Tests
```bash
# Run integration tests (tests API endpoints)
npm run test:integration

# Run all backend tests
npm test
```

### Frontend Tests
```bash
# Run React component tests
npm run test:client

# Run with coverage
npm run test:client:coverage
```

### End-to-End Tests
```bash
# Run Playwright E2E tests
npm run test:e2e

# Run all tests (CI mode)
npm run test:ci
```

## 📊 Database Management

### Seeding Data
```bash
# Seed development database with sample data
npm run db:seed

# Reset database (clears all data)
npm run db:reset
```

### Database Connections

- **Development**: Uses local MongoDB or specified MONGODB_URI
- **Test**: Uses separate test database (automatically managed)
- **Production**: Uses MongoDB Atlas or production database

## 🔧 Development Scripts

```bash
# Development
npm run dev                 # Start full development environment
npm run server:dev          # Start backend only (with nodemon)
npm run client:dev          # Start frontend only

# Testing
npm test                    # Run backend tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report
npm run test:integration    # Integration tests only
npm run test:client         # Frontend tests
npm run test:e2e           # End-to-end tests
npm run test:all           # All tests
npm run test:ci            # CI pipeline tests

# Database
npm run db:seed            # Seed sample data
npm run db:reset           # Reset database
npm run db:migrate         # Run migrations

# Build & Deploy
npm run build              # Build for production
npm run build:production   # Production build
npm run deploy:staging     # Deploy to staging
npm run deploy:vercel      # Deploy to production

# Utilities
npm run lint               # Lint frontend code
npm run lint:fix           # Fix linting issues
npm run validate:env       # Validate environment config
npm run health:check       # Check application health
```

## 🔒 Security & Environment Variables

### Required Variables

**Development:**
- `JWT_SECRET` - JWT signing secret (generate with crypto)
- `SESSION_SECRET` - Session signing secret
- `MONGODB_URI` - Database connection string

**Production (additional):**
- `CLIENT_URL` - Frontend URL
- `GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET` - OAuth
- `STRIPE_SECRET_KEY` - Payment processing
- Strong, unique secrets (64+ characters)

### Generating Secure Secrets

```bash
# Generate random secrets
npm run validate:env generate-secrets

# Or manually:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 📁 Project Structure

```
appmarketplace/
├── 📂 api/                 # Vercel serverless functions
├── 📂 client/              # React frontend application
│   ├── 📂 src/            # React source code
│   ├── 📂 tests/          # Frontend tests
│   └── 📂 playwright/     # E2E tests
├── 📂 server/             # Backend application
│   ├── 📂 models/         # Database models
│   ├── 📂 routes/         # API routes
│   ├── 📂 middleware/     # Express middleware
│   └── 📂 tests/          # Backend tests
├── 📂 config/             # Configuration files
├── 📂 scripts/            # Utility scripts
├── 📂 .github/            # CI/CD workflows
├── 🔧 .env.example        # Environment template
├── 🔧 .env.development    # Development config
├── 🔧 .env.test          # Testing config
└── 🔧 .env.production    # Production config
```

## 🚀 Deployment

### Staging Deployment
```bash
npm run deploy:staging
```

### Production Deployment
```bash
# Ensure all tests pass
npm run test:ci

# Deploy to production
npm run deploy:vercel
```

### Environment-Specific Deployments

1. **Development**: Local development server
2. **Staging**: Vercel preview deployment
3. **Production**: Vercel production deployment

## 🔍 Monitoring & Health Checks

### Health Check Endpoint
```bash
# Check application health
curl http://localhost:3000/api/health

# Or use npm script
npm run health:check
```

### Logging

- **Development**: Debug level logging to console
- **Test**: Error level only
- **Production**: Info level to files and external services

## 🤝 Contributing

1. **Create Feature Branch**: `git checkout -b feature/your-feature`
2. **Write Tests**: Ensure good test coverage
3. **Run Tests**: `npm run test:ci`
4. **Lint Code**: `npm run lint:fix`
5. **Commit Changes**: Use conventional commits
6. **Create PR**: All tests must pass

## 🆘 Troubleshooting

### Common Issues

**MongoDB Connection Failed**
```bash
# Check MongoDB is running
mongod

# Verify connection string
npm run validate:env
```

**Port Already in Use**
```bash
# Kill processes using ports 3000/3001
lsof -ti:3000,3001 | xargs kill -9
```

**Test Failures**
```bash
# Reset test database
NODE_ENV=test npm run db:reset

# Check environment variables
npm run validate:env
```

**Build Failures**
```bash
# Clear node modules and reinstall
rm -rf node_modules client/node_modules
npm install
cd client && npm install --legacy-peer-deps
```

### Getting Help

1. Check this documentation
2. Review error logs
3. Validate environment with `npm run validate:env`
4. Check GitHub Issues
5. Run health check: `npm run health:check`

---

## 🎯 Next Steps

1. **Set up your environment** following this guide
2. **Run the test suite** to ensure everything works
3. **Explore the codebase** and sample data
4. **Make your first changes** and run tests
5. **Deploy to staging** when ready

Happy coding! 🚀