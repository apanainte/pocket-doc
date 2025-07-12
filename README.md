# Pocket Doc - Document Management App

A React Native app built with Expo for managing personal documents with OCR capabilities and secure local storage.

## 🚀 Features

- **Document Upload**: Upload documents via camera or photo library
- **OCR Text Recognition**: Extract text from images using platform-specific OCR
- **Smart Metadata**: AI-powered document categorization and metadata extraction
- **Secure Storage**: Local document storage with biometric authentication
- **Search & Filter**: Find documents by content, category, or metadata
- **Cross-Platform**: Works on iOS, Android, and Web

## 📋 Prerequisites

Before installing Pocket Doc, ensure you have:

### Required Software
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Expo CLI** - Install globally: `npm install -g @expo/cli`

### Development Environment
- **Expo Go** app on your mobile device (for testing)
  - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
  - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **Xcode** (for iOS development on macOS)
- **Android Studio** (for Android development)

## 🛠️ Installation Guide

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/pocket-doc.git
cd pocket-doc
```

### 2. Install Dependencies

```bash
# Using npm
npm install

# Or using yarn
yarn install
```

### 3. Environment Setup

The app is configured for **Expo Managed Workflow** and doesn't require additional native dependencies.

### 4. Start the Development Server

```bash
# Start Expo development server
npm run dev

# Or with yarn
yarn dev
```

### 5. Run on Device/Simulator

#### Option A: Physical Device (Recommended)
1. Install **Expo Go** on your device
2. Scan the QR code shown in terminal/browser
3. The app will load on your device

#### Option B: iOS Simulator (macOS only)
1. Install Xcode from the Mac App Store
2. Press `i` in the terminal to open iOS simulator

#### Option C: Android Emulator
1. Install Android Studio
2. Set up an Android Virtual Device (AVD)
3. Press `a` in the terminal to open Android emulator

## 📱 Platform-Specific Features

### iOS
- Uses **VisionKit** for OCR text recognition
- Supports **Face ID/Touch ID** authentication
- Camera and photo library integration

### Android
- Uses **ML Kit** simulation for OCR (managed workflow compatible)
- Supports **Fingerprint** authentication
- Camera and photo library integration

### Web
- Limited OCR functionality (simulation only)
- File upload via browser
- Responsive design for desktop/mobile browsers

## 🔧 Configuration

### App Configuration
The app is configured in `app.json`:
- App name, version, and icons
- Platform-specific settings
- Permissions and capabilities

### Build Configuration
EAS Build is configured in `eas.json` for:
- Preview builds (internal distribution)
- Production builds (app store submission)

## 🏗️ Building for Production

### Prerequisites for Building
- **EAS CLI**: `npm install -g eas-cli`
- **Expo account**: Sign up at [expo.dev](https://expo.dev)

### Build Commands

```bash
# Build for iOS
npm run build:ios

# Build for Android
npm run build:android

# Build for both platforms
npm run build:all
```

### App Store Submission

```bash
# Submit to iOS App Store
npm run submit:ios

# Submit to Google Play Store
npm run submit:android
```

## 🧪 Testing

### Run Tests
```bash
# Run integration tests
cd tests
python run_tests.py

# Run specific test
python test_use_case_1_upload.py
```

### Test Coverage
- Document upload functionality
- OCR text extraction
- Metadata generation
- Search and filtering
- Authentication flows

## 🔒 Security & Privacy

### Data Storage
- All documents stored locally on device
- No cloud storage or external data transmission
- SQLite database with encrypted sensitive data

### Authentication
- Biometric authentication (Face ID/Touch ID/Fingerprint)
- Secure local storage for authentication tokens
- Optional passcode fallback

### Permissions
- **Camera**: For document photography
- **Photo Library**: For selecting existing images
- **Biometric**: For secure authentication

## 🐛 Troubleshooting

### Common Issues

#### 1. "Module not found" errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 2. Metro bundler issues
```bash
# Reset Metro cache
npx expo start --clear
```

#### 3. iOS simulator not opening
```bash
# Ensure Xcode is installed and simulator is available
sudo xcode-select --install
```

#### 4. Android emulator issues
```bash
# Ensure Android SDK is properly configured
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

#### 5. OCR not working
The app uses simulation mode for OCR in development:
- iOS: VisionKit simulation with contextual mock data
- Android: ML Kit simulation with enhanced content detection
- For production builds, native OCR modules would be integrated

### Getting Help

1. Check the [Expo documentation](https://docs.expo.dev/)
2. Review [React Native documentation](https://reactnative.dev/docs/getting-started)
3. Search existing issues in the repository
4. Create a new issue with detailed error information

## 📚 Project Structure

```
pocket-doc/
├── app/                    # App screens and navigation
├── components/             # Reusable UI components
├── contexts/              # React contexts (theme, app state)
├── hooks/                 # Custom React hooks
├── services/              # Business logic and API services
├── themes/                # App theming and styles
├── types/                 # TypeScript type definitions
├── tests/                 # Test files and utilities
└── assets/                # Images, icons, and static assets
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔄 Version History

- **v1.0.0**: Initial release with basic document management and OCR
- Features: Document upload, OCR simulation, metadata extraction, search functionality

## 🌟 Roadmap

- [ ] Real OCR integration for production builds
- [ ] Document categorization improvements
- [ ] Export/import functionality
- [ ] Cloud backup options (optional)
- [ ] Advanced search filters
- [ ] Document templates
