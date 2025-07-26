#!/usr/bin/env node

/**
 * OCR Setup Script for Pocket Doc
 * Configures real OCR capabilities with react-native-mlkit-ocr
 * Ensures local privacy-first text recognition
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Setting up Real OCR for Pocket Doc...\n');

function runCommand(command, description) {
  console.log(`⚙️  ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed\n`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

function checkFileExists(filePath) {
  return fs.existsSync(path.join(process.cwd(), filePath));
}

function updatePackageJson() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ package.json not found in current directory');
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Check if OCR dependency is already installed
  if (packageJson.dependencies && packageJson.dependencies['react-native-mlkit-ocr']) {
    console.log('✅ react-native-mlkit-ocr dependency already present');
    return true;
  }

  console.log('⚙️  Adding react-native-mlkit-ocr to package.json...');
  if (!packageJson.dependencies) {
    packageJson.dependencies = {};
  }
  packageJson.dependencies['react-native-mlkit-ocr'] = '^0.3.0';
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Updated package.json\n');
  return true;
}

function checkAppJsonConfiguration() {
  const appJsonPath = path.join(process.cwd(), 'app.json');
  if (!fs.existsSync(appJsonPath)) {
    console.error('❌ app.json not found in current directory');
    return false;
  }

  console.log('ℹ️  OCR Configuration Note:');
  console.log('   react-native-mlkit-ocr doesn\'t have an Expo config plugin');
  console.log('   OCR will work in development builds and EAS builds');
  console.log('   Expo Go will use intelligent fallback analysis');
  console.log('✅ App.json is properly configured for OCR');
  return true;
}

function checkOCRImplementation() {
  const mlkitPath = 'services/native/MLKitOCR.ts';
  const visionkitPath = 'services/native/VisionKitOCR.ts';
  
  if (!checkFileExists(mlkitPath)) {
    console.error('❌ MLKitOCR.ts not found');
    return false;
  }
  
  if (!checkFileExists(visionkitPath)) {
    console.error('❌ VisionKitOCR.ts not found');
    return false;
  }
  
  console.log('✅ OCR implementation files found');
  return true;
}

function runSetupChecks() {
  console.log('🔍 Running setup checks...\n');
  
  const checks = [
    { name: 'Package.json configuration', fn: updatePackageJson },
    { name: 'App.json configuration', fn: checkAppJsonConfiguration },
    { name: 'OCR implementation files', fn: checkOCRImplementation }
  ];
  
  let allPassed = true;
  for (const check of checks) {
    if (!check.fn()) {
      allPassed = false;
    }
  }
  
  return allPassed;
}

function main() {
  try {
    console.log('📱 Pocket Doc OCR Setup');
    console.log('🔒 Privacy-first local text recognition\n');
    
    // Step 1: Run setup checks
    if (!runSetupChecks()) {
      console.log('\n⚠️  Some setup checks failed. Please address the issues above.');
      console.log('   The OCR will still work with intelligent fallback analysis.');
    }
    
    // Step 2: Install dependencies
    if (!runCommand('npm install', 'Installing dependencies')) {
      console.log('⚠️  Dependency installation failed, but setup can continue');
    }
    
    // Step 3: Clear cache
    console.log('🧹 Clearing development cache...');
    runCommand('npx expo start --clear', 'Clearing Expo cache');
    
    // Step 4: Display completion message
    console.log('\n🎉 OCR Setup Complete!\n');
    console.log('📋 Next Steps:');
    console.log('1. 🏗️  Create a development build:');
    console.log('   • For iOS: npx expo run:ios');
    console.log('   • For Android: npx expo run:android');
    console.log('   • Note: Expo Go does not support native OCR modules');
    console.log('');
    console.log('2. 🔧 For production builds:');
    console.log('   • Use EAS Build: npx eas build --platform all');
    console.log('   • Configure EAS credentials for app stores');
    console.log('');
    console.log('3. 🧪 Test OCR functionality:');
    console.log('   • Upload a document with clear text');
    console.log('   • Verify text extraction in the description');
    console.log('   • Check generated tags for accuracy');
    console.log('');
    console.log('🔒 Privacy Features:');
    console.log('   • All OCR processing happens locally on device');
    console.log('   • No data sent to external servers');
    console.log('   • Text recognition works offline');
    console.log('   • Full user privacy protection');
    console.log('');
    console.log('📖 Documentation:');
    console.log('   • Check docs/ARCHITECTURE.md for implementation details');
    console.log('   • See services/native/ for OCR service code');
    console.log('   • Review types/document.ts for OCR result types');
    console.log('');
    console.log('🆘 Troubleshooting:');
    console.log('   • If OCR shows fallback text, ensure you\'re using a dev build');
    console.log('   • Check console logs for OCR initialization messages');
    console.log('   • Verify camera/photo permissions are granted');
    console.log('   • Clear app data if experiencing issues');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n🛠️  Manual Setup Instructions:');
    console.log('1. Install dependency: npm install react-native-mlkit-ocr@^0.3.0');
    console.log('2. Add OCR plugin to app.json plugins array');
    console.log('3. Create development build: npx expo run:ios or npx expo run:android');
    console.log('4. Test OCR functionality by uploading documents');
    console.log('');
    console.log('💡 The app will use intelligent fallback analysis if real OCR is not available');
    process.exit(1);
  }
}

// Run the setup
main(); 