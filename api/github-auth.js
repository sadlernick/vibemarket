require('dotenv').config();

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

        if (path.includes('/oauth/login') && req.method === 'GET') {
            const clientId = process.env.GITHUB_CLIENT_ID?.trim();
            if (!clientId) {
                return res.status(500).json({ error: 'GitHub OAuth not configured' });
            }
            
            const redirectUri = `https://www.pack-code.com/auth/github/callback`;
            const scope = 'user:email,public_repo,repo';
            
            const params = new URLSearchParams({
                client_id: clientId,
                redirect_uri: redirectUri,
                scope: scope
            });
            
            const githubAuthUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
            
            // For serverless, return the URL instead of redirecting
            res.json({ authUrl: githubAuthUrl });
        } else {
            res.status(404).json({ error: 'GitHub endpoint not found' });
        }

    } catch (error) {
        console.error('GitHub API error:', error);
        res.status(500).json({ 
            error: 'Server error',
            message: error.message 
        });
    }
};