#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'https://www.pack-code.com';

async function testPageContent(path, expectedContent, description) {
  try {
    const response = await axios.get(`${BASE_URL}${path}`, {
      timeout: 10000
    });
    
    const hasContent = expectedContent.every(content => 
      response.data.includes(content)
    );
    
    console.log(`${hasContent ? '✅' : '❌'} ${path} - ${description}`);
    
    if (!hasContent) {
      const missing = expectedContent.filter(content => 
        !response.data.includes(content)
      );
      console.log(`   Missing: ${missing.join(', ')}`);
    }
    
    return hasContent;
  } catch (error) {
    console.log(`❌ ${path} - ERROR: ${error.message}`);
    return false;
  }
}

async function runContentTests() {
  console.log('🔍 Testing Page Content and Functionality\n');
  
  const tests = [
    {
      path: '/',
      content: ['PackCode', 'marketplace', 'vibe coders'],
      description: 'Home page has branding and tagline'
    },
    {
      path: '/login',
      content: ['email', 'password', 'Continue with GitHub'],
      description: 'Login page has email/password and GitHub login'
    },
    {
      path: '/register',
      content: ['username', 'email', 'password', 'Continue with GitHub'],
      description: 'Register page has all required fields'
    },
    {
      path: '/find-projects',
      content: ['projects', 'search', 'filter'],
      description: 'Find Projects page has search functionality'
    },
    {
      path: '/post-projects',
      content: ['title', 'description', 'category'],
      description: 'Post Projects page has project form fields'
    },
    {
      path: '/tools/idea-generator',
      content: ['Generate', 'Project', 'Idea'],
      description: 'Idea Generator has generation functionality'
    },
    {
      path: '/tutorials',
      content: ['tutorial', 'learn', 'build'],
      description: 'Tutorials page has learning content'
    }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    const result = await testPageContent(test.path, test.content, test.description);
    if (result) passed++;
  }
  
  console.log(`\n📊 Content Test Results:`);
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  
  return passed === total;
}

// Test API responses for expected data structure
async function testAPIStructure() {
  console.log('\n🔧 Testing API Response Structures:\n');
  
  const tests = [
    {
      endpoint: '/api/health',
      expectedFields: ['status', 'timestamp', 'database'],
      description: 'Health endpoint returns system status'
    },
    {
      endpoint: '/api/projects',
      expectedFields: ['projects', 'pagination'],
      description: 'Projects endpoint returns paginated data'
    },
    {
      endpoint: '/api/github/oauth/login',
      expectedFields: ['authUrl'],
      description: 'GitHub OAuth returns authorization URL'
    }
  ];
  
  let passed = 0;
  
  for (const test of tests) {
    try {
      const response = await axios.get(`${BASE_URL}${test.endpoint}`);
      const hasFields = test.expectedFields.every(field => 
        response.data.hasOwnProperty(field)
      );
      
      console.log(`${hasFields ? '✅' : '❌'} ${test.endpoint} - ${test.description}`);
      
      if (!hasFields) {
        const missing = test.expectedFields.filter(field => 
          !response.data.hasOwnProperty(field)
        );
        console.log(`   Missing fields: ${missing.join(', ')}`);
      } else {
        passed++;
      }
    } catch (error) {
      console.log(`❌ ${test.endpoint} - ERROR: ${error.message}`);
    }
  }
  
  console.log(`\n📊 API Structure Test Results:`);
  console.log(`✅ Passed: ${passed}/${tests.length}`);
  console.log(`📈 Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
  
  return passed === tests.length;
}

async function main() {
  const contentPassed = await runContentTests();
  const apiPassed = await testAPIStructure();
  
  console.log('\n🎯 Overall Assessment:');
  console.log(`📄 Frontend Content: ${contentPassed ? 'PASS' : 'FAIL'}`);
  console.log(`🔌 API Structure: ${apiPassed ? 'PASS' : 'FAIL'}`);
  console.log(`🏆 Overall Status: ${contentPassed && apiPassed ? 'ALL SYSTEMS GO! 🚀' : 'NEEDS ATTENTION ⚠️'}`);
}

main().catch(console.error);