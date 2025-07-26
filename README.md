# 📱 PocketDoc - Intelligent Document Manager

An AI-powered mobile document management app built with React Native that allows users to scan, organize, and search their documents using advanced OCR and metadata generation.

## 🚀 Features

- **Professional Document Scanning** - High-quality document capture with edge detection and perspective correction
- **AI-Powered OCR** - Extract text from documents using MLKit OCR
- **Smart Metadata Generation** - Automatically generate descriptions and tags for documents
- **Intelligent Search** - Search documents by content, tags, or metadata
- **Expandable Text Display** - Show more/less functionality for long text content
- **Dark Mode UI** - Consistent dark theme across all screens
- **Secure Storage** - Encrypted local storage for sensitive documents

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** - Package manager
- **React Native CLI** - `npm install -g react-native-cli`
- **Expo CLI** - `npm install -g @expo/cli`

### iOS Development (macOS only)

- **Xcode** (v14 or higher) - [Download from Mac App Store](https://apps.apple.com/us/app/xcode/id497799835)
- **iOS Simulator** - Included with Xcode
- **CocoaPods** - `sudo gem install cocoapods`

### Android Development (Optional)

- **Android Studio** - [Download here](https://developer.android.com/studio)
- **Android SDK** - Install via Android Studio
- **Java JDK** (v11 or higher)

## 📦 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/apanainte/pocket-doc.git
cd pocket-doc
```

### 2. Install Dependencies

```bash
# Install npm dependencies
npm install

# Install iOS dependencies (macOS only)
cd ios && pod install && cd ..
```

### 3. Environment Setup

Create a `.env` file in the root directory (if needed):

```bash
# Add any environment variables here
# API_BASE_URL=https://your-api-url.com
```

## 🏃‍♂️ Running the App

### iOS (Physical Device - Recommended)

1. **Connect your iPhone** via USB
2. **Enable Developer Mode** on your iPhone:
   - Settings → Privacy & Security → Developer Mode → Enable
3. **Trust your Mac** if prompted
4. **Run the app**:

```bash
# Start Metro bundler
npm start

# In another terminal, run on device
npx expo run:ios --device
```

### iOS (Simulator)

```bash
# Start Metro bundler
npm start

# In another terminal, run on simulator
npm run ios
# or
npx expo run:ios --simulator
```

### Android

```bash
# Start Metro bundler
npm start

# In another terminal, run on device/emulator
npm run android
# or
npx expo run:android
```

## 📁 Project Structure

```
pocket-doc/
├── app/                    # App screens and navigation
│   ├── (tabs)/            # Tab-based navigation screens
│   └── _layout.tsx        # Root layout component
├── components/             # Reusable UI components
│   ├── ui/                # UI component library
│   │   ├── ExpandableText.tsx
│   │   ├── RevolutButton.tsx
│   │   └── ...
│   ├── DocumentCard.tsx
│   └── DocumentDetailModal.tsx
├── contexts/              # React contexts for state management
├── hooks/                 # Custom React hooks
├── services/              # Business logic and API services
│   ├── native/           # Native module interfaces
│   ├── ocrService.ts     # OCR functionality
│   ├── database.ts       # Local database operations
│   └── ...
├── themes/               # App theming and styling
├── types/                # TypeScript type definitions
├── tests/                # Test files
└── docs/                 # Documentation
```

## 🔧 Development

### Available Scripts

```bash
# Start development server
npm start

# Run on iOS device
npm run ios

# Run on Android
npm run android

# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

### Key Components

- **DocumentScannerService** - Professional document scanning with edge detection
- **OCR Service** - Text extraction using MLKit
- **ExpandableText** - Smart text truncation with show more/less functionality
- **Document Management** - CRUD operations for documents
- **AI Metadata Generation** - Automatic description and tag generation

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e
```

### Test Structure

- `tests/unit/` - Unit tests for components and services
- `tests/integration/` - Integration tests for workflows
- `tests/e2e/` - End-to-end tests for user scenarios

## 🚀 Deployment

### iOS App Store

1. **Update version** in `app.json`
2. **Build for production**:
   ```bash
   npx expo build:ios
   ```
3. **Submit to App Store** via App Store Connect

### Android Play Store

1. **Update version** in `app.json`
2. **Build for production**:
   ```bash
   npx expo build:android
   ```
3. **Submit to Play Store** via Google Play Console

## 🔍 Troubleshooting

### Common Issues

#### Metro bundler port conflict
```bash
# Kill process on port 8081
lsof -ti:8081 | xargs kill -9
npm start -- --reset-cache
```

#### iOS build errors
```bash
# Clean build cache
rm -rf ios/build ios/DerivedData
cd ios && pod install && cd ..
```

#### Android build errors
```bash
# Clean Android build
cd android && ./gradlew clean && cd ..
```

#### CocoaPods issues
```bash
# Update CocoaPods
cd ios
pod repo update
pod install
cd ..
```

### Architecture Issues on M1/M2 Macs

If you encounter architecture errors with simulators:

```bash
# Use physical device instead of simulator
npx expo run:ios --device

# Or force arm64 architecture
sudo arch -arm64 gem install ffi
cd ios && arch -arm64 pod install && cd ..
```

## 📱 Device Requirements

### iOS
- **iOS 14.0+** 
- **iPhone 8** or newer recommended
- **Camera permissions** required for document scanning

### Android
- **Android 8.0 (API 26)+**
- **Camera permissions** required
- **Storage permissions** required

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue on GitHub
- Contact the development team
- Check the troubleshooting section above

---

**Happy Coding!** 🎉 