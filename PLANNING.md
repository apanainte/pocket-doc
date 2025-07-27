# PLANNING.md - Pocket Doc - Strategic Architecture & Planning

**Strategic planning and architecture overview for PocketDoc development**

---

## Document Responsibilities

| Document | Purpose | Updates |
|----------|---------|---------|
| **PRD.md** | 📋 Product requirements + Business goals | 📌 Static reference |
| **PLANNING.md** | 🗺️ **Strategic architecture + Planning** | 📌 **Static reference** |
| **CLAUDE.md** | 📘 Development guidance + Technical specs | 📌 Static reference |
| **TASKS.md** | ✅ Current status + Active tasks | 🔄 Updated regularly |

**This document (PLANNING.md)** contains strategic vision, system architecture, technology decisions, and resource planning. Reference this for "how we're building it and why these technical choices."

## Technology Stack

### Cross-Platform Framework
**Primary Choice: React Native**
- **Rationale**: Single codebase for iOS/Android, strong ecosystem, excellent performance
- **iOS Priority**: Native modules for iOS-specific features, optimized builds
- **Android Support**: Maintained compatibility through shared architecture

### Core Libraries & Dependencies
```
├── React Native 0.72+
├── React Navigation 6 (Tab + Stack navigation)
├── React Native Vision Camera (Camera functionality)
├── React Native Document Scanner (Document scanning)
├── React Native OCR (Text extraction)
├── React Native Keychain (Secure storage)
├── React Native Biometrics (Touch/Face ID)
├── React Native FS (File system operations)
├── SQLite (Local database)
└── React Native Vector Icons (UI icons)
```

### Alternative Stack (Native Development)
**iOS**: Swift + UIKit/SwiftUI
**Android**: Kotlin + Jetpack Compose
- Consider if React Native limitations emerge during development

## Application Architecture

### Overall Architecture Pattern
**MVVM (Model-View-ViewModel) with Repository Pattern**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Presentation  │    │   Business      │    │   Data          │
│   Layer         │    │   Logic Layer   │    │   Layer         │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • Screens       │◄──►│ • ViewModels    │◄──►│ • Repositories  │
│ • Components    │    │ • Services      │    │ • Data Sources  │
│ • Navigation    │    │ • Validators    │    │ • Models        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Folder Structure
```
src/
├── components/          # Reusable UI components
│   ├── common/         # Generic components
│   ├── forms/          # Form-specific components
│   └── document/       # Document-related components
├── screens/            # Main application screens
│   ├── Library/        # Home screen with document grid
│   ├── Upload/         # Document upload screen
│   └── Settings/       # App settings screen
├── navigation/         # Navigation configuration
├── services/           # Business logic services
│   ├── DocumentService.js
│   ├── OCRService.js
│   ├── StorageService.js
│   └── SecurityService.js
├── repositories/       # Data access layer
├── models/            # Data models and types
├── utils/             # Helper functions
├── constants/         # App constants
└── assets/            # Images, fonts, etc.
```

## Data Architecture

### Local Database Schema (SQLite)

#### Documents Table
```sql
CREATE TABLE documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    category_id INTEGER,
    file_path TEXT NOT NULL,
    thumbnail_path TEXT,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    extracted_text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories (id)
);
```

#### Categories Table
```sql
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#007AFF',
    icon TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Search Index Table
```sql
CREATE TABLE search_index (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL,
    keyword TEXT NOT NULL,
    frequency INTEGER DEFAULT 1,
    FOREIGN KEY (document_id) REFERENCES documents (id)
);

