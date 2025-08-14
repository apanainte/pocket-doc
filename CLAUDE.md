# CLAUDE.md — PocketDoc Development Guidance

Essential guidance for development sessions, aligned with `PRD.md` and `PLANNING.md` architectural decisions.

## 🔄 Mandatory workflow for all development sessions

**CRITICAL**: Before implementing ANY feature or responding to development requests, Claude MUST follow this exact sequence:

### **Step 1: Context Foundation** 📋
1. Read `PRD.md` — requirements and scope
2. Read `PLANNING.md` — architecture and decisions  
3. Read `TASKS.md` — status and priorities

### Step 2: Context analysis 🔍
- Compare current implementation against documented requirements
- Identify which phase/milestone the request relates to
- Understand dependencies and architectural constraints
- Verify alignment with MVP scope and documented patterns

### Step 3: Implementation 💻
- Follow documented architecture patterns (modular services + contexts)
- Respect current strengths and avoid regressions
- Implement according to priority levels in TASKS.md
- Maintain code quality standards defined in this document

### Why this workflow matters ⚠️
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

## Document responsibilities

| Document | Purpose | Updates | Read Order |
|----------|---------|---------|------------|
| **PRD.md** | 📋 Product requirements + Business goals | 📌 Static reference | **1st - ALWAYS** |
| **PLANNING.md** | 🗺️ Strategic architecture + decisions | 📌 Static reference | **2nd - ALWAYS** |
| **TASKS.md** | ✅ Current status + Active tasks | 🔄 Updated regularly | **3rd - ALWAYS** |
| **CLAUDE.md** | 📘 **Development guidance + Technical specs** | 📌 **Static reference** | **Reference** |

---

## Project constraints & MVP scope

PocketDoc is a privacy‑first, local‑only document management app with strict MVP focus.

Hard constraints:
- iOS‑first (iOS 15+); Android later
- No cloud sync/backups in MVP
- All processing local; no analytics/tracking
- Single category per document; starter templates
- Export defaults per type (compiled for scans; original for imports)

Technology stack (locked for MVP):
- Expo Managed React Native + EAS Build (iOS first)
- `expo-sqlite` with FTS5 (MVP unencrypted)  
- `react-native-document-scanner-plugin` (scan)
- `expo-image-picker` (Photos)
- `react-native-mlkit-ocr` (OCR, English)
- `react-native-webview` (PDF viewing)
- `pdf-lib` (compiled PDFs)
- `react-native-fs` + `expo-file-system` (FS)
- `react-native-aes-crypto` (AES‑256‑GCM) + `expo-secure-store` (keys)

---

## Architecture principles

### Layering
Presentation (screens/components) ←→ Services (business logic) ←→ Data (SQLite/FS)
— Thin screens; logic lives in `services/` with strict, typed interfaces.  
— App‑wide state via React Contexts; prefer local state for UI details.

### Core services
- `StorageService` — FS abstraction over `react-native-fs` + `expo-file-system`
- `OcrService` — ML Kit integration, single‑worker queue hooks
- `PdfService` — `pdf-lib` assembly; interfaces with raster helper for thumbs
- `Database` — SQLite/FTS accessors and migrations
- `Security` — App Lock, keys, encryption helpers

### File storage & encryption
App sandbox layout:
```
/PocketDoc/
  originals/   # Encrypted originals
  compiled/    # Encrypted compiled PDFs
  thumbs/      # Thumbnails (unencrypted)
  temp/        # OCR rasters (ephemeral)
```
Encryption: AES‑256‑GCM; master key derived (Argon2/PBKDF2), wrapped in Keychain via `expo-secure-store`.  
Delete rasters per page after OCR; optionally encrypt sensitive metadata with normalized shadows.

---

## Development standards

### Code quality (non‑negotiable)
- TypeScript strict; no `any`
- Fail visible, fail fast; structured errors
- Privacy‑first: no external data transmission
- Meet performance targets in `PLANNING.md`
- Accessibility: touch ≥44×44pt; text ≥13–14pt; contrast ≥4.5:1; dark mode

### Component architecture
- Reusable UI: `/components/ui/`
- Screens: `/app/(tabs)/`
- Services: `/services/`
- Types: `/types/`

### State management
- Global: React Contexts
- Local: `useState`/`useReducer`
- Derived: `useMemo`
- Effects: `useEffect` with cleanup

---

## UX/UI standards (mandatory)

### Design system
- Respect `themes/` tokens; maintain consistent spacing/typography
- Touch targets ≥44×44pt; consistent header template; skeleton loaders on lists

### Header consistency
- Title + optional subtitle; right‑side action when relevant
- Bottom divider for separation; consistent paddings

### Performance requirements
- FlatList optimization (windowing, keyExtractor, getItemLayout when possible)
- Thumbnails: lazy‑load with crossfade; cache; pre‑generate first page

