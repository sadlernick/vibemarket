// Simple health endpoint for Vercel
const mongoose = require('mongoose');

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

        const health = {
            status: 'ok', 
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            database: 'testing...'
        };

        // Test database connection
        try {
            const mongoUri = process.env.MONGODB_URI;
            if (mongoUri && mongoUri !== 'undefined') {
                // Try to connect to MongoDB
                await mongoose.connect(mongoUri, {
                    useNewUrlParser: true,
                    useUnifiedTopology: true,
                    serverSelectionTimeoutMS: 5000,
                });
                
                // Test the connection
                await mongoose.connection.db.admin().ping();
                health.database = 'connected';
                
                // Close the connection to avoid hanging
                await mongoose.connection.close();
            } else {
                health.database = 'no connection string';
            }
        } catch (error) {
            health.database = 'error: ' + error.message;
        }

        res.status(200).json(health);
    } catch (error) {
        res.status(500).json({
            error: 'Health check failed',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};