#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'https://www.pack-code.com';

// Test results
const results = {
  pages: [],
  apis: [],
  summary: { passed: 0, failed: 0 }
};

// Helper to test a page
async function testPage(path, expectedStatus = 200, description = '') {
  try {
    const response = await axios.get(`${BASE_URL}${path}`, {
      timeout: 10000,
      validateStatus: () => true // Don't throw on 4xx/5xx
    });
    
    const passed = response.status === expectedStatus;
    const result = {
      path,
      description,
      status: response.status,
      expectedStatus,
      passed,
      contentType: response.headers['content-type'] || 'unknown'
    };
    
    results.pages.push(result);
    results.summary[passed ? 'passed' : 'failed']++;
    
    console.log(`${passed ? '✅' : '❌'} ${path} - ${response.status} ${description}`);
    return result;
  } catch (error) {
    const result = {
      path,
      description,
      status: 'ERROR',
      expectedStatus,
      passed: false,
      error: error.message
    };
    
    results.pages.push(result);
    results.summary.failed++;
    
    console.log(`❌ ${path} - ERROR: ${error.message} ${description}`);
    return result;
  }
}

// Helper to test an API endpoint
async function testAPI(path, method = 'GET', data = null, headers = {}, expectedStatus = 200, description = '') {
  try {
    const config = {
      method,
      url: `${BASE_URL}/api${path}`,
      timeout: 10000,
      validateStatus: () => true,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    
    const passed = response.status === expectedStatus;
    const result = {
      path: `/api${path}`,
      method,
      description,
      status: response.status,
      expectedStatus,
      passed,
      responseSize: JSON.stringify(response.data || '').length
    };
    
    results.apis.push(result);
    results.summary[passed ? 'passed' : 'failed']++;
    
    console.log(`${passed ? '✅' : '❌'} ${method} /api${path} - ${response.status} ${description}`);
    return result;
  } catch (error) {
    const result = {
      path: `/api${path}`,
      method,
      description,
      status: 'ERROR',
      expectedStatus,
      passed: false,
      error: error.message
    };
    
    results.apis.push(result);
    results.summary.failed++;
    
    console.log(`❌ ${method} /api${path} - ERROR: ${error.message} ${description}`);
    return result;
  }
}

async function runTests() {
  console.log('🧪 Testing PackCode Production Site\n');
  
  console.log('📄 Testing Frontend Pages:');
  
  // Public pages
  await testPage('/', 200, '(Home)');
  await testPage('/find-projects', 200, '(Find Projects)');
  await testPage('/post-projects', 200, '(Post Projects)');
  await testPage('/tools/idea-generator', 200, '(Project Idea Generator)');
  await testPage('/tutorials', 200, '(Build Your First)');
  await testPage('/login', 200, '(Login)');
  await testPage('/register', 200, '(Register)');
  
  // Test some project and author pages (will be 200 even if empty)
  await testPage('/project/test-id', 200, '(Project Detail - should load)');
  await testPage('/author/test-id', 200, '(Author Profile - should load)');
  
  // Protected pages (should redirect to login or show login prompt)
  await testPage('/dashboard', 200, '(Dashboard - protected)');
  await testPage('/profile', 200, '(Profile - protected)');
  await testPage('/upload', 200, '(Upload - protected)');
  await testPage('/admin', 200, '(Admin - protected)');
  
  console.log('\n🔌 Testing API Endpoints:');
  
  // Core API endpoints
  await testAPI('/health', 'GET', null, {}, 200, '(Health check)');
  await testAPI('/projects', 'GET', null, {}, 200, '(Get projects)');
  
  // Auth endpoints
  await testAPI('/auth/login', 'POST', {
    email: 'nonexistent@test.com',
    password: 'wrongpassword'
  }, {}, 401, '(Login with invalid credentials)');
  
  // Dashboard endpoint (should require auth)
  await testAPI('/dashboard', 'GET', null, {}, 401, '(Dashboard without auth)');
  
  // GitHub OAuth endpoints
  await testAPI('/github/oauth/login', 'GET', null, {}, 200, '(GitHub OAuth URL)');
  
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${results.summary.passed}`);
  console.log(`❌ Failed: ${results.summary.failed}`);
  console.log(`📈 Success Rate: ${((results.summary.passed / (results.summary.passed + results.summary.failed)) * 100).toFixed(1)}%`);
  
  if (results.summary.failed > 0) {
    console.log('\n❌ Failed Tests:');
    [...results.pages, ...results.apis]
      .filter(r => !r.passed)
      .forEach(r => {
        console.log(`   ${r.path} - ${r.status} ${r.error ? `(${r.error})` : ''}`);
      });
  }
  
  console.log('\n🎯 Key Findings:');
  const htmlPages = results.pages.filter(p => p.contentType && p.contentType.includes('html'));
  console.log(`   📄 ${htmlPages.length} pages serving HTML content`);
  
  const workingAPIs = results.apis.filter(a => a.passed);
  console.log(`   🔌 ${workingAPIs.length} API endpoints working correctly`);
  
  const authProtected = results.apis.filter(a => a.status === 401);
  console.log(`   🔒 ${authProtected.length} endpoints properly protected with authentication`);
}

// Run the tests
runTests().catch(console.error);