### Accessibility
- Contrast ≥4.5:1; descriptive a11y labels; full VoiceOver coverage

---

## Database schema (essential)

### Core tables (per PRD)
```
documents(id, title, category_id, created_at, updated_at, type(image|pdf), page_count,
          file_uri_encrypted, favorite, size_bytes, status(IMPORTED|OCR_PARTIAL|OCR_DONE))
pages(id, document_id, index, thumb_uri, status(PENDING|PROCESSING|DONE|FAILED), ocr_lang, text_encrypted?)
fts_pages(page_id, content)  # MVP unencrypted
categories(id, name, created_at)
attributes(id, document_id, attribute_key, value, confidence)
attribute_definitions(key, label, type(string|date|number), pattern, example)
ocr_jobs(id, document_id, page_id, state, attempts, last_error)
```
Indexes: appropriate PK/FK; FTS5 virtual table for `fts_pages`.

---

## Error handling patterns

### Service layer
Return structured results or throw typed errors; never swallow errors. Prefer:
```typescript
type Result<T> = { ok: true; data: T } | { ok: false; code: string; message: string };
```

### UI layer
- Toasts for non‑critical issues; inline validation; modal for blocking errors
- Graceful degradation when features unavailable

### Common error types
- `OCR_FAILED`: Text extraction unsuccessful
- `STORAGE_FULL`: Insufficient device storage
- `PERMISSION_DENIED`: Camera/storage access denied
- `FILE_CORRUPT`: Document file corrupted
- `AUTH_REQUIRED`: Authentication needed

---

## Performance targets

### MVP requirements (from PRD/Planning)
- Thumbnails visible ≤3s for large PDFs (≤50MB/≤50 pages)
- Search responsive while OCR runs; results improve progressively
- App launch <3s; search <2s; crash rate <1%; memory ~≤150MB avg

### Optimization priorities
1. Thumbnail generation first; purge temp rasters immediately
2. Prepared statements and proper indexes
3. Debounced search; scoped queries (All/Category)
4. Release large objects; avoid retaining bitmaps

---

## Security implementation

### App Lock
Biometric default; passcode fallback; auto‑lock after 3 min; soft haptics.

### Data protection
- Files: AES‑256‑GCM for originals/compiled PDFs
- Keys: derived master key wrapped via `expo-secure-store`
- DB: FTS unencrypted in MVP; Phase 2 → SQLCipher for full DB
- Metadata: encrypt sensitive fields where required; keep normalized shadows if needed

### Privacy measures
- No network requests (except updates); no analytics/tracking
- Local processing only; secure file permissions; sanitized logs (no OCR text or paths)

---

## Navigation structure

### Tabs (primary)
Home | + | Documents | Settings  
Center “+” opens action sheet: Scan | Import Photos | Import PDF

### Stacks (secondary)
- Document detail; full document viewer; auth screens

---

## Development workflow

### Git strategy
- `main` — production
- `redesign` — current working branch
- `feature/*` — feature branches

### Commit format
```
type(scope): description
feat(library): add document pagination
fix(ocr): resolve memory leak
```

---

## Testing requirements

### Coverage areas
- **Unit Tests**: Service layer business logic
- **Integration Tests**: Database operations, file storage, OCR
- **Performance Tests**: Memory usage, query performance, image processing
- **Accessibility Tests**: Screen reader support, contrast ratios

### Testing priorities
1. Core document CRUD operations
2. Search functionality with large datasets
3. OCR text extraction accuracy
4. Authentication and security flows
5. File storage and cleanup

---

## Development session guidelines

### Always follow this approach
1. **Context First**: Read PRD → PLANNING → TASKS before coding
2. **MVP Scope**: Stay within documented boundaries
3. **Architecture Compliance**: Follow MVVM pattern and service layer
4. **Privacy Protection**: Ensure no external data transmission
5. **Performance Focus**: Meet documented targets
6. **Quality Standards**: TypeScript strict, comprehensive error handling
7. **Testing Coverage**: Include tests for new functionality
8. **Documentation**: Update relevant docs for architectural changes

### Key decision points
- Does this align with MVP scope in PRD.md?
- Is this privacy-compliant (local-only)?
- Does this meet performance targets?
- Is proper error handling included?
- Are TypeScript types properly defined?
- Is this accessible and maintainable?

### 🚨 Development session checklist
Before coding, verify:
- [ ] ✅ Read PRD.md for requirements context
- [ ] ✅ Read PLANNING.md for architecture context  
- [ ] ✅ Read TASKS.md for current status and priorities
- [ ] ✅ Identified correct phase/milestone
- [ ] ✅ Understood architectural constraints
- [ ] ✅ Verified MVP scope alignment

---

Document version: 4.0  
Last updated: Current  
Aligned with: PRD.md v1.0, PLANNING.md (Architectural Decisions), TASKS.md latest  
Status: Essential Development Guide