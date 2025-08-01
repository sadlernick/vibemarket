const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
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

        const url = new URL(req.url, `http://${req.headers.host}`);
        const path = url.pathname;

        console.log('GitHub callback - URL:', req.url, 'Path:', path, 'Method:', req.method);
        
        if (path.includes('/oauth/callback') && req.method === 'POST') {
            // Parse JSON body for serverless functions
            let body = {};
            if (req.body) {
                body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            }
            const { code, state } = body;
            
            if (!code) {
                return res.status(400).json({ error: 'Authorization code is required' });
            }

            // Exchange code for access token
            try {
                const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
                    client_id: process.env.GITHUB_CLIENT_ID?.trim(),
                    client_secret: process.env.GITHUB_CLIENT_SECRET?.trim(),
                    code: code,
                    redirect_uri: `https://www.pack-code.com/auth/github/callback`
                }, {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });

                const { access_token } = tokenResponse.data;
                
                if (!access_token) {
                    return res.status(400).json({ error: 'Failed to get access token' });
                }

                // Get user info from GitHub
                const userResponse = await axios.get('https://api.github.com/user', {
                    headers: {
                        'Authorization': `token ${access_token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });

                const githubUser = userResponse.data;

                // Get user emails
                const emailResponse = await axios.get('https://api.github.com/user/emails', {
                    headers: {
                        'Authorization': `token ${access_token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });

            const emails = emailResponse.data;
            const primaryEmail = emails.find(e => e.primary && e.verified);
            const email = primaryEmail ? primaryEmail.email : githubUser.email;

            if (!email) {
                return res.status(400).json({ error: 'No verified email found' });
            }

            // Connect to database
            if (!cachedConnection) {
                await connectToDatabase();
            }

            // Find or create user
            let user = await User.findOne({ 
                $or: [
                    { email: email.toLowerCase() },
                    { 'githubProfile.id': githubUser.id }
                ]
            });

            if (user) {
                // Update GitHub info
                user.githubProfile = {
                    id: githubUser.id,
                    username: githubUser.login,
                    accessToken: access_token,
                    avatarUrl: githubUser.avatar_url,
                    profileUrl: githubUser.html_url
                };
                if (!user.profileImage) {
                    user.profileImage = githubUser.avatar_url;
                }
                await user.save();
            } else {
                // Create new user
                user = new User({
                    username: githubUser.login,
                    email: email.toLowerCase(),
                    profileImage: githubUser.avatar_url,
                    role: 'user',
                    isActive: true,
                    reputation: 0,
                    joinedAt: new Date(),
                    githubProfile: {
                        id: githubUser.id,
                        username: githubUser.login,
                        accessToken: access_token,
                        avatarUrl: githubUser.avatar_url,
                        profileUrl: githubUser.html_url
                    }
                });
                await user.save();
            }

            // Generate JWT token
            const token = jwt.sign(
                { userId: user._id },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                message: 'GitHub authentication successful',
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    reputation: user.reputation,
                    profileImage: user.profileImage,
                    githubProfile: {
                        username: user.githubProfile.username,
                        profileUrl: user.githubProfile.profileUrl
                    }
                }
            });
            
            } catch (githubError) {
                console.error('GitHub API error:', githubError.response?.data || githubError.message);
                return res.status(400).json({ 
                    error: 'GitHub authentication failed',
                    message: githubError.response?.data?.error_description || githubError.message 
                });
            }
        } else {
            res.status(404).json({ error: 'GitHub callback endpoint not found' });
        }

    } catch (error) {
        console.error('GitHub callback error:', error);
        res.status(500).json({ 
            error: 'Server error',
            message: error.message 
        });
    }
};