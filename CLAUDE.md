# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pocket Doc is a React Native mobile app built with Expo that provides document management with OCR (Optical Character Recognition) capabilities. The app allows users to upload documents, extract text using OCR, generate AI-powered metadata, and search through their document library.

## Development Commands

### Core Development
```bash
npm run dev              # Start Expo development server (no telemetry)
npm start               # Start Expo development server
npm run start:clear     # Start with cleared cache
npm run ios             # Run on iOS simulator
npm run android         # Run on Android emulator
npm run web             # Run web version
```

### Building & Deployment
```bash
npm run build:web       # Export web build
npm run build:ios       # Build iOS with EAS
npm run build:android   # Build Android with EAS
npm run build:all       # Build for all platforms
npm run build:preview   # Build preview version
npm run submit:ios      # Submit to iOS App Store
npm run submit:android  # Submit to Google Play
```

### Testing
```bash
npm test                # Run Python test suite
npm run test:ocr        # Test OCR integration specifically
npm run test:startup    # Test app startup process
npm run test:ocr-integration  # Test OCR integration with Node.js
```

### Quality & Maintenance
```bash
npm run lint            # Run Expo linter
npm run clean           # Clean install (remove node_modules)
npm run clean:cache     # Clear Expo cache
```

### Setup & Configuration
```bash
npm run setup:appstore  # Configure App Store Connect
npm run setup:ocr       # Setup OCR configuration
npm run find:appid      # Find App Store app ID
npm run verify:phase1   # Verify Phase 1 implementation
```

## Architecture

### Technology Stack
- **Framework**: React Native with Expo SDK 53
- **Language**: TypeScript with strict mode
- **Navigation**: Expo Router (file-based routing)
- **State Management**: React Context (planned migration to Redux Toolkit)
- **Database**: SQLite (expo-sqlite)
- **OCR**: ML Kit (Android/iOS) with VisionKit fallback
- **Authentication**: Biometric authentication (Face ID/Fingerprint)
- **Storage**: Expo SecureStore for sensitive data
- **Monitoring**: Sentry integration for error tracking

### Project Structure
```
app/                    # Expo Router screens (file-based routing)
├── (tabs)/            # Tab navigation group
│   ├── index.tsx      # Home screen (document list)
│   ├── upload.tsx     # Document upload
│   ├── search.tsx     # Search functionality
│   └── profile.tsx    # User profile/settings
└── _layout.tsx        # Root layout with providers

components/            # Reusable UI components
├── ui/               # Basic UI components (RevolutButton, RevolutCard, etc.)
├── DocumentCard.tsx  # Document display component
├── DocumentDetailModal.tsx
├── AuthScreen.tsx
└── ErrorBoundary.tsx

services/             # Business logic layer
├── native/          # Platform-specific implementations
│   ├── VisionKitOCR.ts    # iOS OCR
│   └── MLKitOCR.ts        # Android OCR
├── ocrService.ts    # Main OCR service (singleton)
├── database.ts      # SQLite operations
├── auth.ts          # Authentication service
├── fileStorage.ts   # File system operations
├── aiMetadata.ts    # AI-powered metadata generation
└── monitoring.ts    # Error tracking and performance

contexts/            # React Context providers
├── AppContext.tsx   # Main application state
└── ThemeContext.tsx # Theme and styling

hooks/               # Custom React hooks
├── useDocuments.ts  # Document management
└── useFrameworkReady.ts # App initialization

types/               # TypeScript definitions
└── document.ts      # Document-related types

themes/              # Design system
├── colors.ts        # Color palette
└── typography.ts    # Typography scale
```

### Key Architectural Patterns
- **Clean Architecture**: Clear separation between UI, business logic, and data layers
- **Singleton Pattern**: Used for services (OCRService, DatabaseService)
- **Provider Pattern**: React Context for state management
- **Service Layer**: Business logic abstracted from UI components
- **Platform Abstraction**: Native platform differences handled in service layer

## OCR System

The OCR (Optical Character Recognition) system is a core feature with platform-specific implementations:

### OCR Service Architecture
- **Primary Engine**: ML Kit OCR for both iOS and Android
- **Fallback**: VisionKit for iOS (when ML Kit unavailable)
- **Development**: Simulation mode for Expo Go compatibility
- **Integration**: Singleton service pattern for consistent state

### Cloud OCR Usage (Recommended)
```typescript
import { enhancedOCRService } from '@/services/cloud';

// Initialize enhanced OCR service with cloud providers
await enhancedOCRService.initialize({
  useCloudOCR: true,
  primaryProvider: 'openai',
  openaiApiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  enableLocalFallback: true,
  enhancedMetadata: true
});

// Process image for enhanced text extraction and metadata
const result = await enhancedOCRService.recognizeText(imageUri, {
  language: 'en',
  recognitionLevel: 'accurate',
  minimumConfidence: 0.7
});

// Access enhanced features
console.log(result.enhancedMetadata); // AI-generated metadata
console.log(result.qualityScore);     // Processing quality score
console.log(result.provider);         // Provider used (openai/local)
```

### Legacy OCR Usage (Fallback)
```typescript
import { ocrService } from '@/services';

// Initialize OCR service
await ocrService.initialize();

// Process image for text extraction
const result = await ocrService.processImage(imageUri, {
  language: 'en',
  enablePreprocessing: true
});
```

