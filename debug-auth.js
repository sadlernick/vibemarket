const axios = require('axios');

// Debug authentication and token validation
async function debugAuthentication() {
  console.log('🔍 Debugging Authentication Issues...\n');

  const baseURL = 'http://localhost:5001/api';

  // Check if there's a token in localStorage (simulate browser behavior)
  console.log('1️⃣  Checking authentication endpoints...\n');

  try {
    // Test GitHub status endpoint without token
    console.log('Testing GitHub status without authentication...');
    try {
      const response = await axios.get(`${baseURL}/github/status`);
      console.log('✅ GitHub status (no auth):', response.data);
    } catch (error) {
      console.log('❌ GitHub status (no auth):', error.response?.status, error.response?.data?.error);
    }

    // Test with a dummy token to see the error
    console.log('\nTesting GitHub status with invalid token...');
    try {
      const response = await axios.get(`${baseURL}/github/status`, {
        headers: { Authorization: 'Bearer invalid_token' }
      });
      console.log('✅ GitHub status (invalid token):', response.data);
    } catch (error) {
      console.log('❌ GitHub status (invalid token):', error.response?.status, error.response?.data?.error);
    }

    // Test GitHub OAuth login endpoint
    console.log('\nTesting github oauth login...');
    try {
      const response = await axios.get(`${baseURL}/github/oauth/login`);
      console.log('✅ GitHub OAuth login endpoint working');
      console.log('Generated auth URL:', response.data.authUrl.substring(0, 100) + '...');
    } catch (error) {
      console.log('❌ GitHub OAuth login failed:', error.response?.status, error.response?.data?.error);
    }

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }

  console.log('\n🔧 Common Issues and Solutions:');
  console.log('1. "Invalid credentials" error:');
  console.log('   - Token might be expired or malformed');
  console.log('   - Check if JWT_SECRET matches between requests');
  console.log('   - Clear localStorage: localStorage.removeItem("vibemarket_token")');
  console.log('');
  console.log('2. OAuth flow breaks on second attempt:');
  console.log('   - GitHub token might be revoked');
  console.log('   - Database connection issues');
  console.log('   - User record corruption');
  console.log('');
  console.log('3. To test fresh:');
  console.log('   - Clear browser localStorage');
  console.log('   - Restart both client and server');
  console.log('   - Try OAuth flow in incognito mode');
}

// Run the debug
debugAuthentication().catch(console.error);