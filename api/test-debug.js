module.exports = async (req, res) => {
    try {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        if (req.method === 'OPTIONS') {
            res.status(200).end();
            return;
        }

        const { method } = req;
        const url = new URL(req.url, `http://${req.headers.host}`);
        const path = url.pathname;
        
        res.json({
            method,
            originalUrl: req.url,
            pathname: path,
            headers: req.headers,
            query: url.search
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};