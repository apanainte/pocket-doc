# Pocket Doc - Installation Guide

## 🚨 Important: Expo Managed Workflow Compatibility

This app is designed for **Expo Managed Workflow** and is fully compatible with **Expo Go**. All dependencies have been carefully selected to work within Expo's managed environment.

## ⚠️ Dependency Compatibility Issues

### Fixed Issues
The following problematic dependencies have been **removed** and replaced with compatible alternatives:

#### ❌ Removed: `@react-native-ml-kit/text-recognition`
- **Problem**: Requires native code compilation, incompatible with Expo managed workflow
- **Solution**: Replaced with simulation-based OCR service
- **Impact**: OCR functionality works in development with intelligent mock data

### Current Dependencies Status ✅

All current dependencies are **Expo managed workflow compatible**:

```json
{
  "@expo-google-fonts/inter": "^0.4.1",           // ✅ Expo compatible
  "@expo/vector-icons": "^14.1.0",                // ✅ Expo compatible
  "@react-native-async-storage/async-storage": "^2.1.2", // ✅ Expo compatible
  "@react-navigation/bottom-tabs": "^7.3.10",     // ✅ Expo compatible
  "@react-navigation/native": "^7.0.14",          // ✅ Expo compatible
  "expo": "53.0.19",                              // ✅ Expo SDK
  "expo-camera": "~16.1.10",                     // ✅ Expo module
  "expo-document-picker": "^13.1.6",             // ✅ Expo module
  "expo-file-system": "^18.1.11",                // ✅ Expo module
  "expo-image-picker": "^16.1.4",                // ✅ Expo module
  "expo-local-authentication": "~16.0.5",        // ✅ Expo module
  "expo-secure-store": "~14.2.3",                // ✅ Expo module
  "expo-sqlite": "~15.2.14",                     // ✅ Expo module
  "react-native-gesture-handler": "~2.24.0",     // ✅ Expo compatible
  "react-native-reanimated": "~3.17.4",          // ✅ Expo compatible
  "react-native-svg": "^15.11.2"                 // ✅ Expo compatible
}
```

## 🛠️ Quick Installation

### 1. Prerequisites Check
```bash
# Check Node.js version (should be 18+)
node --version

# Check if Expo CLI is installed
expo --version

# Install Expo CLI if not present
npm install -g @expo/cli
```

### 2. Clone and Install
```bash
git clone <repository-url>
cd pocket-doc
npm install
```

### 3. Verify Installation
```bash
# Start the development server
npm run dev

# Should start without errors and show QR code
```

## 📱 Testing on Device

### Option 1: Expo Go (Recommended)
1. Install Expo Go from app store
2. Scan QR code from terminal
3. App loads directly on device

### Option 2: Development Build
If you need native modules in the future:
```bash
# Install EAS CLI
npm install -g eas-cli

# Create development build
eas build --profile development --platform ios
```

## 🔧 OCR Implementation Details

### Current Implementation
- **iOS**: VisionKit simulation with contextual mock data
- **Android**: ML Kit simulation with enhanced content detection
- **Web**: Basic OCR simulation

### Mock Data Intelligence
The OCR service provides intelligent mock data based on image analysis:
- **Receipts**: Store receipt format with items and totals
- **Business Cards**: Contact information format
- **ID Cards**: Library card format with barcodes
- **Documents**: Generic document text structure

### Production OCR Integration
For production builds with real OCR:
1. Switch to **Expo Development Build**
2. Add native OCR modules
3. Configure platform-specific OCR services

## 🚀 Development Workflow

### 1. Start Development Server
```bash
npm run dev
```

### 2. Test on Multiple Platforms
```bash
# iOS simulator (macOS only)
npm run dev
# Press 'i' in terminal

# Android emulator
npm run dev
# Press 'a' in terminal

# Web browser
npm run dev
# Press 'w' in terminal
```

### 3. Build for Production
```bash
# Preview build
eas build --profile preview

# Production build
eas build --profile production
```

## 🐛 Common Installation Issues

### Issue 1: Metro bundler errors
```bash
# Clear Metro cache
npx expo start --clear

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Issue 2: iOS simulator not working
```bash
# Install Xcode command line tools
sudo xcode-select --install

# Open Xcode and accept license
sudo xcodebuild -license accept
```

### Issue 3: Android emulator issues
```bash
# Set Android environment variables
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/platform-tools

# List available emulators
emulator -list-avds

# Start specific emulator
emulator @Pixel_4_API_30
```

### Issue 4: Permission errors on macOS
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

## 📊 Dependency Analysis

### Safe Dependencies (Expo Compatible)
- All `expo-*` packages
- `@react-navigation/*` packages
- `react-native-gesture-handler`
- `react-native-reanimated`
- `react-native-svg`
- `@react-native-async-storage/async-storage`

### Avoid These Dependencies
- `@react-native-ml-kit/*` (requires native code)
- `react-native-vision-camera` (requires native code)
- `react-native-camera` (deprecated)
- Any package requiring native linking

## 🔄 Migration from Problematic Dependencies

If you encounter apps using incompatible dependencies:

### 1. Identify Problematic Packages
```bash
# Check for native dependencies
expo doctor

# Look for packages requiring native code
npm ls --depth=0 | grep -E "(ml-kit|vision-camera|native-)"
```

### 2. Replace with Expo Alternatives
- Camera: Use `expo-camera` instead of `react-native-camera`
- Image Picker: Use `expo-image-picker`
- File System: Use `expo-file-system`
- Storage: Use `expo-secure-store` or `@react-native-async-storage/async-storage`

### 3. Update Configuration
Remove native plugins from `app.json`:
```json
{
  "plugins": [
    // Remove problematic plugins
    // "react-native-vision-camera"
  ]
}
```

## 📞 Support

### Getting Help
1. **Expo Documentation**: https://docs.expo.dev/
2. **Expo Discord**: https://discord.gg/expo
3. **React Native Docs**: https://reactnative.dev/docs/getting-started
4. **Stack Overflow**: Tag with `expo` and `react-native`

### Reporting Issues
When reporting issues, include:
- Node.js version (`node --version`)
- Expo CLI version (`expo --version`)
- Platform (iOS/Android/Web)
- Error messages and stack traces
- Steps to reproduce

## ✅ Verification Checklist

Before considering installation complete:

- [ ] Node.js 18+ installed
- [ ] Expo CLI installed globally
- [ ] Dependencies installed without errors
- [ ] Development server starts successfully
- [ ] App loads in Expo Go
- [ ] Camera permissions work
- [ ] Document upload functionality works
- [ ] OCR simulation provides mock data
- [ ] Database operations work
- [ ] Authentication flow works

## 🎯 Next Steps

After successful installation:
1. Test all core features
2. Customize app configuration
3. Add your own assets and branding
4. Configure for production builds
5. Set up CI/CD pipeline
6. Plan for app store submission

---

**Note**: This installation guide ensures compatibility with Expo's managed workflow. For native module requirements, consider migrating to Expo Development Build or React Native CLI. 