const axios = require('axios');

async function testPostProjectFlow() {
  try {
    // 1. Register/Login
    console.log('1. Registering test user...');
    const registerResponse = await axios.post('http://localhost:3000/api/auth/register', {
      username: `testuser${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      password: 'password123'
    });
    
    const token = registerResponse.data.token;
    console.log('✓ User registered successfully');
    
    // Set auth header for all requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // 2. Test AI analyze-repository
    console.log('\n2. Testing AI analyze-repository...');
    const analyzeResponse = await axios.post('http://localhost:3000/api/ai/analyze-repository', {
      fullName: 'vercel/next.js'
    });
    
    console.log('✓ Repository analyzed successfully:');
    console.log(`  - Title: ${analyzeResponse.data.analysis.title}`);
    console.log(`  - Category: ${analyzeResponse.data.analysis.category}`);
    console.log(`  - Tags: ${analyzeResponse.data.analysis.tags.join(', ')}`);
    
    // 3. Test project creation
    console.log('\n3. Creating project...');
    const projectData = {
      title: analyzeResponse.data.analysis.title,
      description: analyzeResponse.data.analysis.description,
      category: analyzeResponse.data.analysis.category,
      tags: analyzeResponse.data.analysis.tags,
      repository: {
        freeUrl: 'https://github.com/vercel/next.js'
      },
      license: {
        type: 'free',
        price: 0
      }
    };
    
    const projectResponse = await axios.post('http://localhost:3000/api/projects', projectData);
    console.log('✓ Project created successfully:');
    console.log(`  - ID: ${projectResponse.data.project._id}`);
    console.log(`  - Status: ${projectResponse.data.project.status}`);
    
    // 4. Test project listing
    console.log('\n4. Verifying project in listing...');
    const listingResponse = await axios.get('http://localhost:3000/api/projects');
    const foundProject = listingResponse.data.projects.find(
      p => p._id === projectResponse.data.project._id
    );
    
    if (foundProject) {
      console.log('✓ Project found in public listing');
    } else {
      console.log('✗ Project not found in listing');
    }
    
    console.log('\n✓ All tests passed successfully!');
    
  } catch (error) {
    console.error('\n✗ Test failed:', error.response?.data || error.message);
    if (error.response?.data?.details) {
      console.error('Details:', error.response.data.details);
    }
  }
}

testPostProjectFlow();