CREATE INDEX idx_search_keyword ON search_index (keyword);
CREATE INDEX idx_document_category ON documents (category_id);
```

### File Storage Strategy
```
/Documents/PocketDoc/
├── documents/          # Original document files
│   ├── {doc_id}.pdf
│   ├── {doc_id}.jpg
│   └── {doc_id}.png
├── thumbnails/         # Generated thumbnails
│   ├── {doc_id}_thumb.jpg
│   └── {doc_id}_thumb.png
└── temp/              # Temporary processing files
```

### Database Reliability Strategy (MVP Approach)

#### Core Principle: Incremental Improvements Over Complex Solutions
This MVP prioritizes simple, proven approaches over enterprise-grade complexity.

#### Strategic Approach
- **Enhanced Migration Detection**: Improve existing migration logic with better logging and validation
- **Simple Backup Strategy**: Weekly JSON exports to predictable file locations  
- **User-Centric Recovery**: Clear options for users when data issues occur
- **Proportional Engineering**: Solutions sized appropriately for a 3-screen MVP app

#### Migration Enhancement Strategy
- Explicit database file paths for consistency across app updates
- Step-by-step migration validation with comprehensive logging
- Automatic fallback to backup data when migration fails
- Post-migration integrity checks to ensure data completeness

#### Backup & Recovery Architecture
- Automated weekly backups exported as simple JSON files
- User-accessible manual export functionality for peace of mind
- Clear recovery options presented when database issues are detected
- Progressive recovery: automatic → backup restore → manual export → fresh start

#### Implementation Priorities
1. **Fix Current Issues**: Enhance existing migration detection and validation
2. **Add Safety Net**: Simple automated backups and recovery options
3. **User Transparency**: Clear communication about data status and recovery options
4. **Maintainability**: Keep solutions simple enough for small development team to maintain

## Screen Architecture

### 1. Library Screen (Home)
```javascript
LibraryScreen/
├── components/
│   ├── SearchBar.js
│   ├── DocumentGrid.js
│   ├── DocumentCard.js
│   ├── CategoryFilter.js
│   └── EmptyState.js
├── hooks/
│   ├── useDocuments.js
│   ├── useSearch.js
│   └── useCategories.js
└── LibraryScreen.js
```

**Key Features:**
- Search bar with real-time filtering
- Grid layout with document thumbnails
- Category filtering (single-level)
- Pull-to-refresh functionality
- Infinite scroll for large document sets

### 2. Upload Screen
```javascript
UploadScreen/
├── components/
│   ├── UploadOptions.js
│   ├── CameraCapture.js
│   ├── DocumentScanner.js
│   ├── FileUploader.js
│   └── ProcessingIndicator.js
├── hooks/
│   ├── useCamera.js
│   ├── useDocumentScan.js
│   └── useFileUpload.js
└── UploadScreen.js
```

**Upload Flow:**
1. User selects upload method (Take Photo, Upload Image, Scan Document, Upload PDF)
2. Capture/select document with validation
3. Process document (OCR, thumbnail generation, metadata extraction)
4. Save to database and file system
5. Return to Library screen

### 3. Settings Screen
```javascript
SettingsScreen/
├── components/
│   ├── SecuritySettings.js
│   ├── AppearanceSettings.js
│   ├── StorageInfo.js
│   └── AboutSection.js
└── SettingsScreen.js
```

**Settings Categories:**
- Security (Passcode, Biometrics)
- Appearance (Dark mode)
- Storage (Usage info, cleanup)
- About (Version, privacy policy)

## Core Services Architecture

### DocumentService
```javascript
class DocumentService {
  async createDocument(file, metadata)
  async updateDocument(id, updates)
  async deleteDocument(id)
  async getDocuments(filters)
  async searchDocuments(query)
  async generateThumbnail(filePath)
}
```

### OCRService (Simplified - Single Engine)
```typescript
class OCRService {
  // Single MLKit engine only - no complex fallbacks
  async recognizeText(imageUri: string): Promise<OCRResult>
  async isAvailable(): Promise<boolean>
  
  // No fake content generation
  // Clear error handling with manual entry option
}

interface OCRResult {
  text: string;           // Real extracted text only
  confidence: number;     // Actual MLKit confidence
  requiresManualEntry?: boolean; // True if OCR failed
}

