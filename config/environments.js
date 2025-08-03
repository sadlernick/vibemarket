// Environment-specific configuration
const environments = {
  development: {
    api: {
      port: process.env.PORT || 3000,
      baseUrl: process.env.API_URL || 'http://localhost:3000/api',
      timeout: 30000,
    },
    client: {
      url: process.env.CLIENT_URL || 'http://localhost:3001',
    },
    security: {
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 8,
      jwtExpiration: '7d',
      sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    },
    logging: {
      level: process.env.LOG_LEVEL || 'debug',
      file: process.env.LOG_FILE || 'logs/development.log',
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
    },
    features: {
      enableApiDocs: process.env.ENABLE_API_DOCS === 'true',
      enableDebugRoutes: process.env.ENABLE_DEBUG_ROUTES === 'true',
      mockServices: {
        github: process.env.MOCK_GITHUB_API === 'true',
        stripe: process.env.MOCK_STRIPE_API === 'true',
        email: process.env.MOCK_EMAIL_SERVICE === 'true',
      }
    }
  },

  test: {
    api: {
      port: process.env.PORT || 3001,
      baseUrl: 'http://localhost:3001/api',
      timeout: parseInt(process.env.TEST_TIMEOUT) || 30000,
    },
    client: {
      url: 'http://localhost:3001',
    },
    security: {
      bcryptRounds: 4, // Faster for tests
      jwtExpiration: '1h',
      sessionTimeout: 60 * 60 * 1000, // 1 hour
    },
    logging: {
      level: 'error', // Minimal logging in tests
      file: 'logs/test.log',
    },
    rateLimit: {
      windowMs: 1000, // 1 second
      max: 1000, // Very high limit for tests
    },
    features: {
      enableApiDocs: false,
      enableDebugRoutes: true,
      mockServices: {
        github: true,
        stripe: true,
        email: true,
        openai: true,
      }
    }
  },

  production: {
    api: {
      port: process.env.PORT || 3000,
      baseUrl: process.env.API_URL || 'https://www.pack-code.com/api',
      timeout: 30000,
    },
    client: {
      url: process.env.CLIENT_URL || 'https://www.pack-code.com',
    },
    security: {
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
      jwtExpiration: '24h',
      sessionTimeout: 60 * 60 * 1000, // 1 hour
    },
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      file: process.env.LOG_FILE || 'logs/production.log',
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    },
    features: {
      enableApiDocs: false, // Disabled for security
      enableDebugRoutes: false, // Disabled for security
      mockServices: {
        github: false,
        stripe: false,
        email: false,
      }
    }
  }
};

const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  const config = environments[env];
  
  if (!config) {
    throw new Error(`Unknown environment: ${env}`);
  }
  
  return config;
};

const isProduction = () => process.env.NODE_ENV === 'production';
const isDevelopment = () => process.env.NODE_ENV === 'development';
const isTest = () => process.env.NODE_ENV === 'test';

module.exports = {
  getEnvironmentConfig,
  isProduction,
  isDevelopment,
  isTest,
  environments
};