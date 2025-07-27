# CLAUDE.md - Pocket docs Development Guide for Claude 4

**Essential guidance for all Pocket docs development sessions**

## 🔄 **MANDATORY WORKFLOW FOR ALL CLAUDE SESSIONS**

**CRITICAL**: Before implementing ANY feature or responding to development requests, Claude MUST follow this exact sequence:

### **Step 1: Context Foundation** 📋
1. **Read PRD.md FIRST** - Understand product requirements, business goals, and feature scope
2. **Read PLANNING.md SECOND** - Understand technical architecture, system design, and implementation strategy  
3. **Read TASKS.md THIRD** - Understand current implementation status, active tasks, and priorities

### **Step 2: Context Analysis** 🔍
- Compare current implementation against documented requirements
- Identify which phase/milestone the request relates to
- Understand dependencies and architectural constraints
- Verify alignment with MVP scope and documented patterns

### **Step 3: Implementation** 💻
- Follow documented architecture patterns (MVVM + Repository)
- Respect current strengths and avoid regressions
- Implement according to priority levels in TASKS.md
- Maintain code quality standards defined in this document

### **Why This Workflow Matters** ⚠️
- **PRD.md** = WHAT to build (requirements, scope, features)
- **PLANNING.md** = HOW to build it (architecture, technology decisions)  
- **TASKS.md** = WHERE we are NOW (status, priorities, next steps)
- **CLAUDE.md** = DEVELOPMENT STANDARDS (patterns, guidelines, quality)

**Without this context, Claude may:**
- ❌ Implement features outside MVP scope
- ❌ Violate architectural patterns
- ❌ Break existing functionality
- ❌ Work on wrong priorities
- ❌ Miss critical dependencies

---

## Document Responsibilities

| Document | Purpose | Updates | Read Order |
|----------|---------|---------|------------|
| **PRD.md** | 📋 Product requirements + Business goals | 📌 Static reference | **1st - ALWAYS** |
| **PLANNING.md** | 🗺️ Strategic architecture + Planning | 📌 Static reference | **2nd - ALWAYS** |
| **TASKS.md** | ✅ Current status + Active tasks | 🔄 Updated regularly | **3rd - ALWAYS** |
| **CLAUDE.md** | 📘 **Development guidance + Technical specs** | 📌 **Static reference** | **Reference** |

---

## Project Constraints & MVP Scope

**PocketDoc** is a privacy-first, local-only document management app with strict MVP focus.

**Hard Constraints:**
- 3-screen maximum design (Library, Upload, Settings)
- No cloud sync or external services
- Local-only processing and storage
- iOS priority, Android support in architecture
- Single-level categorization only
- No premium features or monetization in MVP

**Technology Stack:**
- React Native 0.72+
- SQLite database
- Expo file system
- React Context for state
- React Navigation (tabs + stack)

---

## Architecture Principles

### **MVVM with Repository Pattern**
```
Presentation Layer ←→ Business Logic Layer ←→ Data Layer
(Screens/Components)   (Services/ViewModels)    (Repositories/SQLite)
```

### **Core Services Structure**
- `DocumentService` - Document CRUD operations
- `OCRService` - Text extraction and search indexing
- `SecurityService` - Authentication and encryption
- `StorageService` - File system operations
- `DatabaseService` - SQLite operations

### **File Storage Strategy**
```
/Documents/PocketDoc/
├── documents/     # Original files
├── thumbnails/    # Generated previews
└── temp/         # Auto-cleanup
```

---

## Development Standards

### **Code Quality (Non-Negotiable)**
- **TypeScript Strict**: No `any` types allowed
- **Error Handling**: Comprehensive try-catch with user-friendly messages
- **Privacy First**: No external data transmission in any feature
- **Performance**: Meet targets defined in PLANNING.md
- **Accessibility**: VoiceOver/TalkBack support required

### **Component Architecture**
- **Reusable UI Components**: `/components/ui/`
- **Screen Components**: `/app/(tabs)/`
- **Service Layer**: `/services/`
- **Type Definitions**: `/types/`

### **State Management**
- **Global State**: React Context (as currently implemented)
- **Local State**: useState for component-specific state
- **Derived State**: useMemo for computed values
- **Side Effects**: useEffect with proper cleanup

---

## UX/UI Standards (Mandatory)

### **Design System Constraints**
- **Spacing Scale**: xs(4px) → sm(8px) → md(16px) → lg(20px) → xl(32px)
- **Typography**: H2(24px), H6(14px), Body2(13px), Caption(10-12px), Micro(9px)
- **Touch Targets**: 44px minimum for primary actions, 36px for secondary
- **Grid System**: 2 columns for documents, 8px gaps between items
- **Card Aspect**: 1:1.2 ratio for document cards (reduced from 1:1.3)

### **Header Consistency (All Screens)**
Every screen must use the same header template:
- Padding: lg horizontal, md vertical
- Bottom border for visual separation
- Title + subtitle pattern
- Optional right-side action

### **Performance Requirements**
- **Search bars**: 36px height (reduced from 44px for space efficiency)
- **Document cards**: Use spacing.sm (8px) for compact layouts
- **FlatList optimization**: Required for document lists
- **Image optimization**: Proper thumbnail generation and caching

