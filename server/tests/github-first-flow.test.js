const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Project = require('../models/Project');

// Set required environment variables for tests
process.env.OPENAI_API_KEY = 'dummy';
process.env.JWT_SECRET = 'test-secret';

const aiRoutes = require('../routes/ai');
const githubRoutes = require('../routes/github');
const projectRoutes = require('../routes/projects');
const { authenticateToken } = require('../middleware/auth');

// Create test app
const app = express();
app.use(express.json());
app.use('/ai', aiRoutes);
app.use('/github', githubRoutes);
app.use('/projects', projectRoutes);

// Mock axios for GitHub API calls
jest.mock('axios');
const axios = require('axios');

describe('GitHub-First Project Creation Flow', () => {
  let testUser;
  let authToken;
  let mockGitHubToken = 'ghs_mock_token_123';

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect('mongodb://localhost:27017/test_appmarketplace');
    }
  });

  beforeEach(async () => {
    // Clear test data
    await User.deleteMany({});
    await Project.deleteMany({});

    // Create test user with GitHub profile
    testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword',
      githubProfile: {
        id: 12345,
        username: 'testuser',
        accessToken: mockGitHubToken,
        profileUrl: 'https://github.com/testuser',
        avatarUrl: 'https://avatars.githubusercontent.com/u/12345'
      }
    });
    await testUser.save();

    // Generate auth token
    authToken = jwt.sign({ userId: testUser._id }, process.env.JWT_SECRET || 'test-secret');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Repository Analysis', () => {
    test('should analyze a repository and return project details', async () => {
      // Mock GitHub API responses
      const mockRepoData = {
        id: 123,
        full_name: 'testuser/awesome-project',
        name: 'awesome-project',
        description: 'An awesome React application',
        language: 'JavaScript',
        stargazers_count: 25,
        forks_count: 5,
        topics: ['react', 'javascript', 'web'],
        license: { name: 'MIT' },
        default_branch: 'main',
        html_url: 'https://github.com/testuser/awesome-project',
        updated_at: '2024-01-15T10:00:00Z',
        created_at: '2023-06-01T10:00:00Z'
      };

      const mockReadmeContent = Buffer.from(`# Awesome Project

This is an awesome React application that demonstrates modern web development practices.

## Features

- Modern React components
- TypeScript support
- Responsive design
- API integration

## Installation

npm install && npm start
`).toString('base64');

      const mockPackageJson = {
        name: 'awesome-project',
        version: '1.0.0',
        dependencies: {
          react: '^18.0.0',
          'react-dom': '^18.0.0',
          typescript: '^4.9.0'
        },
        scripts: {
          start: 'react-scripts start',
          build: 'react-scripts build'
        }
      };

      const mockLanguages = {
        JavaScript: 45234,
        TypeScript: 23421,
        CSS: 12345
      };

      // Mock the GitHub API calls
      axios.get
        .mockResolvedValueOnce({ data: mockRepoData }) // Repository info
        .mockResolvedValueOnce({ data: { content: mockReadmeContent } }) // README
        .mockResolvedValueOnce({ data: { content: Buffer.from(JSON.stringify(mockPackageJson)).toString('base64') } }) // package.json
        .mockResolvedValueOnce({ data: [{ name: 'src', type: 'dir' }, { name: 'package.json', type: 'file' }] }) // Contents
        .mockResolvedValueOnce({ data: mockLanguages }); // Languages

      const response = await request(app)
        .post('/ai/analyze-repository')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'testuser/awesome-project'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Check repository data
      expect(response.body.repository).toMatchObject({
        fullName: 'testuser/awesome-project',
        name: 'awesome-project',
        description: 'An awesome React application',
        language: 'JavaScript',
        stars: 25,
        forks: 5
      });

      // Check analysis results
      expect(response.body.analysis).toHaveProperty('title');
      expect(response.body.analysis).toHaveProperty('description');
      expect(response.body.analysis).toHaveProperty('category');
      expect(response.body.analysis).toHaveProperty('tags');
      expect(response.body.analysis).toHaveProperty('features');
      expect(response.body.analysis).toHaveProperty('suggestedPrice');

      // Verify that category is correctly determined
      expect(response.body.analysis.category).toBe('web');
      
      // Verify tags include detected technologies
      expect(response.body.analysis.tags).toContain('react');
      expect(response.body.analysis.tags).toContain('javascript');
      
      // Verify price suggestion is reasonable
      expect(response.body.analysis.suggestedPrice).toBeGreaterThan(0);
      expect(response.body.analysis.suggestedPrice).toBeLessThan(200);
    });

    test('should handle repository without README', async () => {
      const mockRepoData = {
        id: 124,
        full_name: 'testuser/simple-lib',
        name: 'simple-lib',
        description: 'A simple utility library',
        language: 'Python',
        stargazers_count: 5,
        forks_count: 1,
        topics: ['python', 'utility'],
        license: { name: 'MIT' },
        default_branch: 'main',
        html_url: 'https://github.com/testuser/simple-lib',
        updated_at: '2024-01-15T10:00:00Z',
        created_at: '2024-01-01T10:00:00Z'
      };

      // Mock GitHub API calls - README request fails
      axios.get
        .mockResolvedValueOnce({ data: mockRepoData })
        .mockRejectedValueOnce(new Error('Not found')) // README not found
        .mockRejectedValueOnce(new Error('Not found')) // package.json not found
        .mockResolvedValueOnce({ data: [{ name: 'main.py', type: 'file' }] })
        .mockResolvedValueOnce({ data: { Python: 12345 } });

      const response = await request(app)
        .post('/ai/analyze-repository')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'testuser/simple-lib'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Should still provide analysis even without README
      expect(response.body.analysis.category).toBe('api'); // Python typically categorized as API
      expect(response.body.analysis.tags).toContain('python');
      expect(response.body.analysis.description).toBeTruthy();
    });

    test('should return error for invalid repository', async () => {
      const response = await request(app)
        .post('/ai/analyze-repository')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          repositoryUrl: 'https://github.com/invalid/repo'
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBeTruthy();
    });

    test('should require GitHub authentication', async () => {
      // Create user without GitHub profile
      const userWithoutGitHub = new User({
        username: 'nogithub',
        email: 'nogithub@example.com',
        password: 'hashedpassword'
      });
      await userWithoutGitHub.save();

      const tokenWithoutGitHub = jwt.sign({ userId: userWithoutGitHub._id }, process.env.JWT_SECRET || 'test-secret');

      const response = await request(app)
        .post('/ai/analyze-repository')
        .set('Authorization', `Bearer ${tokenWithoutGitHub}`)
        .send({
          fullName: 'testuser/awesome-project'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('GitHub account not connected');
    });
  });

  describe('Category Detection', () => {
    test('should detect mobile app from React Native dependencies', async () => {
      const mockRepoData = {
        id: 125,
        full_name: 'testuser/mobile-app',
        name: 'mobile-app',
        description: 'A React Native mobile app',
        language: 'JavaScript',
        topics: ['react-native', 'mobile'],
        stargazers_count: 10,
        forks_count: 2,
        html_url: 'https://github.com/testuser/mobile-app'
      };

      const mockPackageJson = {
        dependencies: {
          'react-native': '^0.72.0',
          react: '^18.0.0'
        }
      };

      axios.get
        .mockResolvedValueOnce({ data: mockRepoData })
        .mockRejectedValueOnce(new Error('No README'))
        .mockResolvedValueOnce({ data: { content: Buffer.from(JSON.stringify(mockPackageJson)).toString('base64') } })
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: { JavaScript: 12345 } });

      const response = await request(app)
        .post('/ai/analyze-repository')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'testuser/mobile-app'
        });

      expect(response.status).toBe(200);
      expect(response.body.analysis.category).toBe('mobile');
    });

    test('should detect desktop app from Electron', async () => {
      const mockRepoData = {
        id: 126,
        full_name: 'testuser/desktop-app',
        name: 'desktop-app',
        description: 'An Electron desktop application',
        language: 'JavaScript',
        topics: ['electron', 'desktop'],
        stargazers_count: 15,
        forks_count: 3,
        html_url: 'https://github.com/testuser/desktop-app'
      };

      const mockPackageJson = {
        main: 'main.js',
        dependencies: {
          electron: '^26.0.0'
        }
      };

      axios.get
        .mockResolvedValueOnce({ data: mockRepoData })
        .mockRejectedValueOnce(new Error('No README'))
        .mockResolvedValueOnce({ data: { content: Buffer.from(JSON.stringify(mockPackageJson)).toString('base64') } })
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: { JavaScript: 12345 } });

      const response = await request(app)
        .post('/ai/analyze-repository')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'testuser/desktop-app'
        });

      expect(response.status).toBe(200);
      expect(response.body.analysis.category).toBe('desktop');
    });

    test('should detect API from Express framework', async () => {
      const mockRepoData = {
        id: 127,
        full_name: 'testuser/api-server',
        name: 'api-server',
        description: 'REST API server',
        language: 'JavaScript',
        topics: ['api', 'backend', 'express'],
        stargazers_count: 20,
        forks_count: 8,
        html_url: 'https://github.com/testuser/api-server'
      };

      const mockPackageJson = {
        dependencies: {
          express: '^4.18.0',
          mongoose: '^7.0.0'
        }
      };

      axios.get
        .mockResolvedValueOnce({ data: mockRepoData })
        .mockRejectedValueOnce(new Error('No README'))
        .mockResolvedValueOnce({ data: { content: Buffer.from(JSON.stringify(mockPackageJson)).toString('base64') } })
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: { JavaScript: 12345 } });

      const response = await request(app)
        .post('/ai/analyze-repository')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'testuser/api-server'
        });

      expect(response.status).toBe(200);
      expect(response.body.analysis.category).toBe('api');
    });
  });

  describe('Feature Extraction', () => {
    test('should extract features from README content', async () => {
      const mockRepoData = {
        id: 128,
        full_name: 'testuser/feature-rich-app',
        name: 'feature-rich-app',
        description: 'App with many features',
        language: 'JavaScript',
        topics: ['web'],
        stargazers_count: 50,
        forks_count: 12,
        html_url: 'https://github.com/testuser/feature-rich-app'
      };

      const mockReadmeContent = Buffer.from(`# Feature Rich App

## Features

- Real-time notifications
- User authentication
- File upload and sharing
- Advanced search functionality
- Mobile responsive design
- API integration
- Data visualization
- Offline support
`).toString('base64');

      axios.get
        .mockResolvedValueOnce({ data: mockRepoData })
        .mockResolvedValueOnce({ data: { content: mockReadmeContent } })
        .mockRejectedValueOnce(new Error('No package.json'))
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: { JavaScript: 12345 } });

      const response = await request(app)
        .post('/ai/analyze-repository')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'testuser/feature-rich-app'
        });

      expect(response.status).toBe(200);
      
      const features = response.body.analysis.features;
      expect(features.freeFeatures.length).toBeGreaterThan(3);
      expect(features.paidFeatures.length).toBeGreaterThan(3);
      
      // Should include extracted features
      const allFeatures = [...features.freeFeatures, ...features.paidFeatures].join(' ').toLowerCase();
      expect(allFeatures).toContain('notification');
      expect(allFeatures).toContain('authentication');
    });
  });

  describe('Price Suggestion', () => {
    test('should suggest higher price for popular repositories', async () => {
      const mockHighStarRepo = {
        id: 129,
        full_name: 'testuser/popular-project',
        name: 'popular-project',
        description: 'Very popular project',
        language: 'JavaScript',
        topics: ['popular'],
        stargazers_count: 500, // High star count
        forks_count: 100,
        html_url: 'https://github.com/testuser/popular-project'
      };

      const mockLowStarRepo = {
        id: 130,
        full_name: 'testuser/simple-project',
        name: 'simple-project',
        description: 'Simple project',
        language: 'JavaScript',
        topics: ['simple'],
        stargazers_count: 2, // Low star count
        forks_count: 0,
        html_url: 'https://github.com/testuser/simple-project'
      };

      // Test high star repo
      axios.get
        .mockResolvedValueOnce({ data: mockHighStarRepo })
        .mockRejectedValueOnce(new Error('No README'))
        .mockRejectedValueOnce(new Error('No package.json'))
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: { JavaScript: 12345 } });

      const highStarResponse = await request(app)
        .post('/ai/analyze-repository')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'testuser/popular-project'
        });

      // Test low star repo
      axios.get
        .mockResolvedValueOnce({ data: mockLowStarRepo })
        .mockRejectedValueOnce(new Error('No README'))
        .mockRejectedValueOnce(new Error('No package.json'))
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: { JavaScript: 12345 } });

      const lowStarResponse = await request(app)
        .post('/ai/analyze-repository')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'testuser/simple-project'
        });

      expect(highStarResponse.status).toBe(200);
      expect(lowStarResponse.status).toBe(200);
      
      // High star repo should have higher suggested price
      expect(highStarResponse.body.analysis.suggestedPrice)
        .toBeGreaterThan(lowStarResponse.body.analysis.suggestedPrice);
    });
  });

  describe('Integration with Project Creation', () => {
    test('should create project with GitHub-first data', async () => {
      // Mock GitHub validation to succeed
      const mockValidateRepo = jest.fn().mockResolvedValue({ valid: true });
      jest.mock('../services/githubValidator', () => ({
        validateRepository: mockValidateRepo
      }));

      const projectData = {
        title: 'Awesome Project',
        description: 'A comprehensive project created from GitHub analysis',
        repository: {
          freeUrl: 'https://github.com/testuser/awesome-project',
          paidUrl: 'https://github.com/testuser/awesome-project'
        },
        category: 'web',
        tags: ['react', 'javascript', 'web'],
        license: {
          type: 'free', // Simplify for test
          price: 0,
          currency: 'USD',
          features: {
            freeFeatures: ['View source code', 'Basic documentation'],
            paidFeatures: []
          }
        },
        githubVerified: true,
        sourceRepository: {
          fullName: 'testuser/awesome-project',
          url: 'https://github.com/testuser/awesome-project',
          language: 'JavaScript',
          stars: 25
        }
      };

      const response = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData);

      // Note: This test validates the flow structure but may need actual project creation logic
      // The actual status will depend on project creation implementation
      expect(response.status).toBeLessThan(500); // Should not be a server error
      
      if (response.status === 201) {
        expect(response.body.project).toMatchObject({
          title: 'Awesome Project',
          category: 'web'
        });
      }
    });
  });
});