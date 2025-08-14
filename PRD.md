# Product Requirements Document (PRD) — iOS-first Document Scanner & Organizer

**Tech target:** React Native (Expo Managed), EAS Build  
**Core:**
- Progressive on-device OCR (English)  
- Local AES-256-GCM encryption (files + sensitive metadata)  
- Center “+” tab (Scan / Import Photos / Import PDF)  
- Single category per doc; starter templates; attribute chips  
- Export original or compiled PDF (smart default)  

---

## 1) Scope

### In
- iOS (iPhone) launch; English UI
- Capture (multi-page), import Photos/PDF
- Progressive OCR (background)
- Categories (single), attributes (predefined; auto-filled + editable)
- Search across OCR index (progressive)
- Export: compiled PDF (scan) or original (import)
- App Lock (biometric default; 3-min auto-lock)
- Logs (sanitized) shareable

### Out (MVP)
- Cloud sync/backups
- Tags / advanced filters
- Multi-language OCR
- Full DB encryption (Phase 2)

---

## 2) Navigation & IA

- Tabs: **Home | + | Documents | Settings**  
- “+” opens sheet: **Scan**, **Import from Photos**, **Import PDF**  
- Key screens: Home, Documents, Document Detail, Capture → Review, Settings

---

## 3) Functional Requirements

### 3.1 Capture & Review
- **Camera (Scan):** Big shutter; strip with **Auto** (edge detect ON), **Filter** (remembers; default **B/W**); Perspective fix ON
- **Review:** **Reorder · Crop/Rotate · Filter · Save**
- **Image import:** Multi-select; auto-compress if >10MB (≈85% JPEG, long edge ≤3000px)
- **PDF import:** Native picker; limit **≤50MB OR ≤50 pages**  
  If exceeded → “Import first 50 pages” or Cancel

### 3.2 Progressive OCR
- Starts after Save/Import; page-by-page; **concurrency = 1**
- UI:
  - Card pill: `OCR 3/12` (neutral, tiny)
  - Detail: per-page spinner/✓; top “Indexing…”
  - Microcopy: **“You can search while we finish indexing.”**
  - Quiet completion toast (rate-limited)

### 3.3 Organization
- Single category per doc  
- Starter templates: **ID, Receipt, Invoice, Contract, Certificate, Other**
- New category: show up to **6–8 attribute chips**; “See all attributes” reveals more
- Attributes: auto-filled from OCR + confidence; inline edit; only chosen fields shown

### 3.4 Search
- Full-text over OCR index (progressive results OK)
- Toggle: **All documents / This category**
- Recent searches (max 3)
- If 0 results & OCR running → helper: “Indexing <x> pages… try again soon.”

### 3.5 Edit & Export
- Rotate pages, basic annotation (highlight/draw), rename, favorite
- **Export default:**
  - Scan session → **Compiled PDF**
  - Imported PDF/single photo → **Original**
- When relevant, sheet: **Export compiled PDF** / **Export original file** (remembers last)

### 3.6 Security
- App Lock: biometric default; passcode fallback; **auto-lock after 3 min**
- Soft haptics on unlock success/failure
- **Encryption at rest:** AES-256-GCM for **originals/compiled PDFs** and **sensitive metadata** (attributes, titles if desired)
- Master key derived via **Argon2/PBKDF2**, wrapped in **Secure Enclave/Keychain** via Expo SecureStore
- OCR index (FTS) unencrypted in MVP but sandboxed; Phase 2 → SQLCipher

### 3.7 Performance & UX polish
- Thumbnails generated first to show doc fast (target ≤3s for large PDFs)
- Lists use skeleton rows; thumbnails lazy-load with crossfade
- OCR deprioritized while scrolling

---

## 4) Non-Functional

- iOS 15+  
- PDF limit: ≤50MB or ≤50 pages (offer partial import)  
- OCR concurrency: 1  
- Touch targets ≥44×44pt; text ≥13–14pt  
- Contrast ≥4.5:1; dark mode (avoid pure black)

---

## 5) Data Model (SQLite)

**documents**  
`id, title, category_id, created_at, updated_at, type(image|pdf), page_count, file_uri_encrypted, favorite, size_bytes, status(IMPORTED|OCR_PARTIAL|OCR_DONE)`

**pages**  
`id, document_id, index, thumb_uri, status(PENDING|PROCESSING|DONE|FAILED), ocr_lang, text_encrypted?`

