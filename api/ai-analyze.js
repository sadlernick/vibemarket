// Dedicated serverless function for AI analyze-repository
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { authenticateToken } = require('../server/middleware/auth');
const User = require('../server/models/User');

const app = express();

// CORS configuration
app.use(cors({
    origin: function(origin, callback) {
        const allowedOrigins = [
            'http://localhost:3001',
            'http://localhost:3000',
            process.env.CLIENT_URL?.trim(),
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
        socketTimeoutMS: 30000,
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

// Simplified AI analyze-repository endpoint
app.post('/analyze-repository', authenticateToken, async (req, res) => {
    try {
        console.log('=== DEDICATED AI ANALYZE ENDPOINT ===');
        console.log('Request body:', JSON.stringify(req.body));
        console.log('User ID:', req.user?._id);
        
        const { fullName } = req.body;
        
        if (!fullName) {
            return res.status(400).json({ error: 'fullName is required' });
        }
        
        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const [owner, repo] = fullName.split('/');
        
        // Mock analysis for now to avoid external API issues
        const mockAnalysis = {
            title: repo.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            description: `**${repo}** is a well-crafted project providing essential functionality for developers. This project demonstrates professional-grade architecture and user experience design.\n\n🚀 **Key Features:**\n- Modern development stack and best practices\n- Scalable architecture for future growth\n- Cross-platform compatibility\n\n✨ **Developer Experience:**\n- Comprehensive documentation with examples\n- Easy integration and setup\n- Regular updates and maintenance\n- Active community support\n\nPerfect for developers seeking reliable solutions or teams looking to accelerate development.`,
            category: 'web',
            tags: ['javascript', 'typescript', 'react', 'opensource', 'development'],
            features: {
                freeFeatures: ['View source code', 'Basic documentation', 'Personal use license'],
                paidFeatures: ['Commercial license', 'Extended examples', 'Priority support']
            },
            techStack: 'JavaScript, TypeScript, React',
            suggestedPrice: 75
        };
        
        res.json({
            success: true,
            repository: {
                id: 12345,
                fullName,
                name: repo,
                description: `Mock repository for ${fullName}`,
                language: 'JavaScript',
                stars: 1000,
                forks: 100,
                topics: ['javascript', 'react'],
                license: 'MIT License',
                defaultBranch: 'main',
                updatedAt: new Date().toISOString(),
                createdAt: '2020-01-01T00:00:00Z',
                htmlUrl: `https://github.com/${fullName}`
            },
            analysis: mockAnalysis
        });
        
    } catch (error) {
        console.error('=== DEDICATED AI ANALYZE ERROR ===');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Request headers:', JSON.stringify(req.headers));
        
        res.status(500).json({
            error: 'Failed to analyze repository',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Export the app
module.exports = app;