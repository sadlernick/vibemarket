#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');

console.log('🚀 Building PackCode for Vercel...');

// Set environment variables for build
process.env.GENERATE_SOURCEMAP = 'false';
process.env.ESLINT_NO_DEV_ERRORS = 'true';
process.env.NODE_ENV = 'production';

// Change to client directory and build
const clientDir = path.join(__dirname, 'client');
process.chdir(clientDir);

console.log('📦 Installing dependencies with legacy peer deps...');
exec('npm install --legacy-peer-deps', (error, stdout, stderr) => {
  if (error) {
    console.error('Install failed:', error);
    process.exit(1);
  }
  
  console.log('🏗️ Building React app...');
  exec('npx react-scripts build', (buildError, buildStdout, buildStderr) => {
    if (buildError) {
      console.error('Build failed:', buildError);
      process.exit(1);
    }
    
    console.log('✅ Build completed successfully!');
    console.log(buildStdout);
  });
});