### Cloud OCR Configuration
Enhanced OCR settings are configured in `app.json`:
```json
"cloudOCRSettings": {
  "enableCloudOCR": true,
  "primaryProvider": "openai",
  "enableLocalFallback": true,
  "enhancedMetadata": true,
  "confidenceThreshold": 0.7,
  "maxRetries": 3,
  "timeout": 30000,
  "enableQualityAnalysis": true
},
"ocrSettings": {
  "enableDebugMode": false,
  "preferredLanguage": "en",
  "minimumConfidence": 0.7,
  "enableImagePreprocessing": true
}
```

## Development Guidelines

### Code Style & Conventions
- **TypeScript**: Strict mode enabled, use proper type definitions
- **File Naming**: PascalCase for components, camelCase for services
- **Imports**: External libraries first, then internal modules
- **Path Aliases**: Use `@/` for absolute imports (configured in tsconfig.json)

### Component Development
1. Create reusable components in `components/` directory
2. Use TypeScript interfaces for props
3. Follow existing UI component patterns (see `components/ui/`)
4. Implement proper accessibility (ARIA labels)

### Service Development
1. Implement singleton pattern for stateful services
2. Use clean architecture principles
3. Handle platform differences in service layer
4. Provide comprehensive error handling
5. Export from `services/index.ts`

### Testing Strategy
- **Unit Tests**: Individual functions and components
- **Integration Tests**: Service interactions
- **E2E Tests**: Complete user workflows
- **OCR Tests**: Specific OCR functionality testing
- **Cloud OCR Tests**: Cloud provider integration testing

## Database Schema

The app uses SQLite with the following main entities:
- **Documents**: Core document metadata and file references
- **OCR Results**: Extracted text and confidence scores
- **AI Metadata**: Generated tags, categories, and summaries

## Security Considerations

- **Biometric Authentication**: Face ID/Fingerprint for app access
- **Local Storage**: All data stored locally (no cloud dependencies)
- **File Validation**: Comprehensive file validation before processing
- **Secure Storage**: Sensitive data stored in Expo SecureStore
- **Privacy**: Full privacy-first approach with local processing

## Common Development Tasks

### Adding New Screen
1. Create `.tsx` file in `app/` directory (file-based routing)
2. Export default React component
3. Add to tab navigation in `app/(tabs)/_layout.tsx` if needed

### Adding New Service
1. Create service file in `services/` directory
2. Implement singleton pattern if stateful
3. Add TypeScript interfaces
4. Export from `services/index.ts`
5. Add comprehensive error handling

### Platform-Specific Code
Use platform checks for platform-specific implementations:
```typescript
import { Platform } from 'react-native';

if (Platform.OS === 'ios') {
  // iOS-specific code
} else if (Platform.OS === 'android') {
  // Android-specific code
}
```

## Error Handling & Monitoring

- **Error Boundary**: Global error boundary in root layout
- **Sentry Integration**: Error tracking and performance monitoring
- **Service-Level**: Comprehensive error handling in all services
- **User Feedback**: User-friendly error messages

## Performance Considerations

- **OCR Processing**: Asynchronous with progress indicators
- **Image Handling**: Proper image optimization and cleanup
- **State Management**: Context optimization to prevent unnecessary re-renders
- **Database**: Efficient SQLite queries with proper indexing

## Dependencies Management

### Expo Compatibility
All dependencies are Expo managed workflow compatible. Key considerations:
- Use Expo modules when available
- Avoid native code dependencies
- Test compatibility with Expo Go for development

### Critical Dependencies
- `expo`: SDK 53 (core framework)
- `expo-router`: File-based navigation
- `expo-sqlite`: Local database
- `react-native-mlkit-ocr`: OCR functionality
- `expo-local-authentication`: Biometric auth
- `@sentry/react-native`: Error monitoring

## Build Configuration

### EAS Build
- **iOS**: Uses App Store Connect with ascAppId: 6748480585
- **Resource Class**: m-medium for both platforms
- **Profiles**: Production and preview builds configured

### App Configuration
- **Bundle ID**: com.pocketdoc.app
- **Version**: 1.0.1 (iOS build number: 2)
- **Deployment Target**: iOS 13.0+, Android API 21+
- **New Architecture**: Enabled for React Native

## Privacy & Permissions

### iOS Permissions
- Camera: Document photo capture
- Photo Library: Image selection
- Face ID: Biometric authentication

### Android Permissions
- Camera, Storage, Biometric authentication
- All processing done locally for privacy

## Troubleshooting

### Common Issues
1. **OCR Not Working**: Check platform-specific implementations
2. **Build Failures**: Verify EAS configuration and dependencies
3. **Performance Issues**: Check Context usage and re-renders
4. **Database Issues**: Verify SQLite initialization

### Debug Commands
```bash
npm run test:startup         # Debug app initialization
npm run test:ocr            # Debug legacy OCR functionality
npm run test:cloud-ocr      # Test cloud OCR configuration and providers
npm run test:cloud-ocr:help # Get help for cloud OCR testing
npm run verify:phase1       # Verify core implementation
```

## Documentation

Additional documentation available in `docs/` directory:
- `ARCHITECTURE.md`: Detailed architectural decisions
- `PROJECT_STRUCTURE.md`: Complete project structure guide
- `INSTALLATION_GUIDE.md`: Setup and installation instructions
- `APP_STORE_SETUP.md`: App Store submission guide
- `CLOUD_OCR_SETUP.md`: Cloud OCR integration and setup guide