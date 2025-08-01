const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('./config/passport');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const licenseRoutes = require('./routes/licenses');
const reviewRoutes = require('./routes/reviews');
const sandboxRoutes = require('./routes/sandbox');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');
const paymentRoutes = require('./routes/payments');
const dashboardRoutes = require('./routes/dashboard');
const toolsRoutes = require('./routes/tools');
const githubRoutes = require('./routes/github');
const verificationRoutes = require('./routes/verification');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3001',
  credentials: true
}));
app.use(express.json());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// MongoDB connection with better error handling for serverless
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }
  
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vibemarket', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// Connect to database
connectDB();

// OAuth routes
const isGoogleConfigured = process.env.GOOGLE_CLIENT_ID && 
                           process.env.GOOGLE_CLIENT_SECRET &&
                           process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id_here' &&
                           process.env.GOOGLE_CLIENT_SECRET !== 'your_google_client_secret_here';

if (isGoogleConfigured) {
  app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

  app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:3001'}/login?error=oauth` }),
    (req, res) => {
      // Successful authentication, redirect to client with user data
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3001'}/auth/success?user=${encodeURIComponent(JSON.stringify(req.user))}`);
    }
  );
} else {
  app.get('/auth/google', (req, res) => {
    res.status(501).json({ 
      error: 'Google OAuth not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.',
      configured: false 
    });
  });
  
  app.get('/auth/google/callback', (req, res) => {
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3001'}/login?error=oauth`);
  });
}

// Apple OAuth routes (placeholder for when Apple Developer account is available)
app.get('/auth/apple', (req, res) => {
  res.status(501).json({ error: 'Apple Sign-In not yet configured' });
});

app.use('/api/auth', authRoutes);
app.use('/api', authRoutes); // For /users/:id route
app.use('/api/projects', projectRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/licenses', licenseRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/sandbox', sandboxRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tools', toolsRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/verification', verificationRoutes);

app.get('/api/health', (req, res) => {
  res.json({ message: 'PackCode API is running!' });
});

// For Vercel serverless functions, we export the app
// For local development, we listen on the port
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app;