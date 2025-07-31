import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('should have working health check', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.message).toContain('running');
  });

  test('should return projects list', async ({ request }) => {
    const response = await request.get('/api/projects');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('projects');
    expect(Array.isArray(data.projects)).toBeTruthy();
  });

  test('should return individual project', async ({ request }) => {
    // First get a project ID
    const projectsResponse = await request.get('/api/projects');
    const projectsData = await projectsResponse.json();
    
    if (projectsData.projects && projectsData.projects.length > 0) {
      const projectId = projectsData.projects[0]._id;
      
      const response = await request.get(`/api/projects/${projectId}`);
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('project');
      expect(data.project._id).toBe(projectId);
    }
  });

  test('should handle non-existent project gracefully', async ({ request }) => {
    const response = await request.get('/api/projects/nonexistent123');
    expect(response.status()).toBe(404);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('should require authentication for dashboard', async ({ request }) => {
    const response = await request.get('/api/dashboard');
    expect(response.status()).toBe(401);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('token');
  });

  test('should handle author profile requests', async ({ request }) => {
    // First get a user ID from projects
    const projectsResponse = await request.get('/api/projects');
    const projectsData = await projectsResponse.json();
    
    if (projectsData.projects && projectsData.projects.length > 0) {
      const authorId = projectsData.projects[0].author._id;
      
      const response = await request.get(`/api/users/${authorId}`);
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('username');
      expect(data._id).toBe(authorId);
    }
  });

  test('should not expose sensitive user data in public routes', async ({ request }) => {
    const projectsResponse = await request.get('/api/projects');
    const projectsData = await projectsResponse.json();
    
    if (projectsData.projects && projectsData.projects.length > 0) {
      const authorId = projectsData.projects[0].author._id;
      
      const response = await request.get(`/api/users/${authorId}`);
      const data = await response.json();
      
      // Should not expose email or password
      expect(data).not.toHaveProperty('email');
      expect(data).not.toHaveProperty('password');
      expect(data).not.toHaveProperty('passwordHash');
    }
  });
});