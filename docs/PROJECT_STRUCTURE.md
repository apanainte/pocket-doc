# Project Structure 📁

This document explains the organization of the Pocket Doc codebase to help developers understand where to find and add code.

## 🏗️ Overview

Pocket Doc follows a **feature-based architecture** with clear separation of concerns:

```
pocket-doc/
├── app/                    # 📱 App screens and navigation
├── components/             # 🧩 Reusable UI components
├── services/              # ⚙️ Business logic and data services
├── hooks/                 # 🎣 Custom React hooks
├── contexts/              # 🌐 React contexts for state management
├── types/                 # 📝 TypeScript type definitions
├── themes/                # 🎨 App styling and themes
├── assets/                # 🖼️ Images, icons, and static files
├── tests/                 # 🧪 Test files and utilities
├── docs/                  # 📚 Documentation files
└── scripts/               # 🔧 Utility scripts
```

## 📱 App Directory (`app/`)

Contains all app screens and navigation logic using **Expo Router**.

```
app/
├── _layout.tsx            # Root layout component
├── +not-found.tsx         # 404 error page
└── (tabs)/                # Tab navigation group
    ├── _layout.tsx        # Tab layout configuration
    ├── index.tsx          # Home screen (document list)
    ├── upload.tsx         # Document upload screen
    ├── search.tsx         # Search and filter screen
    └── profile.tsx        # User profile and settings
```

### Key Concepts:
- **File-based routing**: Each file becomes a route
- **Layout files**: `_layout.tsx` defines shared UI structure
- **Route groups**: `(tabs)/` creates tab navigation
- **Dynamic routes**: `[id].tsx` for parameterized routes

### Adding New Screens:
1. Create new `.tsx` file in appropriate directory
2. Export default React component
3. Add to navigation if needed

## 🧩 Components Directory (`components/`)

Reusable UI components organized by function.

```
components/
├── index.ts               # Component exports
├── AuthScreen.tsx         # Authentication screens
├── SimpleAuthScreen.tsx   # Simple auth variant
├── DocumentCard.tsx       # Document display card
├── DocumentDetailModal.tsx # Document detail modal
├── ErrorBoundary.tsx      # Error handling component
└── ui/                    # Basic UI components
    ├── RevolutButton.tsx  # Styled button component
    ├── RevolutCard.tsx    # Styled card component
    ├── RevolutInput.tsx   # Styled input component
    └── RevolutText.tsx    # Styled text component
```

### Component Guidelines:
- **Single responsibility**: Each component has one clear purpose
- **Reusability**: Components can be used across multiple screens
- **Props interface**: Clear TypeScript interfaces for all props
- **Accessibility**: ARIA labels and accessibility support

### Creating New Components:
1. Create `.tsx` file with descriptive name
2. Define props interface
3. Export component from `index.ts`
4. Add to appropriate screen

## ⚙️ Services Directory (`services/`)

Business logic and data services organized by domain.

```
services/
├── index.ts               # Service exports
├── ocrService.ts          # OCR text recognition
├── database.ts            # SQLite database operations
├── auth.ts                # Authentication service
├── fileStorage.ts         # File system operations
├── textProcessingService.ts # Text analysis and processing
├── aiMetadata.ts          # AI metadata generation
├── validation.ts          # Data validation
├── passkeyAuth.ts         # Biometric authentication
└── native/                # Platform-specific implementations
    ├── VisionKitOCR.ts    # iOS OCR implementation
    └── MLKitOCR.ts        # Android OCR implementation
```

### Service Patterns:
- **Singleton pattern**: Services maintain single instance
- **Platform abstraction**: Abstract platform differences
- **Error handling**: Comprehensive error handling
- **Async operations**: Promise-based API

### Adding New Services:
1. Create service class with clear interface
2. Implement singleton pattern if needed
3. Add comprehensive error handling
4. Export from `index.ts`
5. Add TypeScript types

## 🎣 Hooks Directory (`hooks/`)

Custom React hooks for shared logic.

```
hooks/
├── useDocuments.ts        # Document management hook
└── useFrameworkReady.ts   # Framework initialization hook
```

### Hook Guidelines:
- **Prefix with 'use'**: Follow React naming convention
- **Return object**: Return object with values and functions
- **Memoization**: Use useMemo/useCallback for performance
- **Error handling**: Handle errors gracefully

## 🌐 Contexts Directory (`contexts/`)

React contexts for global state management.

```
contexts/
├── AppContext.tsx         # Main app state context
└── ThemeContext.tsx       # Theme and styling context
```

### Context Best Practices:
- **Split contexts**: Separate concerns into different contexts
- **Provider pattern**: Wrap app with context providers
- **Type safety**: Use TypeScript for context types
- **Performance**: Minimize re-renders with proper memoization

