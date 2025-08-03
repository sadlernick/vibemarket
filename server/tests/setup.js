const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { connectToDatabase, disconnectFromDatabase, clearDatabase } = require('../../config/database');

// Properly set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.SESSION_SECRET = 'test-session-secret';

let mongoServer;
let useInMemoryDb = process.env.USE_IN_MEMORY_DB !== 'false'; // Default to true

// Setup test database
beforeAll(async () => {
  try {
    if (useInMemoryDb) {
      // Use in-memory database for fast, isolated testing
      mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      process.env.MONGODB_TEST_URI = mongoUri;
      process.env.MONGODB_URI = mongoUri; // Fallback
    }
    
    // Connect using our database config
    await connectToDatabase();
    
    console.log(`Test database connected: ${useInMemoryDb ? 'In-Memory' : 'MongoDB Test DB'}`);
  } catch (error) {
    console.error('Test database setup failed:', error);
    throw error;
  }
});

// Clean database before each test for complete isolation
beforeEach(async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      await clearDatabase();
    }
  } catch (error) {
    console.warn('Database cleanup failed:', error);
  }
});

// Cleanup after all tests
afterAll(async () => {
  try {
    await disconnectFromDatabase();
    
    if (mongoServer) {
      await mongoServer.stop();
    }
    
    console.log('Test database cleanup completed');
  } catch (error) {
    console.error('Test cleanup failed:', error);
  }
});

// Reset mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global test utilities
global.testUtils = {
  // Create test user
  createTestUser: async (userData = {}) => {
    const User = require('../models/User');
    const bcrypt = require('bcryptjs');
    
    const defaultUser = {
      username: `testuser_${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      password: await bcrypt.hash('testpassword123', 4),
      ...userData
    };
    
    return await User.create(defaultUser);
  },
  
  // Create test project
  createTestProject: async (userId, projectData = {}) => {
    const Project = require('../models/Project');
    
    const defaultProject = {
      title: `Test Project ${Date.now()}`,
      description: 'A comprehensive test project',
      author: userId,
      category: 'web',
      tags: ['test', 'javascript'],
      repository: {
        freeUrl: 'https://github.com/test/repo-free'
      },
      license: {
        type: 'freemium',
        price: 25,
        currency: 'USD'
      },
      ...projectData
    };
    
    return await Project.create(defaultProject);
  },
  
  // Generate JWT token for testing
  generateTestToken: (userId) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { userId: userId.toString() },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  },
  
  // Create authenticated test request
  createAuthenticatedRequest: async (userData = {}) => {
    const user = await global.testUtils.createTestUser(userData);
    const token = global.testUtils.generateTestToken(user._id);
    
    return {
      user,
      token,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  },
  
  // Wait for async operations
  wait: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Mock external services
  mockGitHubAPI: () => {
    jest.doMock('axios', () => ({
      get: jest.fn().mockResolvedValue({
        data: {
          id: 123456789,
          full_name: 'testuser/test-repo',
          name: 'test-repo',
          description: 'A test repository',
          language: 'JavaScript',
          stargazers_count: 42,
          forks_count: 7,
          topics: ['javascript', 'test'],
          license: { name: 'MIT' },
          html_url: 'https://github.com/testuser/test-repo'
        }
      }),
      post: jest.fn().mockResolvedValue({ data: { success: true } })
    }));
  }
};

// Increase test timeout for integration tests
jest.setTimeout(30000);

// Suppress console output during tests (except errors)
if (process.env.NODE_ENV === 'test') {
  const originalConsole = console;
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  // Keep error logging for debugging
  console.error = originalConsole.error;
}

// Mock OpenAI for tests
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                title: 'Enhanced Test Project',
                description: 'A comprehensive test project with advanced features',
                tags: ['react', 'javascript', 'test'],
                category: 'web',
                tech_stack: ['React', 'TypeScript', 'Node.js'],
                freeRepositoryUrl: 'https://github.com/test/project-free',
                paidRepositoryUrl: 'https://github.com/test/project-pro',
                features: {
                  freeFeatures: ['Basic features', 'Community support'],
                  paidFeatures: ['Advanced features', 'Priority support', 'Commercial license']
                }
              })
            }
          }]
        })
      }
    }
  }));
});

// Silence console output during tests
if (process.env.NODE_ENV === 'test') {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
}