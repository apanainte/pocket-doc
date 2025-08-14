# TASKS.md — Current Status + Active Tasks (PocketDoc)

This living tracker aligns with `PRD.md`, `PLANNING.md` (Architectural Decisions), and `CLAUDE.md`.

---

## Current status

- Branch: `redesign` (active)
- Expo scaffold present; tabs structure: Home | + | Documents | Settings
- Core dirs present: `services/`, `contexts/`, `components/`
- iOS assets/permissions scaffolded
- Open decisions: encrypt `documents.title` in MVP; raster DPI target (180–200)

---

## Active tasks (next 7–10 days)

### Foundations
- [ ] Database: implement PRD schema (`documents`, `pages`, `fts_pages`, `categories`, `attributes`, `attribute_definitions`, `ocr_jobs`) + migrations
- [ ] Replace legacy `documents_fts` with `fts_pages` (page-level FTS); update search queries to join via `pages`
- [ ] StorageService: unify `react-native-fs` + `expo-file-system`; dirs: `originals/`, `compiled/`, `thumbs/`, `temp/`
- [ ] Refactor existing file writes (e.g., current file storage usage) to go through `StorageService`
- [ ] Security scaffolding: key derivation (Argon2/PBKDF2), wrap via `expo-secure-store`

### Capture & Import
- [ ] Scan flow: `react-native-document-scanner-plugin` (edge detect, perspective fix, default B/W, remember last)
- [ ] Photos import: `expo-image-picker` multi‑select; validate size/long edge (≤3000px, ≈85% JPEG)
- [ ] PDF import: native picker; enforce ≤50MB or ≤50 pages; offer “Import first 50 pages”

### PDF & Thumbnails
- [ ] iOS raster helper (Expo config plugin using PDFKit); expose `renderPageToImage`, `generateThumbnails`
- [ ] Thumbnails first: show within ≤3s for large PDFs; list skeletons + crossfade
- [ ] `pdf-lib` assembly: compile scan sessions; attach minimal metadata

### Progressive OCR
- [ ] Queue: SQLite `ocr_jobs` FIFO, concurrency = 1; states with 3 retries + backoff
- [ ] ML Kit: lazy model load; per‑page OCR → `fts_pages`; delete rasters after each page
- [ ] Remove non‑MLKit OCR fallbacks (e.g., "intelligent analysis"); enforce MLKit English only in MVP
- [ ] UX: pill `OCR x/y`, per‑page spinner/✓, top “Indexing…”, quiet completion toast
- [ ] Power: pause <20% battery; resume on charge/foreground

### Organization & Metadata
- [ ] Categories: single category; starter templates (ID, Receipt, Invoice, Contract, Certificate, Other)
- [ ] Attributes: show 6–8 chips; auto‑fill from OCR + confidence; inline edit

### Search
- [ ] Full‑text with FTS5 over `fts_pages` + LIKE fallback
- [ ] Toggle: All documents / This category; recent searches (max 3)
- [ ] Search during OCR: partial results OK; helper when empty and OCR running

### Navigation & IA
- [ ] Replace `Upload` tab with centered “+” tab button opening action sheet (Scan | Import Photos | Import PDF)
- [ ] Keep stack navigators for detail/review modals

### Security & App Lock
- [ ] File encryption: AES‑256‑GCM for originals and compiled PDFs
- [ ] Metadata encryption: sensitive fields; normalized shadows if needed
- [ ] App Lock: biometric default, passcode fallback, auto‑lock 3 min, soft haptics

### Export
- [ ] Defaults: compiled PDF for scans; original for imported PDF/single photo
- [ ] Choice sheet when both relevant; remember last selection

### Logging & Privacy
- [ ] Sanitized JSON logs (no OCR text or file paths); share via native sheet
- [ ] Verify privacy manifests and permission strings

### Performance & A11y
- [ ] Deprioritize OCR while scrolling; maintain smooth 60 FPS
- [ ] Touch ≥44×44pt; text ≥13–14pt; contrast ≥4.5:1; dark mode compliant

### Types & Tests
- [ ] Update `types/` to PRD models (`Document`, `Page`, `OcrJob`, `Attribute`, etc.) and statuses
- [ ] Unit tests: `StorageService` (encrypt/decrypt), OCR queue logic, DB search accessors
- [ ] Integration/E2E: PDF import → thumbs ≤3s → enqueue OCR → progressive search; export defaults; App Lock flow

---

