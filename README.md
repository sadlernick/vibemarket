# VibeMarket - Code Marketplace

A full-stack marketplace application where developers can share, discover, and monetize their code projects.

## Features

### Core Functionality
- **Project Marketplace**: Browse and discover code projects across multiple categories
- **Dual Repository Support**: Offer both free and paid versions of your projects
- **Transparent Pricing**: 20% marketplace fee with clear breakdown for sellers
- **AI Content Generation**: Automatically generate project descriptions and features
- **GitHub Integration**: Validate repository URLs and check permissions

### Authentication & User Management
- **Multi-Provider Auth**: Email/password, Google OAuth, Apple Sign-In (planned)
- **User Profiles**: Developer portfolios with reputation system
- **Admin Dashboard**: Comprehensive user and project management

### Technology Stack
- **Backend**: Node.js, Express.js, MongoDB with Mongoose
- **Frontend**: React with TypeScript, Tailwind CSS
- **Authentication**: Passport.js with JWT tokens
- **Payment Processing**: Integrated fee calculation system
- **AI Integration**: OpenAI API for content generation

## Project Structure

```
appmarketplace/
├── client/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Main application pages
│   │   └── contexts/      # React contexts (Auth, etc.)
├── server/                # Node.js Express backend
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API endpoints
│   ├── services/         # Business logic services
│   └── middleware/       # Authentication & validation
└── scripts/              # Utility scripts
```

## Quick Start

### Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd appmarketplace
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install client dependencies
   cd client && npm install && cd ..
   ```

3. **Environment Setup**
   ```bash
   # Copy example environment file
   cp .env.example .env
   
   # Edit .env with your configuration:
   # - MongoDB connection string
   # - JWT secret
   # - OAuth credentials (optional)
   # - OpenAI API key (for AI features)
   ```

4. **Start the application**
   ```bash
   # Start backend (runs on port 5001)
   npm run server
   
   # Start frontend (runs on port 3000) - in new terminal
   cd client && npm start
   ```

5. **Create an admin user** (optional)
   ```bash
   node server/scripts/createAdmin.js
   ```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/vibemarket
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vibemarket

# Authentication
JWT_SECRET=your-super-secret-jwt-key
SESSION_SECRET=your-session-secret

# OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AI Features (Optional)
OPENAI_API_KEY=your-openai-api-key

# Client URL
CLIENT_URL=http://localhost:3000
```

## Usage

### For Sellers
1. **Sign up** and complete your profile
2. **Post a project** with title, description, and repository URLs
3. **Choose licensing**: Free, Paid, or Freemium model
4. **Set pricing** with transparent fee breakdown (20% marketplace fee)
5. **Generate content** using AI assistance for descriptions

### For Buyers
1. **Browse projects** by category or search
2. **View project details** including demos and code access
3. **Purchase licenses** for paid projects
4. **Access repositories** based on license type

### For Administrators
1. **Access admin dashboard** at `/admin`
2. **Manage users** and project approvals
3. **Monitor marketplace** activity and metrics

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/google` - Google OAuth
- `POST /api/auth/logout` - User logout

### Projects
- `GET /api/projects` - List projects (with filtering)
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### AI & Services
- `POST /api/ai/generate-description` - Generate project description
- GitHub validation integrated into project creation

## Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team

---

Built with ❤️ by developers, for developers.