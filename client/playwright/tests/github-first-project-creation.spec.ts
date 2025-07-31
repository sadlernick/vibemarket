import { test, expect, Page } from '@playwright/test';

// Mock user data
const mockUser = {
  id: 'user123',
  username: 'testuser',
  email: 'test@example.com',
  githubProfile: {
    username: 'testuser',
    profileUrl: 'https://github.com/testuser',
    avatarUrl: 'https://avatars.githubusercontent.com/u/12345'
  }
};

// Mock repositories
const mockRepositories = [
  {
    id: 1,
    fullName: 'testuser/awesome-react-app',
    name: 'awesome-react-app',
    description: 'An awesome React application with modern features',
    language: 'JavaScript',
    stars: 25,
    forks: 5,
    isPrivate: false,
    htmlUrl: 'https://github.com/testuser/awesome-react-app',
    updatedAt: '2024-01-15T10:00:00Z',
    hasAccess: true
  },
  {
    id: 2,
    fullName: 'testuser/python-cli-tool',
    name: 'python-cli-tool',
    description: 'A powerful command-line tool written in Python',
    language: 'Python',
    stars: 12,
    forks: 3,
    isPrivate: false,
    htmlUrl: 'https://github.com/testuser/python-cli-tool',
    updatedAt: '2024-01-10T15:30:00Z',
    hasAccess: true
  },
  {
    id: 3,
    fullName: 'testuser/mobile-app',
    name: 'mobile-app',
    description: 'Cross-platform mobile application',
    language: 'TypeScript',
    stars: 8,
    forks: 2,
    isPrivate: false,
    htmlUrl: 'https://github.com/testuser/mobile-app',
    updatedAt: '2024-01-05T09:15:00Z',
    hasAccess: true
  }
];

// Mock analysis result
const mockAnalysis = {
  title: 'Awesome React App',
  description: `**Awesome React App** is a modern web application that showcases cutting-edge development practices. Built with React, TypeScript, modern web technologies, this project demonstrates professional-grade architecture and user experience design.

🚀 **Key Features:**
- Responsive and intuitive user interface
- Modern development stack and best practices
- Scalable architecture for future growth
- Cross-browser compatibility

🛠️ **Technical Highlights:**
- Clean, maintainable codebase
- Comprehensive documentation
- Production-ready deployment
- Industry-standard security practices

Perfect for developers looking to learn from real-world implementations or businesses seeking proven solutions.`,
  category: 'web',
  tags: ['react', 'javascript', 'typescript', 'web'],
  features: {
    freeFeatures: ['View source code', 'Basic documentation', 'Personal use license', 'Responsive design'],
    paidFeatures: ['Commercial license', 'Priority support', 'Custom integrations', 'White-label rights', 'Professional deployment guide']
  },
  techStack: 'Languages: JavaScript, TypeScript • Frameworks: React',
  suggestedPrice: 35
};

async function setupMockAuth(page: Page) {
  // Mock localStorage for auth
  await page.addInitScript((user) => {
    localStorage.setItem('vibemarket_token', 'mock-jwt-token');
    localStorage.setItem('vibemarket_user', JSON.stringify(user));
  }, mockUser);

  // Mock auth context
  await page.route('**/api/auth/verify', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user: mockUser })
    });
  });
}

async function setupRepositoryMocks(page: Page) {
  // Mock GitHub repositories endpoint
  await page.route('**/api/github/repositories*', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        repositories: mockRepositories,
        totalCount: mockRepositories.length,
        page: 1,
        perPage: 50
      })
    });
  });

  // Mock repository analysis endpoint
  await page.route('**/api/ai/analyze-repository', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        repository: mockRepositories[0],
        analysis: mockAnalysis
      })
    });
  });

  // Mock project creation endpoint
  await page.route('**/api/projects', route => {
    if (route.request().method() === 'POST') {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          project: {
            _id: 'project123',
            title: 'Awesome React App',
            category: 'web',
            githubVerified: true
          }
        })
      });
    }
  });
}

