const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

// Setup test database
beforeAll(async () => {
  if (process.env.NODE_ENV !== 'test') {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    process.env.MONGODB_URI = uri;
  }
});

// Clean database before each test
beforeEach(async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
});

afterAll(async () => {
  if (mongod) {
    await mongod.stop();
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});

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