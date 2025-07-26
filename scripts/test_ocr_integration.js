#!/usr/bin/env node

/**
 * OCR Integration Test Script
 * Run this to verify OCR setup and troubleshoot issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 OCR Integration Test Suite');
console.log('='.repeat(50));

// Check if this is a production build or development
const isProduction = process.env.NODE_ENV === 'production';
const buildType = isProduction ? 'production' : 'development';
console.log(`🏗️  Build Type: ${buildType}`);

// Test 1: Check OCR dependencies
console.log('\n📦 Testing OCR Dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const ocrDeps = [
    'react-native-mlkit-ocr',
    'expo-camera',
    'expo-image-picker',
    'expo-file-system'
  ];
  
  let allDepsPresent = true;
  ocrDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`  ✅ ${dep}: ${packageJson.dependencies[dep]}`);
    } else {
      console.log(`  ❌ ${dep}: Not found`);
      allDepsPresent = false;
    }
  });
  
  if (allDepsPresent) {
    console.log('  ✅ All OCR dependencies are present');
  } else {
    console.log('  ❌ Some OCR dependencies are missing');
  }
} catch (error) {
  console.log('  ❌ Error checking dependencies:', error.message);
}

// Test 2: Check OCR service files
console.log('\n📁 Testing OCR Service Files...');
const requiredFiles = [
  'services/ocrService.ts',
  'services/native/MLKitOCR.ts',
  'services/native/VisionKitOCR.ts',
  'services/aiMetadata.ts',
  'services/textProcessingService.ts'
];

let allFilesPresent = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const stats = fs.statSync(file);
    const sizeKB = Math.round(stats.size / 1024);
    console.log(`  ✅ ${file} (${sizeKB} KB)`);
  } else {
    console.log(`  ❌ ${file}: Not found`);
    allFilesPresent = false;
  }
});

if (allFilesPresent) {
  console.log('  ✅ All OCR service files are present');
} else {
  console.log('  ❌ Some OCR service files are missing');
}

// Test 3: Check app.json configuration
console.log('\n⚙️  Testing App Configuration...');
try {
  const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
  
  // Check iOS permissions
  const iosPermissions = appJson.expo?.ios?.infoPlist;
  if (iosPermissions?.NSCameraUsageDescription) {
    console.log('  ✅ iOS camera permission configured');
  } else {
    console.log('  ❌ iOS camera permission not configured');
  }
  
  if (iosPermissions?.NSPhotoLibraryUsageDescription) {
    console.log('  ✅ iOS photo library permission configured');
  } else {
    console.log('  ❌ iOS photo library permission not configured');
  }
  
  // Check Android permissions
  const androidPermissions = appJson.expo?.android?.permissions;
  if (androidPermissions?.includes('android.permission.CAMERA')) {
    console.log('  ✅ Android camera permission configured');
  } else {
    console.log('  ❌ Android camera permission not configured');
  }
  
  // Check plugins
  const plugins = appJson.expo?.plugins || [];
  const hasExpoCamera = plugins.some(plugin => 
    plugin === 'expo-camera' || 
    (Array.isArray(plugin) && plugin[0] === 'expo-camera')
  );
  
  if (hasExpoCamera) {
    console.log('  ✅ Expo camera plugin configured');
  } else {
    console.log('  ❌ Expo camera plugin not configured');
  }
  
  // Check OCR settings
  const ocrSettings = appJson.expo?.extra?.ocrSettings;
  if (ocrSettings) {
    console.log('  ✅ OCR settings configured');
    console.log(`      - Debug mode: ${ocrSettings.enableDebugMode}`);
    console.log(`      - Preferred language: ${ocrSettings.preferredLanguage}`);
    console.log(`      - Minimum confidence: ${ocrSettings.minimumConfidence}`);
  } else {
    console.log('  ❌ OCR settings not configured');
  }
  
} catch (error) {
  console.log('  ❌ Error checking app configuration:', error.message);
}

// Test 4: Check TypeScript configuration
console.log('\n🔧 Testing TypeScript Configuration...');
try {
  const tsConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  
  if (tsConfig.compilerOptions?.paths?.['@/*']) {
    console.log('  ✅ TypeScript path mapping configured');
  } else {
    console.log('  ❌ TypeScript path mapping not configured');
  }
  
  if (tsConfig.compilerOptions?.strict) {
    console.log('  ✅ TypeScript strict mode enabled');
  } else {
    console.log('  ⚠️  TypeScript strict mode not enabled');
  }
  
} catch (error) {
  console.log('  ❌ Error checking TypeScript configuration:', error.message);
}

// Test 5: Check file imports and exports
console.log('\n🔗 Testing File Imports and Exports...');
try {
  // Check if MLKitOCR exports the class
  const mlkitContent = fs.readFileSync('services/native/MLKitOCR.ts', 'utf8');
  if (mlkitContent.includes('export class MLKitOCR')) {
    console.log('  ✅ MLKitOCR class exported');
  } else {
    console.log('  ❌ MLKitOCR class not exported');
  }
  
  // Check if VisionKitOCR exports the class
  const visionkitContent = fs.readFileSync('services/native/VisionKitOCR.ts', 'utf8');
  if (visionkitContent.includes('export class VisionKitOCR')) {
    console.log('  ✅ VisionKitOCR class exported');
  } else {
    console.log('  ❌ VisionKitOCR class not exported');
  }
  
  // Check if ocrService exports the singleton
  const ocrServiceContent = fs.readFileSync('services/ocrService.ts', 'utf8');
  if (ocrServiceContent.includes('export const ocrService')) {
    console.log('  ✅ ocrService singleton exported');
  } else {
    console.log('  ❌ ocrService singleton not exported');
  }
  
  // Check if real OCR library is being imported
  if (mlkitContent.includes('react-native-mlkit-ocr')) {
    console.log('  ✅ Real OCR library imported in MLKitOCR');
  } else {
    console.log('  ❌ Real OCR library not imported in MLKitOCR');
  }
  
} catch (error) {
  console.log('  ❌ Error checking file imports:', error.message);
}

// Test 6: Compile check
console.log('\n🏗️  Testing TypeScript Compilation...');
try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  console.log('  ✅ TypeScript compilation successful');
} catch (error) {
  console.log('  ❌ TypeScript compilation errors detected');
  console.log('  💡 Check the TypeScript errors above for details');
}

// Final recommendations
console.log('\n📋 Recommendations:');
console.log('─'.repeat(50));

console.log('🔨 For Development Testing:');
console.log('  • Run: npx expo run:ios (for iOS with real OCR)');
console.log('  • Run: npx expo run:android (for Android with real OCR)');
console.log('  • Note: Expo Go will use fallback OCR only');

console.log('\n🚀 For Production Build:');
console.log('  • Run: eas build --platform ios');
console.log('  • Run: eas build --platform android');
console.log('  • Test with TestFlight/Internal Testing');

console.log('\n🐛 For Debugging OCR Issues:');
console.log('  • Enable debug mode in the app');
console.log('  • Check device console logs');
console.log('  • Use the OCR test functions in the app');
console.log('  • Verify image quality and lighting');

console.log('\n✅ Test Suite Complete!');
console.log('='.repeat(50)); 