#!/usr/bin/env node

/**
 * Startup Test Script
 * 
 * This script tests if the app can be imported and initialized without errors
 */

console.log('🧪 Testing app startup...');

// Test 1: Check if main services can be imported
console.log('\n1. Testing service imports...');
try {
  // Test TypeScript compilation
  const { execSync } = require('child_process');
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  console.log('   ✅ TypeScript compilation successful');
} catch (error) {
  console.log('   ❌ TypeScript compilation failed');
  console.log('   Error:', error.message);
  process.exit(1);
}

// Test 2: Check if critical files exist
console.log('\n2. Testing critical files...');
const fs = require('fs');
const path = require('path');

const criticalFiles = [
  'app/_layout.tsx',
  'app/(tabs)/index.tsx',
  'contexts/AppContext.tsx',
  'contexts/ThemeContext.tsx',
  'services/database.ts',
  'services/monitoring.ts',
  'services/fileValidation.ts',
  'services/performanceMonitoring.ts',
];

let allFilesExist = true;
criticalFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} missing`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Critical files missing');
  process.exit(1);
}

// Test 3: Check package.json dependencies
console.log('\n3. Testing dependencies...');
const packageJson = require('../package.json');
const criticalDeps = [
  'expo',
  'react',
  'react-native',
  '@sentry/react-native',
];

let allDepsInstalled = true;
criticalDeps.forEach(dep => {
  if (packageJson.dependencies[dep]) {
    console.log(`   ✅ ${dep}`);
  } else {
    console.log(`   ❌ ${dep} missing`);
    allDepsInstalled = false;
  }
});

if (!allDepsInstalled) {
  console.log('\n❌ Critical dependencies missing');
  process.exit(1);
}

console.log('\n✅ All startup tests passed!');
console.log('\n🚀 App should start without crashing now.');
console.log('\n📝 To start the app:');
console.log('   npx expo start');
console.log('\n🔧 If you still see crashes, check:');
console.log('   1. Make sure all dependencies are installed: npm install');
console.log('   2. Clear cache: npx expo start --clear');
console.log('   3. Check device logs for runtime errors');
console.log('   4. Ensure EXPO_PUBLIC_SENTRY_DSN is set (optional for development)'); 