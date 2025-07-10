#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 Searching for App Store Connect App ID...\n');

// Method 1: Try to get from App Store Connect API
try {
  console.log('📱 Method 1: Checking App Store Connect API...');
  
  // This would require Apple's App Store Connect API
  // For now, we'll provide manual steps
  console.log('   ⚠️  App Store Connect API requires manual setup');
} catch (error) {
  console.log('   ❌ API access not configured');
}

// Method 2: Check if app exists in App Store Connect
console.log('\n📋 Method 2: Manual App Store Connect Check');
console.log('   1. Go to https://appstoreconnect.apple.com');
console.log('   2. Click "My Apps"');
console.log('   3. Look for "Pocket Doc" app');
console.log('   4. If it exists, click on it and note the App ID');
console.log('   5. If it doesn\'t exist, create a new app:');

console.log('\n   📝 To create new app:');
console.log('     1. Click the "+" button');
console.log('     2. Select "New App"');
console.log('     3. Fill in the details:');
console.log('        - Name: Pocket Doc');
console.log('        - Bundle ID: com.pocketdoc.app');
console.log('        - SKU: pocket-doc-ios');
console.log('        - User Access: Full Access');
console.log('     4. Click "Create"');
console.log('     5. Note the App ID (numeric)');

// Method 3: Check bundle identifier
console.log('\n🔧 Method 3: Bundle Identifier Check');
const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
const bundleId = appJson.expo.ios.bundleIdentifier;
console.log(`   Bundle ID: ${bundleId}`);

// Method 4: Provide common patterns
console.log('\n📊 Method 4: Common App ID Patterns');
console.log('   App IDs are typically 10-digit numbers');
console.log('   Examples: 1234567890, 9876543210');
console.log('   You can find it in the URL when viewing your app:');
console.log('   https://appstoreconnect.apple.com/apps/[APP_ID]/...');

console.log('\n🎯 Next Steps:');
console.log('   1. Create/find your app in App Store Connect');
console.log('   2. Copy the App ID (numeric)');
console.log('   3. Update eas.json with the App ID');
console.log('   4. Run: eas build --platform ios --profile production');

console.log('\n💡 Pro Tip:');
console.log('   You can also run this command to update eas.json automatically:');
console.log('   node -e "const fs=require(\'fs\');const config=JSON.parse(fs.readFileSync(\'eas.json\'));config.submit.production.ios.ascAppId=\'YOUR_APP_ID\';fs.writeFileSync(\'eas.json\',JSON.stringify(config,null,2));"'); 