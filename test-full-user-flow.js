#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'https://www.pack-code.com';

let authToken = null;
let testUser = null;

// Configure axios to handle errors properly
axios.interceptors.response.use(
  response => response,
  error => {
    // Don't throw on 4xx/5xx status codes, we want to handle them
    return Promise.resolve(error.response || { status: 'NETWORK_ERROR', data: error.message });
  }
);

async function createTestUser() {
  console.log('👤 Creating test user for comprehensive testing...');
  
  try {
    testUser = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'testpassword123'
    };
    
    const response = await axios.post(`${BASE_URL}/api/auth/register`, testUser);
    
    if ((response.status === 200 || response.status === 201) && response.data.token) {
      authToken = response.data.token;
      console.log('✅ Test user created successfully');
      console.log(`   Username: ${testUser.username}`);
      console.log(`   Email: ${testUser.email}`);
      return true;
    } else {
      console.log('❌ Failed to create test user:', response.status, response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Error creating test user:', error.message);
    return false;
  }
}

async function testEndpoint(method, path, data = null, description = '', expectedStatus = 200) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { Authorization: `Bearer ${authToken}` })
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    
    const passed = response.status === expectedStatus;
    const icon = passed ? '✅' : '❌';
    
    console.log(`${icon} ${method} ${path} - ${response.status} ${description || ''}`);
    
    if (!passed) {
      console.log(`   Expected: ${expectedStatus}, Got: ${response.status}`);
      if (response.data && typeof response.data === 'object') {
        console.log(`   Response:`, JSON.stringify(response.data, null, 2));
      }
    }
    
    return { passed, response };
  } catch (error) {
    console.log(`❌ ${method} ${path} - ERROR: ${error.message} ${description || ''}`);
    return { passed: false, error };
  }
}

async function testPageLoad(path, description = '') {
  try {
    const response = await axios.get(`${BASE_URL}${path}`);
    const passed = response.status === 200;
    const icon = passed ? '✅' : '❌';
    
    console.log(`${icon} GET ${path} - ${response.status} ${description}`);
    return { passed, response };
  } catch (error) {
    console.log(`❌ GET ${path} - ERROR: ${error.message} ${description}`);
    return { passed: false, error };
  }
}

async function testAllAPIsAsAuthenticatedUser() {
  console.log('\n🔐 Testing ALL API endpoints as authenticated user:\n');
  
  const apiTests = [
    // Core APIs
    ['GET', '/api/health', null, '(Health check)', 200],
    ['GET', '/api/dashboard', null, '(User dashboard)', 200],
    
    // Auth APIs
    ['GET', '/api/auth/profile', null, '(User profile)', 200],
    
    // Project APIs
    ['GET', '/api/projects', null, '(List projects)', 200],
    ['POST', '/api/projects', { title: 'Test Project', description: 'Test', category: 'web' }, '(Create project)', 201],
    
    // GitHub APIs
    ['GET', '/api/github/status', null, '(GitHub connection status)', 200],
    ['GET', '/api/github/repositories', null, '(GitHub repositories)', 400], // Should fail - no GitHub connected
    ['POST', '/api/github/verify-repository', { repositoryUrl: 'https://github.com/test/repo' }, '(Verify repository)', 400], // Should fail - no GitHub connected
    ['GET', '/api/github/oauth/login', null, '(GitHub OAuth URL)', 200],
    
    // License APIs  
    ['GET', '/api/licenses', null, '(User licenses)', 200],
    
    // Review APIs
    ['GET', '/api/reviews', null, '(Reviews)', 200],
    
    // Admin APIs (should fail for regular user)
    ['GET', '/api/admin/users', null, '(Admin users - should fail)', 403],
    
    // Tools APIs
    ['GET', '/api/tools/idea-generator', null, '(Idea generator)', 200],
  ];
  
  let passed = 0;
  let total = apiTests.length;
  
  for (const [method, path, data, description, expectedStatus] of apiTests) {
    const result = await testEndpoint(method, path, data, description, expectedStatus);
    if (result.passed) passed++;
  }
  
  console.log(`\n📊 API Test Results: ${passed}/${total} passed (${((passed/total)*100).toFixed(1)}%)`);
  
  return { passed, total };
}

async function testAllPagesAsAuthenticatedUser() {
  console.log('\n📄 Testing ALL pages load correctly:\n');
  
  const pages = [
    ['/', '(Home page)'],
    ['/login', '(Login page)'],
    ['/register', '(Register page)'],
    ['/find-projects', '(Find projects)'],
    ['/post-projects', '(Post projects)'],
    ['/dashboard', '(Dashboard)'],
    ['/profile', '(Profile)'],
    ['/upload', '(Upload)'],
    ['/tools/idea-generator', '(Idea generator)'],
    ['/tutorials', '(Tutorials)'],
    ['/admin', '(Admin dashboard)'],
    ['/project/test-id', '(Project detail)'],
    ['/author/test-id', '(Author profile)'],
  ];
  
  let passed = 0;
  let total = pages.length;
  
  for (const [path, description] of pages) {
    const result = await testPageLoad(path, description);
    if (result.passed) passed++;
  }
  
  console.log(`\n📊 Page Load Results: ${passed}/${total} passed (${((passed/total)*100).toFixed(1)}%)`);
  
  return { passed, total };
}

