// Simple test endpoint without any dependencies
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

        console.log('=== SIMPLE TEST ENDPOINT ===');
        console.log('Method:', req.method);
        console.log('URL:', req.url);
        console.log('Headers:', JSON.stringify(req.headers));
        console.log('Body:', JSON.stringify(req.body));
        
        res.status(200).json({
            success: true,
            message: 'Simple test endpoint working',
            method: req.method,
            url: req.url,
            body: req.body,
            hasOrigin: !!req.headers.origin,
            hasReferer: !!req.headers.referer,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Simple test endpoint error:', error);
        res.status(500).json({
            error: 'Simple test endpoint failed',
            details: error.message,
            stack: error.stack
        });
    }
};