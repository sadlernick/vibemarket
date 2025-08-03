/**
 * Unit tests for database models
 * Tests model validation, methods, and schema constraints
 */

const User = require('../../models/User');
const Project = require('../../models/Project');
const bcrypt = require('bcryptjs');

describe('Database Models - Unit Tests', () => {

  describe('User Model', () => {
    describe('User Creation', () => {
      it('should create a user with valid data', async () => {
        const userData = {
          username: 'testuser',
          email: 'test@example.com',
          password: await bcrypt.hash('password123', 4)
        };

        const user = await User.create(userData);
        
        expect(user).toBeDefined();
        expect(user.username).toBe('testuser');
        expect(user.email).toBe('test@example.com');
        expect(user._id).toBeDefined();
        expect(user.createdAt).toBeDefined();
      });

      it('should require username, email, and password', async () => {
        const userData = {
          email: 'test@example.com'
          // Missing username and password
        };

        await expect(User.create(userData)).rejects.toThrow();
      });

      it('should validate email format', async () => {
        const userData = {
          username: 'testuser',
          email: 'invalid-email',
          password: await bcrypt.hash('password123', 4)
        };

        await expect(User.create(userData)).rejects.toThrow();
      });

      it('should enforce unique email addresses', async () => {
        const userData1 = {
          username: 'user1',
          email: 'test@example.com',
          password: await bcrypt.hash('password123', 4)
        };
        
        const userData2 = {
          username: 'user2',
          email: 'test@example.com', // Same email
          password: await bcrypt.hash('password123', 4)
        };

        await User.create(userData1);
        await expect(User.create(userData2)).rejects.toThrow();
      });

      it('should enforce unique usernames', async () => {
        const userData1 = {
          username: 'testuser',
          email: 'test1@example.com',
          password: await bcrypt.hash('password123', 4)
        };
        
        const userData2 = {
          username: 'testuser', // Same username
          email: 'test2@example.com',
          password: await bcrypt.hash('password123', 4)
        };

        await User.create(userData1);
        await expect(User.create(userData2)).rejects.toThrow();
      });
    });

    describe('User Profile', () => {
      it('should allow optional profile fields', async () => {
        const userData = {
          username: 'testuser',
          email: 'test@example.com',
          password: await bcrypt.hash('password123', 4),
          profile: {
            displayName: 'Test User',
            bio: 'A test user bio',
            location: 'Test City',
            website: 'https://testuser.com'
          }
        };

        const user = await User.create(userData);
        
        expect(user.profile.displayName).toBe('Test User');
        expect(user.profile.bio).toBe('A test user bio');
        expect(user.profile.location).toBe('Test City');
        expect(user.profile.website).toBe('https://testuser.com');
      });

      it('should validate website URL format', async () => {
        const userData = {
          username: 'testuser',
          email: 'test@example.com',
          password: await bcrypt.hash('password123', 4),
          profile: {
            website: 'invalid-url'
          }
        };

        await expect(User.create(userData)).rejects.toThrow();
      });
    });

    describe('GitHub Profile', () => {
      it('should allow GitHub profile integration', async () => {
        const userData = {
          username: 'testuser',
          email: 'test@example.com',
          password: await bcrypt.hash('password123', 4),
          githubProfile: {
            id: '12345',
            username: 'github_testuser',
            displayName: 'GitHub Test User',
            profileUrl: 'https://github.com/github_testuser',
            accessToken: 'github_token_123'
          }
        };

        const user = await User.create(userData);
        
        expect(user.githubProfile.id).toBe('12345');
        expect(user.githubProfile.username).toBe('github_testuser');
        expect(user.githubProfile.accessToken).toBe('github_token_123');
      });
    });
  });

  describe('Project Model', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await global.testUtils.createTestUser();
    });

    describe('Project Creation', () => {
      it('should create a project with valid data', async () => {
        const projectData = {
          title: 'Test Project',
          description: 'A test project description',
          author: testUser._id,
          category: 'web',
          tags: ['javascript', 'react'],
          repository: {
            freeUrl: 'https://github.com/test/repo'
          }
        };

        const project = await Project.create(projectData);
        
        expect(project).toBeDefined();
        expect(project.title).toBe('Test Project');
        expect(project.author.toString()).toBe(testUser._id.toString());
        expect(project.category).toBe('web');
        expect(project.tags).toEqual(['javascript', 'react']);
      });

      it('should require title, description, author, and category', async () => {
        const projectData = {
          title: 'Test Project'
          // Missing required fields
        };

        await expect(Project.create(projectData)).rejects.toThrow();
      });

      it('should validate category enum values', async () => {
        const projectData = {
          title: 'Test Project',
          description: 'A test project',
          author: testUser._id,
          category: 'invalid-category'
        };

        await expect(Project.create(projectData)).rejects.toThrow();
      });

      it('should validate repository URLs', async () => {
        const projectData = {
          title: 'Test Project',
          description: 'A test project',
          author: testUser._id,
          category: 'web',
          repository: {
            freeUrl: 'invalid-url'
          }
        };

        await expect(Project.create(projectData)).rejects.toThrow();
      });
    });

    describe('Project License', () => {
      it('should support different license types', async () => {
        const freemiumProject = {
          title: 'Freemium Project',
          description: 'A freemium project',
          author: testUser._id,
          category: 'web',
          license: {
            type: 'freemium',
            price: 29.99,
            currency: 'USD',
            features: {
              freeFeatures: ['Basic feature'],
              paidFeatures: ['Premium feature']
            }
          }
        };

        const project = await Project.create(freemiumProject);
        
        expect(project.license.type).toBe('freemium');
        expect(project.license.price).toBe(29.99);
        expect(project.license.currency).toBe('USD');
        expect(project.license.features.freeFeatures).toContain('Basic feature');
        expect(project.license.features.paidFeatures).toContain('Premium feature');
      });

      it('should validate license price for paid projects', async () => {
        const paidProject = {
          title: 'Paid Project',
          description: 'A paid project',
          author: testUser._id,
          category: 'web',
          license: {
            type: 'paid',
            price: -10 // Invalid negative price
          }
        };

        await expect(Project.create(paidProject)).rejects.toThrow();
      });
    });

    describe('Project Status', () => {
      it('should default to draft status', async () => {
        const projectData = {
          title: 'Draft Project',
          description: 'A draft project',
          author: testUser._id,
          category: 'web'
        };

        const project = await Project.create(projectData);
        expect(project.status).toBe('draft');
      });

      it('should allow published status', async () => {
        const projectData = {
          title: 'Published Project',
          description: 'A published project',
          author: testUser._id,
          category: 'web',
          status: 'published'
        };

        const project = await Project.create(projectData);
        expect(project.status).toBe('published');
      });
    });

    describe('Project Metrics', () => {
      it('should initialize metrics with zero values', async () => {
        const projectData = {
          title: 'Metrics Project',
          description: 'A project for testing metrics',
          author: testUser._id,
          category: 'web'
        };

        const project = await Project.create(projectData);
        expect(project.metrics.views).toBe(0);
        expect(project.metrics.downloads).toBe(0);
        expect(project.metrics.likes).toBe(0);
      });

      it('should allow custom metric values', async () => {
        const projectData = {
          title: 'Popular Project',
          description: 'A popular project',
          author: testUser._id,
          category: 'web',
          metrics: {
            views: 1000,
            downloads: 50,
            likes: 25
          }
        };

        const project = await Project.create(projectData);
        expect(project.metrics.views).toBe(1000);
        expect(project.metrics.downloads).toBe(50);
        expect(project.metrics.likes).toBe(25);
      });
    });
  });

});