### **Accessibility Requirements**
- **Minimum contrast**: 4.5:1 for primary text, 3:1 for secondary
- **Accessibility labels**: Descriptive and contextual
- **Touch targets**: Meet platform guidelines
- **Screen reader**: Full VoiceOver/TalkBack support

---

## Database Schema (Essential)

### **Core Tables**
```sql
documents (id, title, description, category_id, file_path, thumbnail_path, 
          file_type, file_size, extracted_text, created_at, updated_at)

categories (id, name, color, icon, created_at)

search_index (id, document_id, keyword, frequency)
```

### **Performance Indexes**
- `idx_search_keyword` on search_index.keyword
- `idx_document_category` on documents.category_id
- `idx_document_created` on documents.created_at

---

## Error Handling Patterns

### **Service Layer**
Always return structured responses:
```typescript
{ success: boolean, data?: any, error?: string, code?: string }
```

### **UI Layer**
- **Toast messages**: Non-critical errors
- **Modal dialogs**: Critical errors requiring user action
- **Inline validation**: Form errors
- **Graceful degradation**: When features unavailable

### **Common Error Types**
- `OCR_FAILED`: Text extraction unsuccessful
- `STORAGE_FULL`: Insufficient device storage
- `PERMISSION_DENIED`: Camera/storage access denied
- `FILE_CORRUPT`: Document file corrupted
- `AUTH_REQUIRED`: Authentication needed

---

## Performance Targets

### **MVP Requirements**
- **App launch**: < 3 seconds
- **Document processing**: < 10 seconds per document
- **Search response**: < 2 seconds
- **Memory usage**: < 150MB average
- **Crash rate**: < 1%

### **Optimization Priorities**
1. **Image processing**: Proper thumbnail generation and disposal
2. **Database queries**: Use prepared statements and indexes
3. **Search performance**: Debounced search with result caching
4. **Memory management**: Release large objects immediately

---

## Security Implementation

### **Authentication Flow**
```
App Launch → Auth Check → [Biometric/Passcode] → Main App
```

### **Data Protection**
- **Database**: SQLCipher for encrypted storage
- **Files**: Platform-native encryption (iOS File Protection, Android Keystore)
- **Sensitive Data**: React Native Keychain
- **Runtime**: Encrypt sensitive data in memory when possible

### **Privacy Measures**
- No network requests (except app updates)
- No analytics or tracking
- Local processing only
- Secure file permissions
- App backgrounding protection

---

## Navigation Structure

### **Bottom Tab (Primary)**
```
Library (Home) → Document grid with search
Upload → 4 upload methods (camera, scan, gallery, PDF)
Settings → Security, appearance, storage, about
```

### **Stack Navigation (Secondary)**
- Document detail modals
- Authentication screens
- Category management
- Full document viewer

---

## Development Workflow

### **Git Strategy**
- `main` (production ready)
- `develop` (integration branch) 
- `feature/*` (feature branches)
- `hotfix/*` (critical fixes)

### **Commit Format**
```
type(scope): description
feat(library): add document pagination
fix(ocr): resolve memory leak
```

---

## Testing Requirements

### **Coverage Areas**
- **Unit Tests**: Service layer business logic
- **Integration Tests**: Database operations, file storage, OCR
- **Performance Tests**: Memory usage, query performance, image processing
- **Accessibility Tests**: Screen reader support, contrast ratios

### **Testing Priorities**
1. Core document CRUD operations
2. Search functionality with large datasets
3. OCR text extraction accuracy
4. Authentication and security flows
5. File storage and cleanup

---

## Claude 4 Development Guidelines

### **Always Follow This Approach:**
1. **Context First**: Read PRD → PLANNING → TASKS before coding
2. **MVP Scope**: Stay within documented boundaries
3. **Architecture Compliance**: Follow MVVM pattern and service layer
4. **Privacy Protection**: Ensure no external data transmission
5. **Performance Focus**: Meet documented targets
6. **Quality Standards**: TypeScript strict, comprehensive error handling
7. **Testing Coverage**: Include tests for new functionality
8. **Documentation**: Update relevant docs for architectural changes

### **Key Decision Points:**
- Does this align with MVP scope in PRD.md?
- Is this privacy-compliant (local-only)?
- Does this meet performance targets?
- Is proper error handling included?
- Are TypeScript types properly defined?
- Is this accessible and maintainable?

### **🚨 Development Session Checklist**
Before coding, verify:
- [ ] ✅ Read PRD.md for requirements context
- [ ] ✅ Read PLANNING.md for architecture context  
- [ ] ✅ Read TASKS.md for current status and priorities
- [ ] ✅ Identified correct phase/milestone
- [ ] ✅ Understood architectural constraints
- [ ] ✅ Verified MVP scope alignment

---

*Document Version: 3.0*  
*Last Updated: Current*  
*Aligned with: PRD.md v1.0, PLANNING.md v1.0, TASKS.md v2.0*  
*Status: Essential Development Guide for Claude 4* 