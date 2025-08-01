import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:3000';

test.describe('API Endpoints', () => {
  test('should have working health check', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/health`);
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.message).toContain('running');
  });

  test('should return projects list', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/projects`);
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('projects');
    expect(Array.isArray(data.projects)).toBeTruthy();
  });

  test('should return individual project', async ({ request }) => {
    // First get a project ID
    const projectsResponse = await request.get(`${API_BASE_URL}/api/projects`);
    const projectsData = await projectsResponse.json();
    
    if (projectsData.projects && projectsData.projects.length > 0) {
      const projectId = projectsData.projects[0]._id;
      
      const response = await request.get(`${API_BASE_URL}/api/projects/${projectId}`);
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('project');
      expect(data.project._id).toBe(projectId);
    }
  });

  test('should handle non-existent project gracefully', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/projects/nonexistent123`);
    expect(response.status()).toBe(404);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('should require authentication for dashboard', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/projects/drafts`);
    expect(response.status()).toBe(401);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('token');
  });

  test('should handle author profile requests', async ({ request }) => {
    // Test that projects include author info without sensitive data
    const projectsResponse = await request.get(`${API_BASE_URL}/api/projects`);
    const projectsData = await projectsResponse.json();
    
    if (projectsData.projects && projectsData.projects.length > 0) {
      const author = projectsData.projects[0].author;
      
      expect(author).toHaveProperty('username');
      expect(author).toHaveProperty('_id');
      expect(author).toHaveProperty('reputation');
      expect(typeof author.reputation).toBe('number');
    }
  });

  test('should not expose sensitive user data in public routes', async ({ request }) => {
    const projectsResponse = await request.get(`${API_BASE_URL}/api/projects`);
    const projectsData = await projectsResponse.json();
    
    if (projectsData.projects && projectsData.projects.length > 0) {
      const author = projectsData.projects[0].author;
      
      // Should not expose email or password in project listings
      expect(author).not.toHaveProperty('email');
      expect(author).not.toHaveProperty('password');
      expect(author).not.toHaveProperty('passwordHash');
      expect(author).not.toHaveProperty('githubAccessToken');
    }
  });
});