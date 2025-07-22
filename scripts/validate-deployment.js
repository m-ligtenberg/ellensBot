#!/usr/bin/env node

/**
 * Deployment Validation Script for Young Ellens Chatbot
 * This script validates that all necessary files and configurations are in place for deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Young Ellens Chatbot deployment configuration...\n');

const checks = [];

// Function to add a check result
function check(name, condition, message) {
  checks.push({ name, passed: condition, message });
  console.log(`${condition ? '✅' : '❌'} ${name}: ${message}`);
}

// Check if required files exist
const requiredFiles = [
  '.github/workflows/deploy.yml',
  'railway.json',
  'render.yaml',
  'backend/Dockerfile',
  'backend/.dockerignore',
  'backend/package.json',
  'backend/tsconfig.json',
  'frontend/.env.production',
  'DEPLOYMENT_GITHUB.md'
];

requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, '..', file));
  check(`File ${file}`, exists, exists ? 'Found' : 'Missing - required for deployment');
});

// Check package.json scripts
try {
  const backendPkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'backend/package.json'), 'utf8'));
  check('Backend build script', !!backendPkg.scripts?.build, backendPkg.scripts?.build ? 'Found: ' + backendPkg.scripts.build : 'Missing npm run build script');
  check('Backend start script', !!backendPkg.scripts?.start, backendPkg.scripts?.start ? 'Found: ' + backendPkg.scripts.start : 'Missing npm start script');
} catch (error) {
  check('Backend package.json', false, 'Could not read or parse backend/package.json');
}

// Check environment configuration
try {
  const prodEnv = fs.readFileSync(path.join(__dirname, '..', 'frontend/.env.production'), 'utf8');
  check('Frontend production config', prodEnv.includes('REACT_APP_BACKEND_URL'), 'Backend URL configured');
  check('Frontend WebSocket config', prodEnv.includes('REACT_APP_WS_URL'), 'WebSocket URL configured');
} catch (error) {
  check('Frontend production env', false, 'Could not read frontend/.env.production');
}

// Check TypeScript configuration
try {
  const tsConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'backend/tsconfig.json'), 'utf8'));
  check('TypeScript config', !!tsConfig.compilerOptions, 'TypeScript configuration found');
} catch (error) {
  check('TypeScript config', false, 'Could not read backend/tsconfig.json');
}

// Summary
console.log('\n📊 Deployment Validation Summary:');
const passed = checks.filter(c => c.passed).length;
const total = checks.length;

console.log(`✅ Passed: ${passed}/${total}`);
console.log(`❌ Failed: ${total - passed}/${total}`);

if (passed === total) {
  console.log('\n🎉 All checks passed! Your Young Ellens chatbot is ready for deployment.');
  console.log('\n📋 Next steps:');
  console.log('1. Push your code to GitHub');
  console.log('2. Set up Railway or Render account');
  console.log('3. Configure environment variables');
  console.log('4. Enable GitHub Pages in repository settings');
  console.log('5. Watch the magic happen! 🚀');
} else {
  console.log('\n⚠️  Some checks failed. Please address the issues above before deploying.');
  process.exit(1);
}