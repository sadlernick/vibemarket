const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('../server/config/passport');
require('dotenv').config();

const authRoutes = require('../server/routes/auth');
const projectRoutes = require('../server/routes/projects');
const licenseRoutes = require('../server/routes/licenses');
const reviewRoutes = require('../server/routes/reviews');
const sandboxRoutes = require('../server/routes/sandbox');
const adminRoutes = require('../server/routes/admin');
const aiRoutes = require('../server/routes/ai');
const paymentRoutes = require('../server/routes/payments');
const dashboardRoutes = require('../server/routes/dashboard');
const toolsRoutes = require('../server/routes/tools');
const githubRoutes = require('../server/routes/github');
const verificationRoutes = require('../server/routes/verification');

const app = express();

// CORS configuration
app.use(cors({
    origin: function(origin, callback) {
        const allowedOrigins = [
            'http://localhost:3001',
            'http://localhost:3000',
            process.env.CLIENT_URL
        ].filter(Boolean);
        
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session configuration
app.use(session({
    secret: process.env.JWT_SECRET || 'fallback-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// MongoDB connection with connection reuse for serverless
let cachedConnection = null;
async function connectToDatabase() {
    if (cachedConnection) {
        return cachedConnection;
    }
    
    try {
        const connection = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        cachedConnection = connection;
        return connection;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/licenses', licenseRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/sandbox', sandboxRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/tools', toolsRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/verification', verificationRoutes);

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Root route
app.get('/api', (req, res) => {
    res.json({ message: 'PackCode API is running!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// For Vercel serverless functions
module.exports = async (req, res) => {
    await connectToDatabase();
    return app(req, res);
};