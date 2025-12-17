const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Install Python dependencies
try {
  console.log('Installing Python dependencies...');
  execSync('pip install -r requirements.txt', { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to install Python dependencies:', error);
  process.exit(1);
}

// Install frontend dependencies and build
process.chdir('frontend');
try {
  console.log('Installing frontend dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('Building frontend...');
  execSync('npm run build', { stdio: 'inherit' });
} catch (error) {
  console.error('Frontend build failed:', error);
  process.exit(1);
}
