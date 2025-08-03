// Vercel serverless function for AI analyze-repository
const mongoose = require('mongoose');
const { authenticateToken } = require('../server/middleware/auth');
const User = require('../server/models/User');

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
        socketTimeoutMS: 30000,
    });

    cachedConnection = connection;
    return connection;
}

module.exports = async (req, res) => {
    try {
        // Set CORS headers
        const allowedOrigins = [
            'http://localhost:3001',
            'http://localhost:3000',
            process.env.CLIENT_URL?.trim(),
            'https://www.pack-code.com'
        ].filter(Boolean);
        
        const origin = req.headers.origin;
        if (!origin || allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin || '*');
        }
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Credentials', 'true');

        if (req.method === 'OPTIONS') {
            res.status(200).end();
            return;
        }

        // Connect to database
        await connectToDatabase();

        // Route based on URL path
        const url = req.url;
        
        if (url === '/analyze-repository' || url.endsWith('/analyze-repository')) {
            return await handleAnalyzeRepository(req, res);
        } else if (url === '/analyze-repo' || url.endsWith('/analyze-repo')) {
            return await handleAlternativeAnalyze(req, res);
        } else if (url === '/no-auth' || url.endsWith('/no-auth')) {
            return await handleNoAuth(req, res);
        }
        
        res.status(404).json({ error: 'Endpoint not found' });
        
    } catch (error) {
        console.error('Serverless function error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Something went wrong'
        });
    }
};

// Handle analyze-repository endpoint with authentication
async function handleAnalyzeRepository(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Authenticate user
    const authResult = await authenticateUser(req);
    if (!authResult.success) {
        return res.status(401).json({ error: authResult.error });
    }

    const user = authResult.user;

    try {
        console.log('=== ANALYZE REPOSITORY ENDPOINT ===');
        console.log('Request body:', JSON.stringify(req.body));
        console.log('User ID:', user._id);
        
        const { fullName } = req.body;
        
        if (!fullName) {
            return res.status(400).json({ error: 'fullName is required' });
        }
        
        const [owner, repo] = fullName.split('/');
        
        // Mock analysis for now to avoid external API issues
        const mockAnalysis = {
            title: repo.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            description: `**${repo}** is a well-crafted project providing essential functionality for developers.`,
            category: 'web',
            tags: ['javascript', 'typescript', 'react'],
            features: {
                freeFeatures: ['View source code', 'Basic documentation'],
                paidFeatures: ['Commercial license', 'Extended examples']
            },
            techStack: 'JavaScript, TypeScript, React',
            suggestedPrice: 75
        };
        
        res.json({
            success: true,
            repository: {
                fullName,
                name: repo,
                description: `Mock repository for ${fullName}`
            },
            analysis: mockAnalysis
        });
        
    } catch (error) {
        console.error('=== ANALYZE REPOSITORY ERROR ===');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        res.status(500).json({
            error: 'Failed to analyze repository',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

// Handle alternative analyze endpoint with authentication
async function handleAlternativeAnalyze(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Authenticate user
    const authResult = await authenticateUser(req);
    if (!authResult.success) {
        return res.status(401).json({ error: authResult.error });
    }

    const user = authResult.user;

    try {
        console.log('=== ALTERNATIVE ANALYZE ENDPOINT ===');
        console.log('Request body:', JSON.stringify(req.body));
        console.log('User ID:', user._id);
        
        const { fullName } = req.body;
        const [owner, repo] = fullName.split('/');
        
        res.json({
            success: true,
            message: 'Alternative AI endpoint working',
            fullName,
            owner,
            repo,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Alternative AI endpoint error:', error);
        res.status(500).json({
            error: 'Alternative AI endpoint failed',
            details: error.message
        });
    }
}

// Handle no-auth endpoint without authentication
async function handleNoAuth(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('=== NO AUTH ENDPOINT ===');
        console.log('Request body:', JSON.stringify(req.body));
        
        res.json({
            success: true,
            message: 'No auth endpoint working',
            body: req.body,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('No auth endpoint error:', error);
        res.status(500).json({
            error: 'No auth endpoint failed',
            details: error.message
        });
    }
}

// Helper function to authenticate user
async function authenticateUser(req) {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return { success: false, error: 'No token provided' };
        }

        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (!user) {
            return { success: false, error: 'User not found' };
        }
        
        return { success: true, user };
    } catch (error) {
        return { success: false, error: 'Invalid token' };
    }
}