// REMOVED COMPLEXITY:
// - VisionKit fallback engine (340 lines)
// - Fake text generation methods (200+ lines)  
// - Dual-engine management (300+ lines)
// - Complex initialization (100+ lines)
// Target: 1,342 → 150 lines (89% reduction)
```

### StorageService
```javascript
class StorageService {
  async saveFile(file, directory)
  async deleteFile(path)
  async getStorageInfo()
  async cleanup()
}
```

### SecurityService
```javascript
class SecurityService {
  async setupPasscode(code)
  async verifyPasscode(code)
  async enableBiometrics()
  async authenticate()
  async encryptData(data)
  async decryptData(encryptedData)
}
```

## Navigation Architecture

### Bottom Tab Navigation
```javascript
const TabNavigator = createBottomTabNavigator({
  Library: {
    screen: LibraryStack,
    options: {
      tabBarIcon: 'folder',
      title: 'Library'
    }
  },
  Upload: {
    screen: UploadScreen,
    options: {
      tabBarIcon: 'plus',
      title: 'Upload'
    }
  },
  Settings: {
    screen: SettingsScreen,
    options: {
      tabBarIcon: 'settings',
      title: 'Settings'
    }
  }
});
```

### Stack Navigation (for modals/detail views)
```javascript
const LibraryStack = createStackNavigator({
  LibraryHome: LibraryScreen,
  DocumentDetail: DocumentDetailScreen,
  DocumentEdit: DocumentEditScreen
});
```

## Performance Strategy

### Optimization Techniques
1. **Lazy Loading**: Documents loaded in batches
2. **Image Optimization**: Compressed thumbnails, lazy image loading
3. **Search Optimization**: Indexed search with debounced queries
4. **Memory Management**: Cleanup unused resources, image caching
5. **Database Optimization**: Proper indexing, query optimization

### Caching Strategy
- **Document Thumbnails**: Persistent cache with LRU eviction
- **Search Results**: In-memory cache for recent queries
- **OCR Results**: Stored in database, no re-processing

## Security Implementation

### Data Encryption
- **Database**: SQLCipher for encrypted SQLite
- **Files**: iOS File Protection, Android Keystore encryption
- **Sensitive Data**: React Native Keychain for secure storage

### Authentication Flow
```
App Launch → Check Auth Status → Biometric/Passcode → Main App
                ↓
           Unauthenticated → Auth Screen → Success → Main App
```

### Privacy Measures
- No network requests (except updates)
- No analytics or tracking
- Local processing only
- Secure file permissions

## Development Phases

### Phase 1: Core Foundation (Week 1-2)
- Project setup and navigation
- Basic screen structure
- Database schema implementation
- File storage system

### Phase 2: Document Management (Week 3-4)
- Upload functionality (all 5 methods)
- Basic document display
- File operations (save, delete)
- Thumbnail generation

### Phase 3: Search & OCR (Week 5-6)
- OCR integration
- Search functionality
- Text extraction and indexing
- Search optimization

### Phase 4: Security & Polish (Week 7-8)
- Authentication implementation
- Security hardening
- UI polish and dark mode
- Performance optimization

### Phase 5: Testing & Deployment (Week 9-10)
- Comprehensive testing
- iOS App Store preparation
- Android Play Store preparation
- Final optimizations

## Risk Mitigation

### Technical Risks
- **OCR Accuracy**: Implement fallback text editing
- **Performance**: Progressive loading, optimization
- **Storage Limits**: Implement storage management
- **Cross-Platform Issues**: Platform-specific code where needed

### Development Risks
- **Timeline**: Prioritize iOS, defer Android if needed
- **Complexity**: Keep MVP scope strict
- **Testing**: Automated testing from early phases

## Success Metrics

### Technical KPIs
- App launch time: <3 seconds
- Document processing: <10 seconds
- Search response: <2 seconds
- Crash rate: <1%
- Memory usage: <150MB average

### User Experience KPIs
- Upload success rate: >95%
- Search accuracy: >90%
- User retention: Track weekly active users
- Feature adoption: Monitor usage of each upload method

---
*Document Version: 1.0*  
*Last Updated: July 2025*  
*Status: Draft - Architecture Planning*
