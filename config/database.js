const mongoose = require('mongoose');

// Database configuration for different environments
const getDatabaseConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  const configs = {
    development: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/appmarketplace_dev',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }
    },
    test: {
      uri: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/appmarketplace_test',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        bufferCommands: false,
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 3000,
        socketTimeoutMS: 15000,
      }
    },
    production: {
      uri: process.env.MONGODB_URI,
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        bufferCommands: false,
        maxPoolSize: 20,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 30000,
        // Production-specific options
        retryWrites: true,
        w: 'majority',
        readPreference: 'primary',
      }
    }
  };

  return configs[env];
};

// Connection management
let cachedConnection = null;

const connectToDatabase = async () => {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  const config = getDatabaseConfig();
  
  if (!config.uri) {
    throw new Error(`Database URI not configured for environment: ${process.env.NODE_ENV}`);
  }

  try {
    console.log(`Connecting to database (${process.env.NODE_ENV})...`);
    const connection = await mongoose.connect(config.uri, config.options);
    
    cachedConnection = connection;
    
    // Connection event listeners
    mongoose.connection.on('connected', () => {
      console.log(`Database connected successfully (${process.env.NODE_ENV})`);
    });

    mongoose.connection.on('error', (err) => {
      console.error('Database connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Database disconnected');
    });

    return connection;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

// Clean up function for tests
const disconnectFromDatabase = async () => {
  if (cachedConnection) {
    await mongoose.connection.close();
    cachedConnection = null;
  }
};

// Clear database function for tests
const clearDatabase = async () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('clearDatabase can only be used in test environment');
  }
  
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

module.exports = {
  connectToDatabase,
  disconnectFromDatabase,
  clearDatabase,
  getDatabaseConfig
};