## Remediation from code review (gaps vs PRD/PLANNING)
- [ ] DB: add `pages`, `fts_pages`, `ocr_jobs`, `attributes`, `attribute_definitions`; extend `documents` per PRD; migrate data
- [ ] Search: deprecate `documents_fts`; switch to `fts_pages` per‑page indexing
- [ ] OCR: implement single‑worker queue; remove non‑MLKit fallback; add battery pause/resume
- [ ] FS/Crypto: implement AES‑GCM; key derivation + SecureStore; restructure files under `originals/|compiled/|thumbs/|temp/`
- [ ] PDF: add raster helper (Expo config plugin + PDFKit); generate thumbnails first; assemble with `pdf-lib`
- [ ] Navigation: center “+” sheet per PRD; wire Scan/Import actions
- [ ] Export: defaults + remember last selection
- [ ] App Lock: 3‑min auto‑lock + haptics
- [ ] Logging: sanitized JSON logs; share action in Settings

---

## Recommended execution order + checkpoints

### Phase 0 — Baseline stabilization
- [ ] Ensure app boots; run all tests; record baseline
- Checkpoint:
  - Run: `npm run dev` (app), then `cd tests && python run_tests.py`

### Phase 1 — Database schema to PRD
- [ ] Add tables: `pages`, `fts_pages`, `ocr_jobs`, `attributes`, `attribute_definitions`
- [ ] Extend `documents` with PRD fields; keep compatibility accessors
- [ ] Keep current search temporarily (do not switch to `fts_pages` yet)
- Checkpoint:
  - Unit: DB migrations and presence of tables/indexes → `python run_tests.py --unit`
  - Integration: read/write new tables → `python run_tests.py --integration`

### Phase 2 — StorageService + encryption
- [ ] Implement directories `originals/`, `compiled/`, `thumbs/`, `temp/`
- [ ] AES‑256‑GCM for originals/compiled; Argon2/PBKDF2 key derivation; wrap in SecureStore
- [ ] Refactor file writes to go through `StorageService`
- Checkpoint:
  - Unit: encrypt/decrypt round‑trip → `python run_tests.py --unit`
  - Integration: import→store→decryptToTemp() → `python run_tests.py --integration`

### Phase 3 — PDF raster helper + thumbnails + assembly
- [ ] Expo config plugin (iOS) using PDFKit: `renderPageToImage`, `generateThumbnails`
- [ ] `pdf-lib` to assemble scan sessions to compiled PDFs
- [ ] Thumbnails first: skeletons then crossfade; first thumb ≤3s
- Checkpoint:
  - Integration: large PDF first thumbnail ≤3s → `python run_tests.py --integration`
  - E2E: `tests/e2e/test_use_case_1_upload.py` → `python run_tests.py --e2e`

### Phase 4 — OCR queue (ML Kit only)
- [ ] Remove fallback; MLKit English only; lazy model load
- [ ] Single‑worker FIFO, retries/backoff; pause <20% battery; resume on charge/foreground
- [ ] Per page: raster→OCR→`fts_pages`; delete rasters; UI signals (pill/spinners/toast)
- Checkpoint:
  - Unit: worker logic/state transitions → `python run_tests.py --unit`
  - Integration: enqueue→progressive updates→cleanup → `python run_tests.py --integration`
  - E2E: `tests/e2e/test_use_case_3_search.py` → `python run_tests.py --e2e`

### Phase 5 — Search over `fts_pages`
- [ ] Switch search to page‑level FTS with LIKE fallback; scope toggle; recent searches
- Checkpoint:
  - Integration: partial results during OCR → `python run_tests.py --integration`
  - E2E: search workflow → `python run_tests.py --e2e`

### Phase 6 — Navigation: center “+” sheet
- [ ] Replace `Upload` tab with centered “+” action sheet; wire Scan/Import
- Checkpoint:
  - E2E: navigation + action sheet reachable → `python run_tests.py --e2e`

### Phase 7 — Export defaults + memory
- [ ] Defaults per type; choice sheet when both applicable; remember last
- Checkpoint:
  - Integration: export behavior per type → `python run_tests.py --integration`
  - E2E: export flow → `python run_tests.py --e2e`

### Phase 8 — App Lock + haptics
- [ ] Auto‑lock after 3 min; biometric default; passcode fallback; haptics
- Checkpoint:
  - Unit: inactivity timer; lock/unlock → `python run_tests.py --unit`
  - E2E: lock flow → `python run_tests.py --e2e`

### Phase 9 — Logging & privacy
- [ ] Sanitized JSON logs; share from Settings
- Checkpoint:
  - Integration: log redaction & share file → `python run_tests.py --integration`

### Phase 10 — UX performance & a11y
- [ ] Deprioritize OCR while scrolling; 60 FPS; skeletons; a11y labels; contrast; touch sizes
- Checkpoint:
  - E2E: smoke across flows and performance timings → `python run_tests.py --e2e`