**fts_pages** (FTS5)  
`page_id, content`  *(MVP unencrypted; app sandbox + App Lock)*

**categories**  
`id, name, created_at`

**attributes**  
`id, document_id, attribute_key, value, confidence`

**attribute_definitions**  
`key, label, type(string|date|number), pattern, example`

**ocr_jobs**  
`id, document_id, page_id, state, attempts, last_error`

> Encrypt `file_uri_encrypted` path target files; optionally encrypt `documents.title` & `attributes.value` (store normalized shadow columns for sorting/search if needed).

---

## 6) Libraries & Native Module Plan

### Camera & Scan
- **Keep:** `react-native-document-scanner-plugin` (edge detection, perspective)  
- **Keep:** `expo-image-picker` (Photos import)  
- **Remove:** `expo-camera` if unused

### PDF — **Custom native helper** (Expo config plugin)
- **Create a tiny module** using **PDFKit (iOS)** and **PdfRenderer (Android)**  
- Expose two methods:

```ts
export function renderPageToImage(params: {
  uri: string;
  pageIndex: number;
  targetDPI: number;
}): Promise<{ imageUri: string; width: number; height: number }>;

export function generateThumbnails(params: {
  uri: string;
  indices: number[];
  targetDPI?: number;
}): Promise<Array<{ pageIndex: number; thumbUri: string }>>;
```

- Use cases:
  - Thumbnails for lists/detail scrubber
  - Rasterized bitmaps for OCR (ML Kit)
- **Keep:** `react-native-webview` for PDF viewing
- **Add:** `pdf-lib` for assembling multi-page scan sessions into compiled PDFs + metadata

### OCR
- **Keep:** `react-native-mlkit-ocr` (English)  
  - Lazy-load model on first OCR job  
  - Feed with images from raster helper

### Database (FTS)
- **Keep:** `expo-sqlite` with **FTS5** + LIKE fallback

### Encryption & Keys
- **Add:** `react-native-aes-crypto` (AES-256-GCM) for file encryption  
- **Keep:** `expo-secure-store` for wrapping master key (Keychain/Secure Enclave)  
- MVP: FTS unencrypted; Phase 2 → SQLCipher for full DB encryption

### File System
- **Keep both:** `react-native-fs` & `expo-file-system`  
- **Add abstraction:** `StorageService` for all FS operations

---

## 7) Background OCR Pipeline

- Queue in SQLite (`ocr_jobs`), FIFO, concurrency 1  
- States: `PENDING → PROCESSING → DONE/FAILED` (3 retries, backoff)  
- Pause on low battery (<20%) and resume on foreground/charging  
- Delete temp rasters after each page finishes

---

## 8) Settings (lean)

- **Security:** App Lock, Auto-lock time, Change Passcode  
- **Capture:** Default filter, Remember last used, Image compression toggle  
- **Support:** Share Logs (sanitized), Contact  
- **About:** Version, Licenses

---

## 9) Acceptance Criteria

- Import large PDF (~35MB/≤40 pages): Thumbnails visible ≤3s; OCR pill starts (`OCR x/y`)  
- Search during OCR: partial hits OK; helper message when empty; improves over time  
- Export: correct default (compiled vs original); sheet shows only relevant options; remembers last choice  
- Security: originals + compiled PDFs encrypted at rest; biometric App Lock; auto-lock 3 min; haptics on unlock  
- UI: hit targets ≥44×44pt; text ≥13–14pt; contrast ≥4.5:1; dark mode compliant  
- Stability: OCR never blocks UI; smooth scrolling

---

## 10) Implementation Notes

- **Expo config plugin**: required for native PDF raster helper  
- **Import flow for PDF:**
  1) Save original (encrypt)
  2) Generate thumbnails (first)
  3) Enqueue OCR jobs using raster helper
  4) Update FTS as pages complete
- **Scan session flow:**
  1) Save compiled PDF via `pdf-lib` (encrypt)
  2) Generate thumbnails from compiled PDF
  3) OCR as above
- **Metadata encryption:** encrypt before DB insert; keep normalized shadow columns if sorting/search needed
- **Logs:** JSON, no OCR text or file paths; share via native sheet

---

## 11) Phase 2 (Later)
- SQLCipher + FTS5 for encrypted OCR index  
- iPad/Android support, more OCR languages  
- Native PDF viewer (`react-native-pdf`) for advanced features
