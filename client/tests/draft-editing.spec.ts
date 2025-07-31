import { test, expect } from '@playwright/test';

test.describe('Draft Project Editing', () => {
  test('should handle draft project access without authentication', async ({ page }) => {
    const consoleErrors = [];
    const networkErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('response', response => {
      if (response.status() >= 400) {
        networkErrors.push(`${response.status()} ${response.url()}`);
      }
    });

    // Try to access edit project page without auth
    await page.goto('/edit-project/test-draft-id');
    
    // Wait for any async operations
    await page.waitForTimeout(5000);
    
    // Should either redirect to login or show error
    const currentUrl = page.url();
    const isOnLoginPage = currentUrl.includes('/login');
    const hasErrorMessage = await page.locator('text=/error|failed|not found/i').count() > 0;
    
    expect(isOnLoginPage || hasErrorMessage).toBeTruthy();
    
    console.log('Console errors:', consoleErrors);
    console.log('Network errors:', networkErrors);
    
    // Check for specific API errors we've been seeing
    const has404ApiError = networkErrors.some(error => 
      error.includes('404') && error.includes('/api/projects/')
    );
    
    if (has404ApiError) {
      console.log('❌ Found 404 API error - this is the bug we need to fix');
      
      // The error should be handled gracefully, not cause crashes
      expect(await page.locator('body').count()).toBe(1);
    }
  });

  test('should show login prompt for draft editing', async ({ page }) => {
    await page.goto('/edit-project/nonexistent-draft');
    
    // Should redirect to login or show auth prompt
    await page.waitForTimeout(3000);
    
    const hasLoginElements = await page.locator('text=/sign in|login|authenticate/i').count() > 0;
    const isOnLoginPage = page.url().includes('/login');
    
    expect(hasLoginElements || isOnLoginPage).toBeTruthy();
  });

  test('should validate project creation flow', async ({ page }) => {
    await page.goto('/post-projects');
    
    // Should load without console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForTimeout(3000);
    
    // Check form loads
    await expect(page.locator('input[name="title"], input#title')).toBeVisible();
    await expect(page.locator('textarea[name="description"], textarea#description')).toBeVisible();
    
    // Check for TypeScript/compilation errors
    const hasTypeScriptErrors = consoleErrors.some(error => 
      error.includes('TS') || error.includes('TypeError') || error.includes('undefined')
    );
    
    expect(hasTypeScriptErrors).toBeFalsy();
    
    if (consoleErrors.length > 0) {
      console.log('Console errors on project creation page:', consoleErrors);
    }
  });

  test('should handle dashboard data loading', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login for non-authenticated users
    await page.waitForTimeout(3000);
    
    const isOnLoginPage = page.url().includes('/login');
    const hasAuthError = await page.locator('text=/please log in|sign in required/i').count() > 0;
    
    expect(isOnLoginPage || hasAuthError).toBeTruthy();
  });

  test('should not have double API prefix issues', async ({ page }) => {
    const networkRequests = [];
    
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        networkRequests.push(request.url());
      }
    });

    await page.goto('/find-projects');
    await page.waitForTimeout(3000);
    
    // Check for double /api/ in URLs
    const hasDoubleApiPrefix = networkRequests.some(url => 
      url.includes('/api/api/')
    );
    
    if (hasDoubleApiPrefix) {
      console.log('❌ Found double /api/ prefix in requests:', 
        networkRequests.filter(url => url.includes('/api/api/'))
      );
    }
    
    expect(hasDoubleApiPrefix).toBeFalsy();
  });

  test('should have proper error boundaries', async ({ page }) => {
    // Simulate API failure
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Simulated server error' })
      });
    });

    await page.goto('/find-projects');
    
    // Page should still render, not crash
    await page.waitForTimeout(3000);
    
    expect(await page.locator('body').count()).toBe(1);
    expect(await page.locator('nav').count()).toBe(1);
    
    // Should show error message, not blank page
    const hasErrorMessage = await page.locator('text=/error|failed|something went wrong/i').count() > 0;
    expect(hasErrorMessage).toBeTruthy();
  });
});