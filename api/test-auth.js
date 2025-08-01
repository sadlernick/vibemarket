const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Import models
const User = require('../server/models/User');

// MongoDB connection
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

// For Vercel serverless functions
module.exports = async (req, res) => {
    try {
        // Enable CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        if (req.method === 'OPTIONS') {
            res.status(200).end();
            return;
        }

        // Connect to database
        if (!cachedConnection) {
            await connectToDatabase();
        }

        const { method } = req;
        const url = new URL(req.url, `http://${req.headers.host}`);
        const path = url.pathname;

        console.log('Auth request:', method, path, 'Original URL:', req.url);

        if ((path.includes('/register') || path.endsWith('/register')) && method === 'POST') {
            const { username, email, password } = req.body;

            if (!username || !email || !password) {
                return res.status(400).json({ error: 'All fields are required' });
            }

            // Check if user exists
            const existingUser = await User.findOne({
                $or: [{ email: email.toLowerCase() }, { username }]
            });

            if (existingUser) {
                return res.status(400).json({ 
                    error: existingUser.email === email.toLowerCase() ? 'Email already registered' : 'Username already taken'
                });
            }

            // Create user using the same method as local
            const user = new User({
                username,
                email: email.toLowerCase(),
                password, // Let the pre-save hook handle hashing
                role: 'user',
                isActive: true,
                reputation: 0,
                joinedAt: new Date()
            });

            await user.save();

            // Generate token
            const token = jwt.sign(
                { userId: user._id },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.status(201).json({
                message: 'User registered successfully',
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    reputation: user.reputation
                }
            });

        } else if ((path.includes('/login') || path.endsWith('/login')) && method === 'POST') {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required' });
            }

            // Find user the same way as local server
            const user = await User.findOne({ email: email.toLowerCase() });

            if (!user || !(await user.comparePassword(password))) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Generate token
            const token = jwt.sign(
                { userId: user._id },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    reputation: user.reputation,
                    profileImage: user.profileImage
                }
            });

        } else if ((path.includes('/profile') || path.endsWith('/profile')) && method === 'GET') {
            // Handle profile endpoint - requires authentication
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'Access denied. No token provided.' });
            }

            const token = authHeader.substring(7);
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.userId).select('-password');
                
                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }

                res.json({
                    user: {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                        profileImage: user.profileImage,
                        bio: user.bio,
                        skills: user.skills,
                        githubProfile: user.githubProfile,
                        website: user.website,
                        reputation: user.reputation,
                        isVerified: user.isVerified,
                        role: user.role
                    }
                });
            } catch (tokenError) {
                return res.status(401).json({ error: 'Invalid token' });
            }

        } else {
            res.status(404).json({ error: 'Auth endpoint not found' });
        }

    } catch (error) {
        console.error('Auth error:', error);
        res.status(500).json({ 
            error: 'Server error',
            message: error.message 
        });
    }
};