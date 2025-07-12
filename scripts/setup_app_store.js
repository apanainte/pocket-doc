#!/usr/bin/env node

const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Pocket Doc - App Store Connect Setup\n');

// Read current configuration
const easConfig = JSON.parse(fs.readFileSync('eas.json', 'utf8'));
const appConfig = JSON.parse(fs.readFileSync('app.json', 'utf8'));

console.log('📋 Current Configuration:');
console.log(`   Bundle ID: ${appConfig.expo.ios.bundleIdentifier}`);
console.log(`   App Name: ${appConfig.expo.name}`);
console.log(`   Apple ID: ${easConfig.submit.production.ios.appleId}`);
console.log(`   Team ID: ${easConfig.submit.production.ios.appleTeamId}`);
console.log(`   App Store App ID: ${easConfig.submit.production.ios.ascAppId}`);

console.log('\n🔍 App Store Connect App ID Detection:');

if (easConfig.submit.production.ios.ascAppId === 'your-app-store-connect-app-id') {
  console.log('   ❌ App Store App ID not set');
  console.log('\n📱 To find or create your App Store Connect App ID:');
  
  console.log('\n   1️⃣  Go to App Store Connect:');
  console.log('      https://appstoreconnect.apple.com');
  
  console.log('\n   2️⃣  Check if "Pocket Doc" app exists:');
  console.log('      - Click "My Apps"');
  console.log('      - Look for "Pocket Doc"');
  console.log('      - If found, click it and note the App ID from URL');
  
  console.log('\n   3️⃣  If app doesn\'t exist, create it:');
  console.log('      - Click the "+" button');
  console.log('      - Select "New App"');
  console.log('      - Fill in:');
  console.log('        • Name: Pocket Doc');
  console.log('        • Bundle ID: com.pocketdoc.app');
  console.log('        • SKU: pocket-doc-ios');
  console.log('        • User Access: Full Access');
  console.log('      - Click "Create"');
  console.log('      - Note the App ID (numeric)');
  
  console.log('\n   4️⃣  The App ID appears in the URL:');
  console.log('      https://appstoreconnect.apple.com/apps/[APP_ID]/...');
  
  rl.question('\n🎯 Enter your App Store Connect App ID (or press Enter to skip): ', (appId) => {
    if (appId && appId.trim() !== '') {
      // Update eas.json with the App ID
      easConfig.submit.production.ios.ascAppId = appId.trim();
      fs.writeFileSync('eas.json', JSON.stringify(easConfig, null, 2));
      
      console.log(`\n✅ Updated eas.json with App ID: ${appId.trim()}`);
      console.log('\n🚀 Ready to build! Run:');
      console.log('   eas build --platform ios --profile production');
    } else {
      console.log('\n⚠️  App ID not provided. You\'ll need to update eas.json manually.');
      console.log('   Update the "ascAppId" field in eas.json with your App Store Connect App ID.');
    }
    
    rl.close();
  });
} else {
  console.log(`   ✅ App Store App ID: ${easConfig.submit.production.ios.ascAppId}`);
  console.log('\n🚀 Ready to build! Run:');
  console.log('   eas build --platform ios --profile production');
  rl.close();
} 