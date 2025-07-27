# Pocket Doc - Product Requirements Document (PRD)

## Document Responsibilities

| Document | Purpose | Updates |
|----------|---------|---------|
| **PRD.md** | 📋 **Product requirements + Business goals** | 📌 **Static reference** |
| **PLANNING.md** | 🗺️ Strategic architecture + Planning | 📌 Static reference |
| **CLAUDE.md** | 📘 Development guidance + Technical specs | 📌 Static reference |
| **TASKS.md** | ✅ Current status + Active tasks | 🔄 Updated regularly |

**This document (PRD.md)** contains product requirements, business objectives, feature specifications, and success metrics. Reference this for "what we're building and why."

## Overview
Pocket Doc is a privacy-first, cross-platform mobile application designed for secure document management, storage, and retrieval. The app prioritizes user privacy while providing essential document handling capabilities in a simple, intuitive interface.

## Business Goals
- **Primary Goal**: Create a minimal viable product (MVP) for secure, private document storage and management
- **Target Market**: Privacy-conscious users who need quick access to personal documents on mobile devices
- **Platform Priority**: iOS first, with Android support planned in architecture
- **Success Metrics**: User adoption, document upload frequency, search usage, retention rate

## Core Value Proposition
- **Privacy First**: No cloud sync, all data stored locally on device
- **Simplicity**: Clean, intuitive interface focused on core document tasks
- **Security**: Passcode and biometric authentication
- **Accessibility**: Quick search and categorization for easy document retrieval

## Target Users
- **Primary**: Individuals who frequently handle documents on mobile devices
- **Secondary**: Users concerned about document privacy and data security
- **Use Cases**: Storing receipts, contracts, IDs, medical documents, notes, photos of important documents

## App Architecture
**3-Screen Design:**
1. **Library (Home Screen)** - Document grid with search and single-level categories
2. **Upload Screen** - Multiple upload options (camera, gallery, scan, files)
3. **Settings Screen** - App configuration and security settings

## Functional Requirements

### Core Features (MVP)
1. **Document Upload & Capture**
   - Take Photo (camera access)
   - Upload Image (photo library access)
   - Scan Document (camera with document detection and edge detection)
   - Upload PDF (file system access for PDFs)

2. **Simple Text Extraction** (FIXED - No Fake Content)
   - **Single OCR engine** (MLKit only - no complex fallback systems)
   - **Honest failure handling** - clear error messages when OCR fails
   - **Manual entry option** - users can input text when extraction fails
   - Store extracted text for search functionality
   - **No fake text generation** - only real extracted text or manual entry

3. **Document Management**
   - Grid-based document display on Library screen
   - Single-level manual categorization
   - Edit document titles and descriptions
   - View documents in full-screen mode
   - Document thumbnails for quick recognition

4. **Search Functionality**
   - Search bar at top of Library screen
   - Keyword-based search through extracted text
   - Search by title and descriptions
   - Real-time search results filtering

5. **Security & Authentication**
   - Passcode authentication (4-6 digit PIN)
   - Biometric authentication (Touch ID/Face ID/Fingerprint)
   - App lock on background/foreground transitions

6. **User Interface**
   - 3-screen navigation (Library, Upload, Settings)
   - Bottom tab bar navigation
   - Grid layout for document display
   - Dark mode support
   - Clean, minimal design focused on document thumbnails

### Navigation & User Flow
- **Library Screen**: Primary screen with search bar, document grid, bottom navigation
- **Upload Flow**: Tap '+' → Select upload method → Process document → Return to Library
- **Settings Access**: Bottom tab navigation to configuration screen
- **Document View**: Tap document thumbnail → Full-screen view with edit options
- **Platform**: iOS (primary), Android (secondary)
- **Storage**: Local device storage only
- **Performance**: Smooth scrolling, fast search results (<2 seconds)
- **Compatibility**: iOS 14+, Android API 26+
- **File Support**: JPEG, PNG, PDF, basic document formats

## Non-Functional Requirements

### Privacy & Security
- No data transmission to external servers
- All processing done on-device
- Encrypted local storage
- No analytics or tracking
- No account creation or email required

### Performance
- App launch time: <3 seconds
- Document upload processing: <10 seconds per document
- Search results: <2 seconds
- Smooth 60fps UI animations

### Data Persistence & Reliability (MVP)
- **User Data Protection**: User documents must survive app updates with 95%+ reliability
- **Transparent Updates**: Database changes occur seamlessly without user intervention
- **Recovery Options**: Simple manual export/import for edge cases where automatic recovery fails
- **Minimal Performance Impact**: Data reliability improvements must not affect app startup time
- **Progressive Degradation**: App remains functional even if some data recovery features fail
- **User Communication**: Clear feedback when data issues occur, with actionable recovery steps

### Usability
- **Maximum 2 taps** to reach any core function (simplified from 3-screen design)
- **Single-level categorization** for simplicity
- **Grid-based browsing** with visual document thumbnails
- Intuitive navigation without tutorials
- Consistent with platform design guidelines
- Accessibility compliance (VoiceOver, large text support)

## **Explicitly Out of Scope** (No Feature Creep)
- ❌ Cloud synchronization
- ❌ Email authentication
- ❌ **Dual OCR engines with fallback mechanisms** (over-engineering)
- ❌ **VisionKit integration** (incompatible with Expo)
- ❌ **Fake text generation when OCR fails** (user trust issue)
- ❌ **Complex OCR preprocessing and analysis** (unnecessary complexity)
- ❌ Document editing capabilities
- ❌ Sharing documents externally
- ❌ Advanced backup/restore functionality
- ❌ Multiple user accounts
- ❌ Advanced categorization (auto-tagging)
- ❌ Document version control
- ❌ Integration with other apps

## Success Criteria
- **Functional**: All core features working reliably
- **Performance**: Meets specified performance benchmarks
- **Security**: Passes basic security audit
- **Usability**: Users can complete core tasks without assistance
- **Stability**: <1% crash rate

## Assumptions & Constraints
- Users have devices with camera capabilities
- Sufficient device storage available
- Users comfortable with basic mobile app interactions
- OCR accuracy dependent on document quality
- Limited by device processing capabilities

## Risk Assessment
- **Low Risk**: Basic UI/UX implementation
- **Medium Risk**: OCR integration and accuracy
- **High Risk**: Cross-platform compatibility, security implementation

## Timeline Considerations
- MVP development: Focus on iOS first
- Feature completeness over platform coverage initially
- Iterative improvement based on user feedback

---
*Document Version: 1.0*  
*Last Updated: July 2025*  
*Status: Draft - Pending Review*
