const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const Project = require('../models/Project');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

describe('AI Features', () => {
  let userToken;
  let testUser;
  let testProjects;

  beforeAll(async () => {
    // Create test user
    testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedPassword',
      role: 'user'
    });
    await testUser.save();

    // Generate JWT token
    userToken = jwt.sign(
      { userId: testUser._id },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Create test projects
    testProjects = await Project.insertMany([
      {
        title: 'React Dashboard Template',
        description: 'A modern React dashboard with charts and analytics. Perfect for admin panels and data visualization.',
        author: testUser._id,
        category: 'web',
        tags: ['react', 'dashboard', 'admin', 'charts'],
        tech_stack: ['React', 'TypeScript', 'Chart.js', 'Tailwind CSS'],
        license: {
          type: 'paid',
          price: 49,
          currency: 'USD',
          marketplaceFeePct: 20,
          sellerEarnings: 39.2,
          features: {
            freeFeatures: ['Basic dashboard'],
            paidFeatures: ['Advanced charts', 'Custom themes']
          }
        },
        repository: {
          freeUrl: 'https://github.com/test/dashboard-free',
          paidUrl: 'https://github.com/test/dashboard-pro'
        },
        stats: { views: 1000, downloads: 250, stars: 45 },
        isActive: true,
        status: 'published'
      },
      {
        title: 'Node.js API Boilerplate',
        description: 'Production-ready Node.js API with authentication, validation, and database integration.',
        author: testUser._id,
        category: 'api',
        tags: ['nodejs', 'api', 'express', 'mongodb'],
        tech_stack: ['Node.js', 'Express', 'MongoDB', 'JWT'],
        license: {
          type: 'free',
          price: 0,
          currency: 'USD',
          marketplaceFeePct: 0,
          sellerEarnings: 0,
          features: {
            freeFeatures: ['Complete API structure', 'Authentication'],
            paidFeatures: []
          }
        },
        repository: {
          freeUrl: 'https://github.com/test/api-boilerplate'
        },
        stats: { views: 800, downloads: 400, stars: 67 },
        isActive: true,
        status: 'published'
      }
    ]);
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Project.deleteMany({});
    await mongoose.connection.close();
  });

  describe('AI Generate Feature', () => {
    test('should generate project content with mock data when no API key', async () => {
      const response = await request(app)
        .post('/api/projects/ai-generate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          projectName: 'Todo App',
          description: 'A simple todo list application'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('tags');
      expect(response.body).toHaveProperty('category');
      expect(response.body).toHaveProperty('tech_stack');
      expect(response.body).toHaveProperty('features');
      expect(response.body.features).toHaveProperty('freeFeatures');
      expect(response.body.features).toHaveProperty('paidFeatures');
      
      // Check that content is enhanced
      expect(response.body.title).toContain('Todo App');
      expect(response.body.description).toContain('A simple todo list application');
      expect(response.body.tags).toBeInstanceOf(Array);
      expect(response.body.tags.length).toBeGreaterThan(0);
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .post('/api/projects/ai-generate')
        .send({
          projectName: 'Todo App',
          description: 'A simple todo list application'
        });

      expect(response.status).toBe(401);
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/projects/ai-generate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          projectName: 'Todo App'
          // Missing description
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });
  });

  describe('AI Search Feature', () => {
    test('should return relevant projects for search query', async () => {
      const response = await request(app)
        .post('/api/projects/ai-search')
        .send({
          query: 'react dashboard admin'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('projects');
      expect(response.body).toHaveProperty('searchSummary');
      expect(response.body.projects).toBeInstanceOf(Array);
      
      // Should find the React Dashboard project
      const dashboardProject = response.body.projects.find(p => p.title.includes('React Dashboard'));
      expect(dashboardProject).toBeDefined();
      expect(dashboardProject.category).toBe('web');
      expect(dashboardProject.tags).toContain('react');
    });

    test('should handle search with no results', async () => {
      const response = await request(app)
        .post('/api/projects/ai-search')
        .send({
          query: 'nonexistent technology xyz123'
        });

      expect(response.status).toBe(200);
      expect(response.body.projects).toBeInstanceOf(Array);
      expect(response.body.searchSummary).toContain('No projects found');
    });

    test('should work without authentication', async () => {
      const response = await request(app)
        .post('/api/projects/ai-search')
        .send({
          query: 'api nodejs'
        });

      expect(response.status).toBe(200);
      expect(response.body.projects).toBeInstanceOf(Array);
    });

    test('should validate search query', async () => {
      const response = await request(app)
        .post('/api/projects/ai-search')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });

    test('should rank results by relevance', async () => {
      const response = await request(app)
        .post('/api/projects/ai-search')
        .send({
          query: 'react'
        });

      expect(response.status).toBe(200);
      const projects = response.body.projects;
      
      if (projects.length > 1) {
        // First result should be more relevant (React Dashboard should rank higher)
        const firstProject = projects[0];
        expect(firstProject.title.toLowerCase()).toContain('react');
      }
    });
  });

  describe('Project Idea Generator', () => {
    test('should generate project ideas based on preferences', async () => {
      const response = await request(app)
        .post('/api/tools/generate-ideas')
        .send({
          skillLevel: 'beginner',
          interests: ['web', 'api'],
          timeCommitment: '1-week',
          goals: ['learn', 'portfolio']
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ideas');
      expect(response.body.ideas).toBeInstanceOf(Array);
      expect(response.body.ideas.length).toBeGreaterThan(0);
      expect(response.body.ideas.length).toBeLessThanOrEqual(3);

      // Check structure of each idea
      response.body.ideas.forEach(idea => {
        expect(idea).toHaveProperty('id');
        expect(idea).toHaveProperty('title');
        expect(idea).toHaveProperty('description');
        expect(idea).toHaveProperty('category');
        expect(idea).toHaveProperty('difficulty');
        expect(idea).toHaveProperty('estimatedTime');
        expect(idea).toHaveProperty('marketDemand');
        expect(idea).toHaveProperty('estimatedPrice');
        expect(idea).toHaveProperty('requiredSkills');
        expect(idea).toHaveProperty('suggestedFeatures');
        expect(idea).toHaveProperty('monetizationTips');
        expect(idea.requiredSkills).toBeInstanceOf(Array);
        expect(idea.suggestedFeatures).toBeInstanceOf(Array);
        expect(idea.monetizationTips).toBeInstanceOf(Array);
      });
    });

    test('should filter ideas based on interests', async () => {
      const response = await request(app)
        .post('/api/tools/generate-ideas')
        .send({
          skillLevel: 'intermediate',
          interests: ['api'],
          timeCommitment: '2-weeks',
          goals: ['income']
        });

      expect(response.status).toBe(200);
      const ideas = response.body.ideas;
      
      // Should return API-related ideas when API interest is specified
      const hasApiIdea = ideas.some(idea => 
        idea.category === 'api' || 
        idea.requiredSkills.some(skill => skill.toLowerCase().includes('api'))
      );
      expect(hasApiIdea).toBe(true);
    });

    test('should work without authentication', async () => {
      const response = await request(app)
        .post('/api/tools/generate-ideas')
        .send({
          skillLevel: 'beginner',
          interests: ['web'],
          timeCommitment: 'weekend',
          goals: ['fun']
        });

      expect(response.status).toBe(200);
      expect(response.body.ideas).toBeInstanceOf(Array);
    });

    test('should handle missing parameters gracefully', async () => {
      const response = await request(app)
        .post('/api/tools/generate-ideas')
        .send({
          skillLevel: 'beginner'
          // Missing other parameters
        });

      expect(response.status).toBe(200);
      expect(response.body.ideas).toBeInstanceOf(Array);
    });
  });

  describe('Integration Tests', () => {
    test('should be able to generate idea and then create project', async () => {
      // First, generate an idea
      const ideaResponse = await request(app)
        .post('/api/tools/generate-ideas')
        .send({
          skillLevel: 'beginner',
          interests: ['web'],
          timeCommitment: '1-week',
          goals: ['learn']
        });

      expect(ideaResponse.status).toBe(200);
      const idea = ideaResponse.body.ideas[0];

      // Then, use AI Generate to enhance it
      const generateResponse = await request(app)
        .post('/api/projects/ai-generate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          projectName: idea.title,
          description: idea.description
        });

      expect(generateResponse.status).toBe(200);
      expect(generateResponse.body.title).toBeDefined();
      expect(generateResponse.body.category).toBeDefined();
    });

    test('should find AI-generated content in search', async () => {
      // Generate some content
      const generateResponse = await request(app)
        .post('/api/projects/ai-generate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          projectName: 'Weather App',
          description: 'A weather forecasting application'
        });

      expect(generateResponse.status).toBe(200);
      
      // Create a project with this content
      const projectData = {
        title: generateResponse.body.title,
        description: generateResponse.body.description,
        category: generateResponse.body.category,
        tags: generateResponse.body.tags,
        tech_stack: generateResponse.body.tech_stack,
        license: {
          type: 'free',
          price: 0,
          currency: 'USD',
          features: generateResponse.body.features
        },
        repository: {
          freeUrl: generateResponse.body.freeRepositoryUrl
        },
        stats: { views: 0, downloads: 0, stars: 0 },
        isActive: true,
        status: 'published',
        author: testUser._id
      };

      const newProject = new Project(projectData);
      await newProject.save();

      // Search should find it
      const searchResponse = await request(app)
        .post('/api/projects/ai-search')
        .send({
          query: 'weather forecasting'
        });

      expect(searchResponse.status).toBe(200);
      const foundProject = searchResponse.body.projects.find(p => 
        p.title.toLowerCase().includes('weather')
      );
      expect(foundProject).toBeDefined();
    });
  });
});