## 📝 Types Directory (`types/`)

TypeScript type definitions for the entire app.

```
types/
└── document.ts            # Document-related types
```

### Type Organization:
- **Domain-based**: Group types by business domain
- **Shared interfaces**: Common interfaces used across app
- **Enum definitions**: Predefined value sets
- **API types**: Types for external API responses

## 🎨 Themes Directory (`themes/`)

App styling and design system.

```
themes/
├── colors.ts              # Color palette definitions
└── typography.ts          # Typography styles
```

### Design System:
- **Consistent colors**: Predefined color palette
- **Typography scale**: Consistent text sizing
- **Spacing system**: Consistent spacing values
- **Component themes**: Themed component variants

## 🖼️ Assets Directory (`assets/`)

Static files like images and icons.

```
assets/
└── images/
    ├── icon.png           # App icon
    ├── splash.png         # Splash screen
    ├── adaptive-icon.png  # Android adaptive icon
    └── icons/             # Various icon sizes
```

### Asset Guidelines:
- **Optimize images**: Use appropriate formats and sizes
- **Multiple densities**: Provide @2x, @3x variants
- **Consistent naming**: Use clear, descriptive names
- **Platform assets**: Platform-specific assets when needed

## 🧪 Tests Directory (`tests/`)

Comprehensive test suite organized by test type.

```
tests/
├── unit/                  # Unit tests
├── integration/           # Integration tests
├── e2e/                   # End-to-end tests
├── reports/               # Test reports
├── test_screenshots/      # Test screenshots
├── conftest.py           # Test configuration
└── run_tests.py          # Test runner
```

### Testing Strategy:
- **Unit tests**: Test individual functions
- **Integration tests**: Test service interactions
- **E2E tests**: Test complete user workflows
- **Visual testing**: Screenshot comparison

## 📚 Docs Directory (`docs/`)

Project documentation organized by topic.

```
docs/
├── README.md              # Main project documentation
├── INSTALLATION_GUIDE.md  # Installation instructions
├── DEPENDENCY_FIXES.md    # Dependency troubleshooting
├── PRIVACY_POLICY.md      # Privacy policy
├── APP_STORE_SETUP.md     # App store submission guide
└── PROJECT_STRUCTURE.md   # This file
```

## 🔧 Scripts Directory (`scripts/`)

Utility scripts for development and deployment.

```
scripts/
├── setup_app_store.js     # App Store Connect setup
└── find_app_id.js         # Find App Store app ID
```

## 🔧 Configuration Files

Root-level configuration files:

```
pocket-doc/
├── package.json           # Dependencies and scripts
├── app.json              # Expo configuration
├── eas.json              # EAS Build configuration
├── tsconfig.json         # TypeScript configuration
├── .gitignore            # Git ignore patterns
├── .npmrc                # npm configuration
└── .prettierrc           # Code formatting rules
```

## 🚀 Development Workflow

### Adding New Features:
1. **Plan structure**: Decide which directories are affected
2. **Create types**: Define TypeScript interfaces
3. **Build services**: Implement business logic
4. **Create components**: Build UI components
5. **Add screens**: Create app screens
6. **Write tests**: Add comprehensive tests
7. **Update docs**: Document new features

### Code Organization Principles:
- **Separation of concerns**: Each directory has a clear purpose
- **Reusability**: Components and services are reusable
- **Type safety**: TypeScript throughout
- **Testability**: Easy to test individual parts
- **Maintainability**: Clear structure for future changes

## 🎯 Best Practices

### File Naming:
- **PascalCase**: Components and classes (`DocumentCard.tsx`)
- **camelCase**: Services and hooks (`ocrService.ts`)
- **kebab-case**: Directories and assets (`test-screenshots/`)

### Import Organization:
```typescript
// External libraries
import React from 'react';
import { View } from 'react-native';

// Internal services
import { ocrService } from '@/services';

// Internal components
import { DocumentCard } from '@/components';

// Types
import type { Document } from '@/types/document';
```

### Code Structure:
1. **Imports** (external, then internal)
2. **Types/Interfaces** (if file-specific)
3. **Constants** (if any)
4. **Main implementation**
5. **Exports**

## 📖 Learning Resources

### For Beginners:
- **React Native**: [Official Docs](https://reactnative.dev/docs/getting-started)
- **Expo**: [Expo Docs](https://docs.expo.dev/)
- **TypeScript**: [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- **Testing**: [React Native Testing](https://reactnative.dev/docs/testing-overview)

### Architecture Patterns:
- **Clean Architecture**: Separation of concerns
- **Component-Based**: Reusable UI components
- **Service Layer**: Business logic abstraction
- **Context Pattern**: Global state management

---

**This structure promotes maintainable, scalable, and beginner-friendly code! 🎉** 