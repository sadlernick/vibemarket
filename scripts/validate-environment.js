#!/usr/bin/env node

/**
 * Environment validation script
 * Validates that all required environment variables are set
 */

const path = require('path');
const fs = require('fs');

// Required environment variables by environment
const requiredVars = {
  development: [
    'NODE_ENV',
    'JWT_SECRET',
    'SESSION_SECRET',
    'MONGODB_URI'
  ],
  test: [
    'NODE_ENV',
    'JWT_SECRET',
    'SESSION_SECRET'
  ],
  production: [
    'NODE_ENV',
    'JWT_SECRET',
    'SESSION_SECRET',
    'MONGODB_URI',
    'CLIENT_URL'
  ]
};

// Optional but recommended variables
const recommendedVars = [
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY'
];

function validateEnvironment() {
  const env = process.env.NODE_ENV || 'development';
  console.log(`🔍 Validating environment: ${env}`);
  
  const required = requiredVars[env] || requiredVars.development;
  const missing = [];
  const warnings = [];
  
  // Check required variables
  required.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });
  
  // Check recommended variables
  recommendedVars.forEach(varName => {
    if (!process.env[varName]) {
      warnings.push(varName);
    }
  });
  
  // Report results
  console.log('\n📋 Environment Validation Report:');
  console.log('================================');
  
  if (missing.length === 0) {
    console.log('✅ All required environment variables are set');
  } else {
    console.log('❌ Missing required environment variables:');
    missing.forEach(varName => {
      console.log(`   - ${varName}`);
    });
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  Missing recommended environment variables:');
    warnings.forEach(varName => {
      console.log(`   - ${varName}`);
    });
  }
  
  // Check .env file exists
  const envFile = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envFile)) {
    console.log('\n⚠️  No .env file found. Copy .env.example to .env and configure it.');
  }
  
  // Validate JWT secrets
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.log('\n⚠️  JWT_SECRET should be at least 32 characters long for security');
  }
  
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
    console.log('\n⚠️  SESSION_SECRET should be at least 32 characters long for security');
  }
  
  // Check database URI format
  if (process.env.MONGODB_URI) {
    if (!process.env.MONGODB_URI.startsWith('mongodb://') && !process.env.MONGODB_URI.startsWith('mongodb+srv://')) {
      console.log('\n⚠️  MONGODB_URI should start with mongodb:// or mongodb+srv://');
    }
  }
  
  console.log('\n🎯 Environment validation completed');
  
  if (missing.length > 0) {
    process.exit(1);
  }
}

// Generate secrets helper
function generateSecrets() {
  const crypto = require('crypto');
  
  console.log('\n🔐 Generated secure secrets (add these to your .env file):');
  console.log('='.repeat(60));
  console.log(`JWT_SECRET=${crypto.randomBytes(64).toString('hex')}`);
  console.log(`SESSION_SECRET=${crypto.randomBytes(64).toString('hex')}`);
  console.log('='.repeat(60));
}

// Main execution
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'generate-secrets') {
    generateSecrets();
  } else {
    validateEnvironment();
  }
}

module.exports = { validateEnvironment, generateSecrets };