import { test, expect } from '@playwright/test';

test.describe('Project Pages', () => {
  test.beforeEach(async ({ page }) => {
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`Console error: ${msg.text()}`);
      }
    });

    // Listen for network failures
    page.on('response', response => {
      if (response.status() >= 400) {
        console.error(`Network error: ${response.status()} ${response.url()}`);
      }
    });
  });

  test('should load project listing page without errors', async ({ page }) => {
    await page.goto('/find-projects');
    
    // Wait for projects to load
    await page.waitForSelector('[data-testid="project-card"], .text-center', { timeout: 10000 });
    
    // Check that we either have projects or a "no projects" message
    const projectCards = await page.locator('[data-testid="project-card"]').count();
    const noProjectsMessage = await page.locator('text=No projects found').count();
    
    expect(projectCards > 0 || noProjectsMessage > 0).toBeTruthy();
    
    // Verify no 404 errors in console
    const logs = [];
    page.on('console', msg => logs.push(msg.text()));
    await page.waitForTimeout(2000);
    
    const has404Error = logs.some(log => log.includes('404') || log.includes('Failed to fetch'));
    expect(has404Error).toBeFalsy();
  });

  test('should load individual project page without errors', async ({ page }) => {
    // First get a project ID from the listing
    await page.goto('/find-projects');
    await page.waitForSelector('a[href*="/project/"]', { timeout: 10000 });
    
    const projectLinks = await page.locator('a[href*="/project/"]');
    const firstProjectLink = await projectLinks.first().getAttribute('href');
    
    if (firstProjectLink) {
      await page.goto(firstProjectLink);
      
      // Wait for project content to load
      await page.waitForSelector('h1', { timeout: 10000 });
      
      // Check for required sections
      await expect(page.locator('text=About This Project')).toBeVisible();
      await expect(page.locator('text=Technologies')).toBeVisible();
      await expect(page.locator('text=About the Developer')).toBeVisible();
      
      // Check for SEO elements
      const title = await page.title();
      expect(title).toContain('VibeMarket');
      expect(title.length).toBeGreaterThan(10);
      
      // Check meta description exists
      const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
      expect(metaDescription).toBeTruthy();
      expect(metaDescription!.length).toBeLessThanOrEqual(160);
      
      // Check structured data exists
      const structuredData = await page.locator('script[type="application/ld+json"]').count();
      expect(structuredData).toBeGreaterThan(0);
    }
  });

  test('should show correct pricing display for non-logged users', async ({ page }) => {
    await page.goto('/find-projects');
    await page.waitForSelector('a[href*="/project/"]', { timeout: 10000 });
    
    const projectLinks = await page.locator('a[href*="/project/"]');
    const firstProjectLink = await projectLinks.first().getAttribute('href');
    
    if (firstProjectLink) {
      await page.goto(firstProjectLink);
      await page.waitForSelector('h1', { timeout: 10000 });
      
      // Check that pricing is hidden for non-logged users
      const pricingDetails = await page.locator('text=/\\$\\d+\\.\\d+/').count();
      const signInButtons = await page.locator('text=Sign in').count();
      
      // Either should show "Free" or hide pricing with sign-in prompt
      expect(signInButtons > 0 || await page.locator('text=Free').count() > 0).toBeTruthy();
    }
  });

  test('should load author profile page', async ({ page }) => {
    await page.goto('/find-projects');
    await page.waitForSelector('a[href*="/project/"]', { timeout: 10000 });
    
    const projectLinks = await page.locator('a[href*="/project/"]');
    const firstProjectLink = await projectLinks.first().getAttribute('href');
    
    if (firstProjectLink) {
      await page.goto(firstProjectLink);
      await page.waitForSelector('a[href*="/author/"]', { timeout: 10000 });
      
      const authorLink = await page.locator('a[href*="/author/"]').first().getAttribute('href');
      
      if (authorLink) {
        await page.goto(authorLink);
        
        // Wait for author profile to load
        await page.waitForSelector('h1', { timeout: 10000 });
        
        // Check for required sections
        await expect(page.locator('text=Statistics')).toBeVisible();
        await expect(page.locator('text=Projects by')).toBeVisible();
        
        // Check author info loads
        const authorName = await page.locator('h1').textContent();
        expect(authorName).toBeTruthy();
        expect(authorName!.length).toBeGreaterThan(0);
      }
    }
  });

  test('should handle draft project access correctly', async ({ page }) => {
    // Try to access a draft project without authentication
    // This should either redirect to login or show 404
    await page.goto('/edit-project/test-draft-id');
    
    // Should either redirect to login or show appropriate error
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    const hasLoginRedirect = currentUrl.includes('/login');
    const hasErrorMessage = await page.locator('text=not found, text=error, text=failed').count() > 0;
    
    expect(hasLoginRedirect || hasErrorMessage).toBeTruthy();
  });

  test('should not have console errors on main pages', async ({ page }) => {
    const consoleErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('favicon')) {
        consoleErrors.push(msg.text());
      }
    });

    // Test main pages
    const pagesToTest = ['/', '/find-projects'];
    
    for (const pagePath of pagesToTest) {
      await page.goto(pagePath);
      await page.waitForTimeout(3000);
    }
    
    // Allow some time for any async operations
    await page.waitForTimeout(2000);
    
    if (consoleErrors.length > 0) {
      console.log('Console errors found:', consoleErrors);
    }
    
    // Filter out known harmless errors (favicon, etc.)
    const significantErrors = consoleErrors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('manifest.json') &&
      !error.includes('sw.js')
    );
    
    expect(significantErrors).toHaveLength(0);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API failure to test error handling
    await page.route('**/api/projects**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' })
      });
    });

    await page.goto('/find-projects');
    
    // Should show error message, not crash
    await page.waitForSelector('text=error, text=failed, text=something went wrong', { timeout: 10000 });
    
    // Page should still be functional
    expect(await page.locator('body').count()).toBe(1);
  });

  test('should have proper SEO meta tags', async ({ page }) => {
    await page.goto('/find-projects');
    await page.waitForSelector('a[href*="/project/"]', { timeout: 10000 });
    
    const projectLinks = await page.locator('a[href*="/project/"]');
    const firstProjectLink = await projectLinks.first().getAttribute('href');
    
    if (firstProjectLink) {
      await page.goto(firstProjectLink);
      await page.waitForSelector('h1', { timeout: 10000 });
      
      // Check essential SEO elements
      const title = await page.title();
      expect(title.length).toBeGreaterThan(10);
      expect(title.length).toBeLessThan(60);
      
      const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
      expect(metaDescription).toBeTruthy();
      expect(metaDescription!.length).toBeGreaterThan(50);
      expect(metaDescription!.length).toBeLessThanOrEqual(160);
      
      // Check Open Graph tags
      const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
      const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');
      
      expect(ogTitle).toBeTruthy();
      expect(ogDescription).toBeTruthy();
      
      // Check canonical URL
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).toBeTruthy();
    }
  });
});