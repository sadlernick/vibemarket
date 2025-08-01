const express = require('express');
const cors = require('cors');
const { authenticateToken } = require('../server/middleware/auth');
const User = require('../server/models/User');
const mongoose = require('mongoose');

const app = express();

// CORS configuration
app.use(cors({
    origin: function(origin, callback) {
        const allowedOrigins = [
            'http://localhost:3001',
            'http://localhost:3000',
            process.env.CLIENT_URL,
            'https://www.pack-code.com'
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

// Database connection
let cachedConnection = null;

async function connectToDatabase() {
    if (cachedConnection) {
        return cachedConnection;
    }

    const connection = await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    });

    cachedConnection = connection;
    return connection;
}

app.use(async (req, res, next) => {
    try {
        if (!cachedConnection) {
            await connectToDatabase();
        }
        next();
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({ error: 'Database connection failed' });
    }
});

// Simple test endpoint
app.post('/test', authenticateToken, async (req, res) => {
    try {
        console.log('=== TEST ENDPOINT CALLED ===');
        console.log('Headers:', JSON.stringify(req.headers));
        console.log('Body:', JSON.stringify(req.body));
        console.log('User:', req.user?._id);
        
        const user = await User.findById(req.user._id);
        
        res.json({
            success: true,
            message: 'Test endpoint working',
            hasUser: !!user,
            hasOrigin: !!req.headers.origin,
            hasReferer: !!req.headers.referer,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Test endpoint error:', error);
        res.status(500).json({
            error: 'Test endpoint failed',
            details: error.message,
            stack: error.stack
        });
    }
});

// Export the app
module.exports = app;