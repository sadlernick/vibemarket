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

// Routes - Note: Vercel routes to /api/* so we don't need /api prefix here
app.use('/auth', authRoutes);
app.use('/', authRoutes); // For /users/:id route
app.use('/projects', projectRoutes);
app.use('/licenses', licenseRoutes);
app.use('/reviews', reviewRoutes);
app.use('/sandbox', sandboxRoutes);
app.use('/admin', adminRoutes);
app.use('/ai', aiRoutes);
app.use('/payments', paymentRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/tools', toolsRoutes);
app.use('/github', githubRoutes);
app.use('/verification', verificationRoutes);

app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Root route
app.get('/', (req, res) => {
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
    try {
        await connectToDatabase();
        return app(req, res);
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({ 
            error: 'Database connection failed',
            message: error.message 
        });
    }
};