async function debugGitHubEndpoints() {
  console.log('\n🐛 Deep debugging GitHub repository selection issue:\n');
  
  // Test GitHub status endpoint in detail
  console.log('Testing GitHub status endpoint...');
  const statusResult = await testEndpoint('GET', '/api/github/status', null, '(Check GitHub connection)', 200);
  
  if (statusResult.passed && statusResult.response.data) {
    console.log('   GitHub Status Response:', JSON.stringify(statusResult.response.data, null, 2));
    
    const isConnected = statusResult.response.data.isConnected;
    
    if (!isConnected) {
      console.log('   ℹ️  User has no GitHub account connected (expected for email-only user)');
      
      // Test what happens when clicking "Connect GitHub"
      console.log('\nTesting GitHub OAuth flow...');
      const oauthResult = await testEndpoint('GET', '/api/github/oauth/login', null, '(Get GitHub OAuth URL)', 200);
      
      if (oauthResult.passed && oauthResult.response.data.authUrl) {
        console.log('   ✅ GitHub OAuth URL generated successfully');
        console.log('   URL:', oauthResult.response.data.authUrl);
      }
    }
    
    // Test repositories endpoint (should fail without GitHub connection)
    console.log('\nTesting repositories endpoint...');
    const reposResult = await testEndpoint('GET', '/api/github/repositories', null, '(Fetch repositories)', 400);
    
    if (reposResult.response && reposResult.response.data) {
      console.log('   Expected error:', JSON.stringify(reposResult.response.data, null, 2));
    }
    
    // Test repository verification (should fail without GitHub connection)
    console.log('\nTesting repository verification...');
    const verifyResult = await testEndpoint('POST', '/api/github/verify-repository', 
      { repositoryUrl: 'https://github.com/octocat/Hello-World' }, 
      '(Verify repository)', 400);
    
    if (verifyResult.response && verifyResult.response.data) {
      console.log('   Expected error:', JSON.stringify(verifyResult.response.data, null, 2));
    }
  }
}

async function simulateUserInteractions() {
  console.log('\n🖱️  Simulating user interactions on Post Project page:\n');
  
  // Test the actual POST project endpoint that gets called when user clicks "Publish"
  console.log('Testing project creation with various data...');
  
  const projectData = {
    title: 'Test Project From Automated Test',
    description: 'This is a test project created by the automated testing system',
    category: 'web',
    tags: 'test, automation, web',
    licenseType: 'free',
    freeRepositoryUrl: 'https://github.com/octocat/Hello-World',
    demoUrl: 'https://example.com',
    features: {
      freeFeatures: 'Basic functionality'
    }
  };
  
  const createResult = await testEndpoint('POST', '/api/projects', projectData, '(Create test project)', 201);
  
  if (createResult.passed) {
    console.log('   ✅ Project creation successful!');
    
    // If project was created, test getting it
    if (createResult.response.data && createResult.response.data.project) {
      const projectId = createResult.response.data.project._id || createResult.response.data.project.id;
      console.log('   Project ID:', projectId);
      
      // Test getting the created project
      await testEndpoint('GET', `/api/projects/${projectId}`, null, '(Get created project)', 200);
      
      // Test updating the project
      await testEndpoint('PUT', `/api/projects/${projectId}`, 
        { ...projectData, title: 'Updated Test Project' }, 
        '(Update project)', 200);
      
      // Test deleting the project (cleanup)
      await testEndpoint('DELETE', `/api/projects/${projectId}`, null, '(Delete project)', 200);
    }
  } else {
    console.log('   ❌ Project creation failed');
    if (createResult.response && createResult.response.data) {
      console.log('   Error:', JSON.stringify(createResult.response.data, null, 2));
    }
  }
}

async function runComprehensiveTests() {
  console.log('🧪 COMPREHENSIVE USER FLOW & API TESTING\n');
  console.log('=' .repeat(60));
  
  // Step 1: Create authenticated user
  const userCreated = await createTestUser();
  if (!userCreated) {
    console.log('❌ Cannot proceed without authenticated user');
    return;
  }
  
  // Step 2: Test all pages
  const pageResults = await testAllPagesAsAuthenticatedUser();
  
  // Step 3: Test all APIs
  const apiResults = await testAllAPIsAsAuthenticatedUser();
  
  // Step 4: Debug specific GitHub issue
  await debugGitHubEndpoints();
  
  // Step 5: Test user interactions
  await simulateUserInteractions();
  
  // Final summary
  console.log('\n🎯 COMPREHENSIVE TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`📄 Pages: ${pageResults.passed}/${pageResults.total} working (${((pageResults.passed/pageResults.total)*100).toFixed(1)}%)`);
  console.log(`🔌 APIs: ${apiResults.passed}/${apiResults.total} working (${((apiResults.passed/apiResults.total)*100).toFixed(1)}%)`);
  
  const overallSuccess = (pageResults.passed + apiResults.passed) / (pageResults.total + apiResults.total);
  console.log(`🏆 Overall: ${((overallSuccess)*100).toFixed(1)}% success rate`);
  
  if (overallSuccess >= 0.9) {
    console.log('🚀 EXCELLENT: System is working well!');
  } else if (overallSuccess >= 0.8) {
    console.log('⚠️  GOOD: Some issues need attention');
  } else {
    console.log('🚨 CRITICAL: Major issues need immediate fixing');
  }
}

runComprehensiveTests().catch(console.error);