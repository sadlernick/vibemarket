const request = require('supertest');

// Mock the entire app since we just want to test API endpoints
describe('AI API Endpoints', () => {
  const baseURL = 'http://localhost:5001';

  describe('AI Search', () => {
    test('should respond to AI search requests', async () => {
      const response = await request(baseURL)
        .post('/api/projects/ai-search')
        .send({ query: 'react dashboard' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('projects');
      expect(response.body).toHaveProperty('searchSummary');
      expect(Array.isArray(response.body.projects)).toBe(true);
    });

    test('should handle empty search query', async () => {
      const response = await request(baseURL)
        .post('/api/projects/ai-search')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Project Idea Generator', () => {
    test('should generate project ideas', async () => {
      const response = await request(baseURL)
        .post('/api/tools/generate-ideas')
        .send({
          skillLevel: 'beginner',
          interests: ['web'],
          timeCommitment: '1-week',
          goals: ['learn']
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ideas');
      expect(Array.isArray(response.body.ideas)).toBe(true);
      expect(response.body.ideas.length).toBeGreaterThan(0);
      
      // Check structure of first idea
      if (response.body.ideas.length > 0) {
        const idea = response.body.ideas[0];
        expect(idea).toHaveProperty('title');
        expect(idea).toHaveProperty('description');
        expect(idea).toHaveProperty('category');
        expect(idea).toHaveProperty('difficulty');
        expect(idea).toHaveProperty('requiredSkills');
        expect(Array.isArray(idea.requiredSkills)).toBe(true);
      }
    });

    test('should handle missing parameters gracefully', async () => {
      const response = await request(baseURL)
        .post('/api/tools/generate-ideas')
        .send({ skillLevel: 'beginner' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ideas');
    });
  });

  describe('Health Check', () => {
    test('should respond to health check', async () => {
      const response = await request(baseURL)
        .get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });
  });
});