# CLAUDE.md - PocketDoc Privacy Scanner Development Guide

**Always reference this guide for all PocketDoc development sessions**

---

## Document Responsibilities

| Document | Purpose | Updates |
|----------|---------|---------|
| **PRD.md** | 📋 Product requirements + Business goals | 📌 Static reference |
| **PLANNING.md** | 🗺️ Strategic architecture + Planning | 📌 Static reference |
| **CLAUDE.md** | 📘 **Development guidance + Technical specs** | 📌 **Static reference** |
| **TASKS.md** | ✅ Current status + Active tasks | 🔄 Updated regularly |

**This document (CLAUDE.md)** contains development priorities, technical architecture, performance targets, and implementation guidance. Reference this for "how to implement features and what standards to meet."

---

## Project Overview

**PocketDoc** is a privacy-first document scanner focused on delivering professional-grade document digitization without compromising user privacy. All data remains on the user's device with zero cloud dependencies.

**Core Value Proposition**: "Adobe Scan, but your documents never leave your device"

---

## Development Context & Constraints

*For current implementation status, see TASKS.md*

---

## Technical Architecture

### Technology Stack
```
Frontend: React Native + Expo Managed Workflow
OCR Engine: ML Kit (Android) / VisionKit (iOS) 
Storage: SQLite + Expo SecureStore (encrypted)
Authentication: Expo LocalAuthentication (Face ID/Touch ID/Fingerprint)
Image Processing: React Native camera and image libraries
Search: Local FTS (Full-Text Search) implementation
State Management: React Context (current) 
Navigation: Expo Router with tab navigation
UI Framework: Custom components (RevolutCard, RevolutText, etc.)
```

### Performance Targets
- **App launch**: < 2 seconds cold start
- **Document capture**: < 3 seconds from camera to preview  
- **OCR processing**: < 5 seconds for standard document
- **Search response**: < 500ms for local queries
- **Storage efficiency**: < 5MB per document average
- **OCR accuracy**: 90%+ for typed text, 70%+ for handwritten text (85%+ average)

### Quality Standards
- **Crash rate**: < 0.5% of user sessions
- **Edge detection**: 95%+ accuracy for standard documents
- **Storage encryption**: AES-256 for all document data
- **Battery optimization**: Minimal background processing
- **Memory management**: Efficient handling of large images

---

## Key Development Priorities

### Phase 1: Core Scanning Enhancement
**Priority**: Critical for MVP success

1. **Real OCR Integration**
   - Replace simulated OCR with ML Kit (Android) / VisionKit (iOS)
   - Implement confidence scoring and error handling
   - Add multi-language support (English, Spanish, French, German)
   - Target: 90%+ accuracy for typed text, 70%+ for handwritten text (85%+ average)

2. **Professional Image Processing**
   - Edge detection and automatic document boundary detection
   - Perspective correction for skewed documents
   - Image enhancement (brightness, contrast, sharpness)
   - Multi-page document support

3. **Smart Auto-Categorization**
   - Detect document types: receipts, invoices, business cards, contracts, IDs
   - Generate intelligent document titles based on content
   - Auto-tag based on document analysis
   - Content-aware organization suggestions

### Phase 2: Premium Features & Monetization
**Priority**: Required for revenue generation

1. **Subscription System**
   - Implement in-app purchases with RevenueCat
   - Free tier: 50 documents maximum
   - Premium tier: $2.99/month or $24.99/year
   - Feature gating and upgrade prompts

2. **Advanced Organization**
   - Custom categories and nested folders  
   - Smart collections based on rules
   - Bulk operations and batch processing
   - Advanced search with filters and regular expressions

3. **Professional Export**
   - Multiple format options (PDF, images, text)
   - PDF with OCR layer for searchability
   - Batch export functionality
   - Professional sharing options

### Phase 3: Performance & Polish
**Priority**: Essential for App Store success

1. **Performance Optimization**
   - Optimize image processing workflows
   - Implement lazy loading for large document collections
   - Background processing for OCR operations
   - Memory management for image handling

2. **UI/UX Enhancement**
   - Professional scanning interface with manual controls
   - Improved document viewer with zoom/pan/rotate
   - Better onboarding flow (target: 2 minutes to first scan)
   - Accessibility improvements (screen reader support)

---

## Development Guidelines

### Code Quality Standards
- **TypeScript**: Strict type checking, no `any` types
- **Error Handling**: Comprehensive try-catch blocks with user-friendly messages
- **Performance**: Profile memory usage and processing time for image operations
- **Security**: Validate all file inputs, encrypt sensitive data
- **Privacy**: Ensure zero external data transmission
- **Testing**: Unit tests for business logic, integration tests for OCR workflows

### Security Requirements
- **Local-only processing**: All OCR and AI processing on-device
- **Data encryption**: AES-256 for all stored document data
- **File validation**: Comprehensive security checks for uploaded files
- **Biometric authentication**: Required for app access
- **Privacy indicators**: Clear UI showing "Local Only" status
- **No telemetry**: Zero analytics or crash reporting to external services

