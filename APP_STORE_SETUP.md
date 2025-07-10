# 🚀 Pocket Doc - App Store TestFlight Setup Guide

## 📱 **Prerequisites**

### 1. **Apple Developer Account**
- [ ] Enroll in Apple Developer Program ($99/year)
- [ ] Access to App Store Connect
- [ ] Valid Apple ID

### 2. **App Store Connect Setup**
- [ ] Create new app in App Store Connect
- [ ] Note down the App ID (e.g., `1234567890`)
- [ ] Note down your Team ID (found in Apple Developer account)

### 3. **Local Setup**
- [ ] EAS CLI installed and logged in ✅
- [ ] Project configured for EAS Build ✅
- [ ] App icons and splash screens ready

## 🎯 **Step-by-Step Process**

### **Step 1: Update App Store Connect Information**

1. **Get your App Store Connect App ID:**
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Create a new app or select existing
   - Note the App ID (numeric)

2. **Get your Apple Team ID:**
   - Go to [Apple Developer](https://developer.apple.com)
   - Account → Membership → Team ID

3. **Update `eas.json`:**
   ```json
   "submit": {
     "production": {
       "ios": {
         "appleId": "your-apple-id@email.com",
         "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",
         "appleTeamId": "YOUR_APPLE_TEAM_ID"
       }
     }
   }
   ```

### **Step 2: Prepare App Assets**

#### **Required App Store Assets:**
- [ ] **App Icon**: 1024x1024 PNG
- [ ] **Splash Screen**: 1242x2688 PNG
- [ ] **Screenshots**: 
  - iPhone 6.7" (1290x2796)
  - iPhone 6.5" (1242x2688)
  - iPhone 5.5" (1242x2208)
  - iPad Pro 12.9" (2048x2732)

#### **App Store Metadata:**
- [ ] **App Name**: "Pocket Doc"
- [ ] **Subtitle**: "Document Management Made Simple"
- [ ] **Description**: 
  ```
  Pocket Doc is your personal document management companion. 
  
  Features:
  • Upload documents via camera or photo library
  • AI-powered document analysis and tagging
  • Secure local storage with biometric protection
  • Beautiful Revolut-inspired interface
  • Dark/Light mode support
  • Search and organize your documents easily
  
  Perfect for storing receipts, contracts, IDs, and any important documents.
  ```
- [ ] **Keywords**: document,management,scanner,organizer,secure,ai
- [ ] **Category**: Productivity
- [ ] **Age Rating**: 4+

### **Step 3: Build for TestFlight**

```bash
# Build for iOS TestFlight
eas build --platform ios --profile production

# Monitor build progress
eas build:list
```

### **Step 4: Submit to TestFlight**

```bash
# Submit the latest build to TestFlight
eas submit --platform ios --latest
```

### **Step 5: App Store Connect Setup**

1. **App Information:**
   - [ ] Set app name and subtitle
   - [ ] Upload app icon
   - [ ] Set category and age rating
   - [ ] Add privacy policy URL

2. **Screenshots:**
   - [ ] Upload screenshots for all device sizes
   - [ ] Add app preview videos (optional)

3. **App Review Information:**
   - [ ] Add demo account credentials
   - [ ] Add review notes explaining app features

4. **TestFlight:**
   - [ ] Add internal testers
   - [ ] Add external testers (optional)
   - [ ] Submit for Beta App Review

## 🔧 **Build Commands**

```bash
# Development build (for testing)
eas build --platform ios --profile development

# Preview build (for internal testing)
eas build --platform ios --profile preview

# Production build (for TestFlight)
eas build --platform ios --profile production

# Submit to TestFlight
eas submit --platform ios --latest

# View build status
eas build:list
```

## 📋 **Checklist Before Submission**

### **App Configuration:**
- [ ] App version and build number set correctly
- [ ] Bundle identifier matches App Store Connect
- [ ] All required permissions configured
- [ ] App icons and splash screens ready
- [ ] Privacy policy URL added

### **Testing:**
- [ ] App works on iOS simulator
- [ ] App works on physical device
- [ ] All features tested (upload, search, theme switching)
- [ ] No crashes or major bugs
- [ ] Performance is acceptable

### **App Store Connect:**
- [ ] App created in App Store Connect
- [ ] App ID and Team ID configured in eas.json
- [ ] App metadata prepared
- [ ] Screenshots ready for all device sizes

## 🚨 **Common Issues & Solutions**

### **Build Failures:**
```bash
# Clear cache and rebuild
expo r -c
eas build --platform ios --profile production --clear-cache
```

### **Submission Issues:**
```bash
# Check submission status
eas submit --platform ios --latest --verbose
```

### **App Store Connect Issues:**
- Ensure app is in "Ready to Submit" state
- Check that all required metadata is filled
- Verify app icon meets requirements

## 📞 **Support**

- **EAS Build Issues**: [EAS Documentation](https://docs.expo.dev/build/introduction/)
- **App Store Connect**: [Apple Developer Documentation](https://developer.apple.com/app-store/)
- **TestFlight**: [TestFlight Guide](https://developer.apple.com/testflight/)

---

**Next Steps:**
1. Update `eas.json` with your App Store Connect details
2. Prepare app assets (icons, screenshots)
3. Run production build
4. Submit to TestFlight
5. Configure App Store Connect
6. Submit for review

Good luck with your TestFlight submission! 🎉 