test.describe('GitHub-First Project Creation', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockAuth(page);
    await setupRepositoryMocks(page);
  });

  test('should display GitHub-first option by default for new projects', async ({ page }) => {
    await page.goto('/post-projects');

    // Should show toggle buttons
    await expect(page.locator('text=Create from GitHub (Recommended)')).toBeVisible();
    await expect(page.locator('text=Manual Entry')).toBeVisible();

    // GitHub-first should be selected by default
    await expect(page.locator('button:has-text("Create from GitHub (Recommended)")'))
      .toHaveClass(/bg-purple-600/);
  });

  test('should load and display user repositories', async ({ page }) => {
    await page.goto('/post-projects');

    // Wait for repositories to load
    await expect(page.locator('text=Select a Repository')).toBeVisible();

    // Should display mock repositories
    await expect(page.locator('text=awesome-react-app')).toBeVisible();
    await expect(page.locator('text=python-cli-tool')).toBeVisible();
    await expect(page.locator('text=mobile-app')).toBeVisible();

    // Should show repository details
    await expect(page.locator('text=An awesome React application with modern features')).toBeVisible();
    await expect(page.locator('text=JavaScript')).toBeVisible();
    await expect(page.locator('text=⭐ 25')).toBeVisible();
    await expect(page.locator('text=🍴 5')).toBeVisible();
  });

  test('should filter repositories by search', async ({ page }) => {
    await page.goto('/post-projects');

    // Wait for repositories to load
    await expect(page.locator('text=awesome-react-app')).toBeVisible();

    // Search for specific repository
    await page.fill('input[placeholder="Search repositories..."]', 'python');

    // Should show only matching repository
    await expect(page.locator('text=python-cli-tool')).toBeVisible();
    await expect(page.locator('text=awesome-react-app')).not.toBeVisible();
    await expect(page.locator('text=mobile-app')).not.toBeVisible();
  });

  test('should handle repository selection and analysis', async ({ page }) => {
    await page.goto('/post-projects');

    // Wait for repositories to load
    await expect(page.locator('text=awesome-react-app')).toBeVisible();

    // Click on a repository
    await page.click('text=awesome-react-app');

    // Should show analysis step
    await expect(page.locator('text=Analyzing Repository')).toBeVisible();
    await expect(page.locator('text=We\'re analyzing awesome-react-app')).toBeVisible();

    // Should show AI analysis complete
    await expect(page.locator('text=AI Analysis Complete')).toBeVisible();

    // Should show customization form with pre-filled data
    await expect(page.locator('input[name="title"]')).toHaveValue('Awesome React App');
    await expect(page.locator('select[name="category"]')).toHaveValue('web');
    await expect(page.locator('input[name="tags"]')).toHaveValue('react, javascript, typescript, web');
    await expect(page.locator('input[name="price"]')).toHaveValue('35');
  });

  test('should display progress steps correctly', async ({ page }) => {
    await page.goto('/post-projects');

    // Initial state - step 1 active
    await expect(page.locator('text=Select Repository').locator('..')).toHaveClass(/text-purple-600/);
    await expect(page.locator('text=AI Analysis').locator('..')).toHaveClass(/text-gray-400/);
    await expect(page.locator('text=Customize & Publish').locator('..')).toHaveClass(/text-gray-400/);

    // Click repository to start analysis
    await page.click('text=awesome-react-app');

    // Step 2 should be active during analysis
    await expect(page.locator('text=AI Analysis').locator('..')).toHaveClass(/text-purple-600/);

    // Wait for analysis to complete
    await expect(page.locator('text=AI Analysis Complete')).toBeVisible();

    // Step 3 should be active
    await expect(page.locator('text=Customize & Publish').locator('..')).toHaveClass(/text-purple-600/);
    await expect(page.locator('text=Select Repository').locator('..')).toHaveClass(/text-green-600/);
    await expect(page.locator('text=AI Analysis').locator('..')).toHaveClass(/text-green-600/);
  });

  test('should allow customization of generated content', async ({ page }) => {
    await page.goto('/post-projects');

    // Select repository and wait for analysis
    await page.click('text=awesome-react-app');
    await expect(page.locator('text=AI Analysis Complete')).toBeVisible();

    // Modify the title
    await page.fill('input[name="title"]', 'My Custom React App');

    // Modify the description
    await page.fill('textarea[name="description"]', 'This is my customized description for the React app.');

    // Change category
    await page.selectOption('select[name="category"]', 'library');

    // Modify tags
    await page.fill('input[name="tags"]', 'react, custom, library');

    // Change license type
    await page.click('input[value="paid"]');

    // Modify price
    await page.fill('input[name="price"]', '50');

    // Verify changes are reflected
    await expect(page.locator('input[name="title"]')).toHaveValue('My Custom React App');
    await expect(page.locator('select[name="category"]')).toHaveValue('library');
    await expect(page.locator('input[name="price"]')).toHaveValue('50');
  });

  test('should display pricing breakdown correctly', async ({ page }) => {
    await page.goto('/post-projects');

    // Select repository and wait for analysis
    await page.click('text=awesome-react-app');
    await expect(page.locator('text=AI Analysis Complete')).toBeVisible();

    // Should show pricing breakdown for default price
    await expect(page.locator('text=Your price:')).toBeVisible();
    await expect(page.locator('text=$35.00')).toBeVisible();
    await expect(page.locator('text=Marketplace fee (20%):')).toBeVisible();
    await expect(page.locator('text=+$7.00')).toBeVisible();
    await expect(page.locator('text=Customer pays:')).toBeVisible();
    await expect(page.locator('text=$42')).toBeVisible();
    await expect(page.locator('text=You receive:')).toBeVisible();

    // Change price and verify breakdown updates
    await page.fill('input[name="price"]', '25');

    await expect(page.locator('text=$25.00')).toBeVisible();
    await expect(page.locator('text=+$5.00')).toBeVisible();
    await expect(page.locator('text=$30')).toBeVisible();
  });

  test('should handle license type changes', async ({ page }) => {
    await page.goto('/post-projects');

    // Select repository and wait for analysis
    await page.click('text=awesome-react-app');
    await expect(page.locator('text=AI Analysis Complete')).toBeVisible();

    // Default should be freemium
    await expect(page.locator('input[value="freemium"]')).toBeChecked();
    await expect(page.locator('text=Free Version Features')).toBeVisible();
    await expect(page.locator('text=Paid Version Features')).toBeVisible();

    // Switch to free
    await page.click('input[value="free"]');
    await expect(page.locator('text=Features Included')).toBeVisible();
    await expect(page.locator('text=Paid Version Features')).not.toBeVisible();

    // Switch to paid only
    await page.click('input[value="paid"]');
    await expect(page.locator('text=Features Included')).toBeVisible();
    await expect(page.locator('text=Free Version Features')).not.toBeVisible();
  });

  test('should allow navigation back to repository selection', async ({ page }) => {
    await page.goto('/post-projects');

    // Select repository and wait for analysis
    await page.click('text=awesome-react-app');
    await expect(page.locator('text=AI Analysis Complete')).toBeVisible();

    // Click back button
    await page.click('text=← Back to Repositories');

    // Should return to repository selection
    await expect(page.locator('text=Select a Repository')).toBeVisible();
    await expect(page.locator('text=awesome-react-app')).toBeVisible();
  });

  test('should handle project creation success', async ({ page }) => {
    await page.goto('/post-projects');

    // Select repository and wait for analysis
    await page.click('text=awesome-react-app');
    await expect(page.locator('text=AI Analysis Complete')).toBeVisible();

    // Click publish button
    await page.click('text=Publish Project');

    // Should show success message
    await expect(page.locator('text=Project Created Successfully!')).toBeVisible();
    await expect(page.locator('text=Your project has been created from your GitHub repository')).toBeVisible();

    // Should show loading spinner
    await expect(page.locator('.animate-spin')).toBeVisible();
  });

  test('should handle save as draft', async ({ page }) => {
    // Mock draft save endpoint
    await page.route('**/api/projects/draft', route => {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          project: {
            _id: 'draft123',
            title: 'Awesome React App',
            status: 'draft'
          }
        })
      });
    });

    await page.goto('/post-projects');

    // Select repository and wait for analysis
    await page.click('text=awesome-react-app');
    await expect(page.locator('text=AI Analysis Complete')).toBeVisible();

    // Click save as draft
    await page.click('text=Save as Draft');

    // Should show success message for draft
    await expect(page.locator('text=Project Created Successfully!')).toBeVisible();
  });

  test('should show AI-suggested price hint', async ({ page }) => {
    await page.goto('/post-projects');

    // Select repository and wait for analysis
    await page.click('text=awesome-react-app');
    await expect(page.locator('text=AI Analysis Complete')).toBeVisible();

    // Should show AI suggestion
    await expect(page.locator('text=(AI suggested: $35)')).toBeVisible();
  });

  test('should display detected tech stack', async ({ page }) => {
    await page.goto('/post-projects');

    // Select repository and wait for analysis
    await page.click('text=awesome-react-app');
    await expect(page.locator('text=AI Analysis Complete')).toBeVisible();

    // Should show detected tech stack
    await expect(page.locator('text=Detected Tech Stack:')).toBeVisible();
    await expect(page.locator('text=Languages: JavaScript, TypeScript • Frameworks: React')).toBeVisible();
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Mock error for repository analysis
    await page.route('**/api/ai/analyze-repository', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Failed to analyze repository'
        })
      });
    });

    await page.goto('/post-projects');

    // Select repository
    await page.click('text=awesome-react-app');

    // Should show error message
    await expect(page.locator('text=Failed to analyze repository')).toBeVisible();

    // Should return to repository selection
    await expect(page.locator('text=Select a Repository')).toBeVisible();
  });

  test('should require GitHub authentication', async ({ page }) => {
    // Mock user without GitHub profile
    await page.addInitScript(() => {
      localStorage.setItem('vibemarket_token', 'mock-jwt-token');
      localStorage.setItem('vibemarket_user', JSON.stringify({
        id: 'user123',
        username: 'testuser',
        email: 'test@example.com'
        // No githubProfile
      }));
    });

    await page.goto('/post-projects');

    // Should show GitHub connection required message
    await expect(page.locator('text=Connect Your GitHub Account')).toBeVisible();
    await expect(page.locator('text=Sign in with GitHub to create projects')).toBeVisible();
  });

  test('should switch to manual entry mode', async ({ page }) => {
    await page.goto('/post-projects');

    // Click manual entry button
    await page.click('text=Manual Entry');

    // Should show manual form instead of GitHub-first UI
    await expect(page.locator('text=Project Information')).toBeVisible();
    await expect(page.locator('input[name="title"]')).toBeVisible();
    await expect(page.locator('textarea[name="description"]')).toBeVisible();
    
    // Should not show repository selection
    await expect(page.locator('text=Select a Repository')).not.toBeVisible();
  });
});