### Performance Guidelines
- **Image optimization**: Compress images while maintaining OCR quality
- **Background processing**: Use background queues for OCR operations
- **Lazy loading**: Load document thumbnails on demand
- **Memory management**: Release large image objects promptly
- **Search optimization**: Use FTS indices for fast text search
- **Battery efficiency**: Minimize camera and processor usage

---

## Current Implementation Details

### Document Data Model
```typescript
interface Document {
  id: string;
  title: string;
  description: string;
  tags: string[];
  filePath: string;
  fileType: 'image' | 'pdf';
  fileSize: number;
  extractedText?: string;
  ocrConfidence?: number;
  category?: string;
  createdAt: Date;
  modifiedAt: Date;
  isFavorite?: boolean;
}
```

### OCR Service Interface
```typescript
interface OCRResult {
  text: string;
  confidence: number;
  blocks: TextBlock[];
  processingTime: number;
  imageSize: { width: number; height: number };
}
```

### Database Schema
```sql
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT, -- JSON array
  filePath TEXT NOT NULL,
  fileType TEXT NOT NULL,
  fileSize INTEGER,
  extractedText TEXT,
  ocrConfidence REAL,
  category TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  modifiedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  isFavorite INTEGER DEFAULT 0
);

CREATE VIRTUAL TABLE documents_fts USING fts5(
  title, description, extractedText, content=documents
);
```

---

## Integration Points

### OCR Service Enhancement
**Current**: Simulated OCR with mock data
**Target**: Real ML Kit/VisionKit integration

**Implementation Notes**:
- Replace `services/ocrService.ts` with real ML Kit implementation
- Maintain existing interface for backward compatibility
- Add confidence scoring and error handling
- Implement language detection and multi-language support

### Premium Feature Integration
**Current**: No monetization
**Target**: RevenueCat subscription management

**Implementation Notes**:
- Add RevenueCat SDK to project dependencies
- Implement subscription status checking
- Add feature gating throughout the app
- Create upgrade prompts and paywall screens

### Image Processing Pipeline
**Current**: Basic camera capture
**Target**: Professional scanning with enhancement

**Implementation Notes**:
- Integrate document edge detection library
- Add perspective correction algorithms  
- Implement image enhancement filters
- Create manual camera controls for professional mode

---

## App Store Preparation

### ASO (App Store Optimization)
**Target Keywords**: "privacy scanner", "document scan", "OCR privacy", "local scanner"

**Screenshots Required**:
1. Professional scanning interface with edge detection
2. Document library showing organized documents
3. Search interface with instant results
4. Privacy indicators showing "Local Only" status
5. Premium features comparison

**App Description Focus**:
- Privacy-first messaging
- Professional scanning quality
- Local-only operation
- Business/professional use cases

### Quality Assurance
**Testing Requirements**:
- OCR accuracy testing across document types
- Performance testing on older devices
- Security testing for data encryption
- Privacy verification (no external network calls)
- Accessibility testing with screen readers

---

## Common Development Tasks

### Adding New Document Categories
1. Update auto-categorization logic in `aiMetadata.ts`
2. Add category icons and colors in theme files
3. Update database schema if needed
4. Add category filters to search interface

### Implementing New Premium Features
1. Add feature flag checking in relevant components
2. Create upgrade prompts for free users
3. Update subscription status logic
4. Add feature to premium paywall screen

### Optimizing Performance
1. Profile image processing operations
2. Implement background queues for heavy operations
3. Add lazy loading for large lists
4. Optimize database queries with proper indexing

### Enhancing OCR Accuracy
1. Fine-tune ML Kit/VisionKit parameters
2. Implement image preprocessing for better OCR
3. Add confidence-based quality scoring
4. Implement manual text correction interfaces

---

## Troubleshooting Guide

### Common OCR Issues
- **Low confidence scores**: Implement image enhancement before OCR
- **Poor text extraction**: Check image quality and lighting
- **Multi-language problems**: Ensure proper language detection
- **Performance issues**: Implement background processing

### Camera Integration Problems
- **Permission issues**: Handle camera permission gracefully
- **Preview quality**: Optimize camera settings for document scanning
- **Auto-focus problems**: Implement manual focus controls
- **Memory leaks**: Properly dispose of camera resources

### Database Performance
- **Slow search**: Implement FTS indices properly
- **Large document collections**: Add pagination and lazy loading
- **Storage space**: Implement document compression and cleanup

---

## Success Metrics to Track

### Technical Metrics
- OCR processing time and accuracy
- App launch time and responsiveness  
- Search query response time
- Crash rates and error frequencies
- Battery usage during scanning sessions

### User Experience Metrics
- Time from app open to first successful scan
- Document organization efficiency
- Search success rates
- Premium feature adoption
- User retention and engagement

---

This guide should be referenced for all development decisions to ensure alignment with product goals, technical constraints, and user experience requirements. Always prioritize privacy, performance, and professional scanning quality in implementation decisions. 