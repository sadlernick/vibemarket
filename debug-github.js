const axios = require('axios');

// Debug GitHub OAuth Integration
async function debugGitHubIntegration() {
  console.log('🔍 Debugging GitHub OAuth Integration...\n');

  const baseURL = 'http://localhost:5001';

  try {
    // Test 1: Check if server is running
    console.log('1️⃣  Testing server health...');
    const healthResponse = await axios.get(`${baseURL}/api/health`);
    console.log('✅ Server is running:', healthResponse.data.message);
  } catch (error) {
    console.log('❌ Server not running. Start with: npm run dev');
    console.log('Error:', error.message);
    return;
  }

  try {
    // Test 2: Check GitHub OAuth login endpoint
    console.log('\n2️⃣  Testing GitHub OAuth login endpoint...');
    const oauthResponse = await axios.get(`${baseURL}/api/github/oauth/login`);
    console.log('✅ GitHub OAuth endpoint working');
    console.log('Auth URL:', oauthResponse.data.authUrl);
  } catch (error) {
    console.log('❌ GitHub OAuth endpoint failed');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
    
    if (error.response?.status === 500) {
      console.log('\n🔧 Likely issues:');
      console.log('   - GitHub Client ID/Secret not set in .env file');
      console.log('   - GitHub OAuth app not created');
      console.log('   - Environment variables not loaded');
    }
  }

  try {
    // Test 3: Check GitHub status endpoint
    console.log('\n3️⃣  Testing GitHub status endpoint...');
    const statusResponse = await axios.get(`${baseURL}/api/github/status`);
    console.log('✅ GitHub status endpoint working');
    console.log('Connected:', statusResponse.data.isConnected);
  } catch (error) {
    console.log('❌ GitHub status endpoint failed');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
  }

  // Test 4: Check environment variables
  console.log('\n4️⃣  Checking environment variables...');
  require('dotenv').config();
  
  const requiredEnvVars = [
    'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET',
    'CLIENT_URL'
  ];

  let envIssues = false;
  
  requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (!value || value === 'your_github_client_id_here' || value === 'your_github_client_secret_here') {
      console.log(`❌ ${varName}: Not set or placeholder value`);
      envIssues = true;
    } else {
      console.log(`✅ ${varName}: Set (${value.substring(0, 10)}...)`);
    }
  });

  if (envIssues) {
    console.log('\n🔧 Environment Setup Instructions:');
    console.log('1. Go to https://github.com/settings/developers');
    console.log('2. Click "New OAuth App"');
    console.log('3. Set Homepage URL: http://localhost:3001');
    console.log('4. Set Authorization callback URL: http://localhost:3001/auth/github/callback');
    console.log('5. Copy Client ID and Client Secret to .env file');
  }

  console.log('\n🎯 Next Steps:');
  console.log('1. Set up GitHub OAuth credentials in .env');
  console.log('2. Restart server: npm run dev');
  console.log('3. Test GitHub login at: http://localhost:3001/login');
  console.log('4. Check browser console for any errors');
}

// Run the debug
debugGitHubIntegration().catch(console.error);