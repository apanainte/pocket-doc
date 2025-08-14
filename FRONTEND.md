# FRONTEND.md — PocketDoc UI Requirements (for Replit AI)

This document contains only the front‑end requirements to implement the PocketDoc UI. Assume services exist for data and actions. Do not implement storage, encryption, OCR internals, or DB here.

---

## Platform & Tech
- React Native (Expo Managed) + Expo Router tabs
- iOS‑first (iOS 15+), light/dark mode
- Use theme tokens from `contexts/ThemeContext` and UI primitives in `components/ui/`
- Icons: `lucide-react-native`

---

## Information Architecture & Navigation
- Tabs: Home | + | Documents | Settings
- Center “+” opens action sheet: Scan | Import Photos | Import PDF
- Stack navigators for detail/review screens and modals

Routing (Expo Router):
- `app/(tabs)/index.tsx` → Library (Home)
- `app/(tabs)/settings.tsx` → Settings
- Replace `upload` tab with a centered “+” action; keep route only if needed for dev
- Modals/Overlays: Document Detail/Viewer, Capture→Review, Export sheet, + Action sheet

---

## Screens & UX

### 1) Library (Home)
- Header: search bar (debounced), scope toggle (All / This category)
- Grid/List of document cards: thumbnail, title, category chip, favorite, small OCR status pill
- Skeleton loaders; lazy thumbnail loading with crossfade
- Recent searches (max 3)
- If 0 results and OCR running → helper: “Indexing x pages… try again soon.”
- Tap card → Document Detail; long‑press → quick actions (Favorite, Rename, Delete)

DocumentCard requirements:
- Title, category chip, favorite state
- First‑page thumbnail (lazy/cached)
- OCR pill (tiny, neutral): `OCR x/y` when indexing

### 2) Document Detail + Full Viewer
- Header: editable title, Favorite toggle, Export action
- Content:
  - PDF: embedded viewer (`react-native-webview`) with horizontal thumbnails scrubber
  - Image(s): swipe gallery with per‑page indicators
  - Per‑page OCR status (spinner/✓)
- Attributes:
  - Single category selector
  - Attribute chips: show 6–8 by default, “See all” expands; inline edit; show confidence if provided
- Actions: Rotate page(s), Rename, Favorite, Export
- Export defaults:
  - Scan session → default “Compiled PDF”
  - Imported PDF/single photo → default “Original”
  - When both valid → choice sheet; remember last selection

### 3) + Action Sheet
- Items: Scan (opens capture), Import from Photos (multi‑select), Import PDF (native picker)
- Limits copy:
  - Photos: auto‑compress if >10MB (≈85% JPEG, long edge ≤3000px)
  - PDF: ≤50MB or ≤50 pages; if exceeded → “Import first 50 pages”

### 4) Capture → Review (multi‑page)
- Capture: big shutter; mode strip: Auto (edge detect ON), Filter (remembers; default B/W); perspective fix ON
- Review: Reorder (drag), Crop/Rotate, Filter, Save; show per‑page thumbnails and count

### 5) Settings (lean)
- Security: App Lock toggle; Auto‑lock time (default 3 min); Change Passcode / Re‑enroll biometrics
- Capture: Default filter; Remember last used; Image compression toggle
- Support: Share Logs (sanitized), Contact
- About: Version, Licenses

---

## Components to (re)use/build
- SearchBar (debounced, clear, scope toggle)
- DocumentCard (see above)
- CategoryChip + CategoryPicker
- AttributeChipsList (collapsible to 6–8, expandable)
- ThumbnailsStrip (horizontal scrubber in detail)
- SkeletonRow/SkeletonCard (loading states)
- PlusActionSheet (center “+”)
- ExportSheet (compiled vs original; remembers last)

Styling/perf:
- Use theme (`ThemeContext`) for colors/spacing/radii/shadows
- Use FlatList windowing, stable keys, memoized item renderers

---

## State & Data Contracts (UI expectations)
Use React Contexts/hooks for app‑wide state; local state for UI. Services provide data.

```ts
type DocumentStatus = 'IMPORTED' | 'OCR_PARTIAL' | 'OCR_DONE';

interface PageRef {
  id: string;
  documentId: string;
  index: number;
  thumbUri: string;        // may appear later
  status: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';
}

interface DocumentSummary {
  id: string;
  title: string;
  categoryId: string | null;
  type: 'image' | 'pdf';
  pageCount: number;
  favorite: boolean;
  sizeBytes: number;
  status: DocumentStatus;
  thumbUri?: string;       // first page
}

interface Category { id: string; name: string; }

interface AttributeDef {
  key: string; label: string; type: 'string' | 'date' | 'number'; pattern?: string; example?: string;
}

interface Attribute { documentId: string; attributeKey: string; value: string; confidence?: number; }

interface OcrProgress { done: number; total: number; }
```

Service calls the UI expects (names can vary):
- fetchDocuments(filters?): Promise<DocumentSummary[]>
- fetchDocument(id): Promise<DocumentSummary & { pages: PageRef[]; attributes: Attribute[] }>
- searchDocuments(query, scope): Promise<DocumentSummary[]>
- getOcrProgress(documentId): Promise<OcrProgress>
- toggleFavorite(documentId)
- updateTitle(documentId, title)
- updateCategory(documentId, categoryId)
- upsertAttribute(documentId, key, value)
- exportDocument(documentId, mode: 'compiled'|'original')
- getRecentSearches(): Promise<string[]>; addRecentSearch(query)

---

## Validation & Messages
- Photos: if long edge > 3000px or size > 10MB, auto‑compress (≈85% JPEG); show non‑blocking toast
- PDF: if >50MB or >50 pages → sheet: “Import first 50 pages” or Cancel
- Zero results while OCR running: helper message
- Errors: inline when possible; toast for non‑blocking; modal for blocking

---

## Performance (UI)
- Thumbnails visible ≤3s for large PDFs (use skeletons, render first thumb ASAP)
- Lazy‑load images with crossfade; avoid jank
- Keep 60 FPS while scrolling

---

## Accessibility
- Touch ≥44×44pt; text ≥13–14pt; contrast ≥4.5:1; dark mode (avoid pure black)
- All actionable elements have accessibility labels

---

## Out of Scope (handled by services)
- File encryption/decryption and keys
- OCR queue execution
- PDF rasterization and compiled PDF generation
- DB migrations and FTS indexing
- Logging sanitization/export

---

## Frontend Acceptance Criteria
- Library shows skeletons then crossfade thumbnails; large PDFs show first thumbnail ≤3s
- OCR pill `OCR x/y` visible on cards/detail; searching works during OCR with helper message
- + action sheet shows Scan/Import Photos/Import PDF with correct limits/messages
- Detail supports attribute chips (6–8 visible, expandable), category selection, export default behavior
- Settings exposes App Lock controls, capture defaults, Share Logs, and About
