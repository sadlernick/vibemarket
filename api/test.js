// Simple test endpoint to debug Vercel issues
module.exports = async (req, res) => {
    try {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
            res.status(200).end();
            return;
        }

        // Basic environment check
        const envCheck = {
            NODE_ENV: process.env.NODE_ENV || 'undefined',
            MONGODB_URI: process.env.MONGODB_URI ? 'set' : 'missing',
            JWT_SECRET: process.env.JWT_SECRET ? 'set' : 'missing',
            CLIENT_URL: process.env.CLIENT_URL || 'undefined',
            OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'set' : 'missing',
            GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID ? 'set' : 'missing',
            VERCEL: process.env.VERCEL || 'undefined',
            VERCEL_ENV: process.env.VERCEL_ENV || 'undefined',
            allEnvKeys: Object.keys(process.env).filter(key => 
                key.includes('MONGODB') || 
                key.includes('JWT') || 
                key.includes('CLIENT') ||
                key.includes('GITHUB') ||
                key.includes('NODE_ENV') ||
                key.includes('OPENAI')
            ),
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.url
        };

        res.status(200).json({
            status: 'ok',
            message: 'Test endpoint working',
            environment: envCheck
        });
    } catch (error) {
        res.status(500).json({
            error: 'Test endpoint failed',
            message: error.message,
            stack: error.stack
        });
    }
};