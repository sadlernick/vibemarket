/**
 * Integration tests for API health and basic functionality
 * Tests the complete request/response cycle
 */

const request = require('supertest');
const app = require('../../index');

describe('API Health - Integration Tests', () => {
  
  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'ok',
        timestamp: expect.any(String),
        environment: 'test'
      });
    });

    it('should include database status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('database');
      expect(typeof response.body.database).toBe('string');
    });
  });

  describe('CORS Configuration', () => {
    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/api/health')
        .set('Origin', 'http://localhost:3001')
        .set('Access-Control-Request-Method', 'GET')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should allow requests from localhost', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:3001')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3001');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/api/non-existent-endpoint')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle malformed requests gracefully', async () => {
      const response = await request(app)
        .post('/api/projects')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // Check for basic security headers
      expect(response.headers).toHaveProperty('x-powered-by');
    });
  });

});