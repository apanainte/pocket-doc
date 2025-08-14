# PLANNING.md — Architectural Decisions (PocketDoc)

This document records the key architectural decisions for the MVP, derived directly from `PRD.md`. It intentionally excludes delivery plans and focuses only on “what” and “why”.

---

## ADR‑001: Platform, Framework, and OS Target
Status: Accepted

- iOS‑first MVP; minimum iOS 15.
- React Native (Expo Managed) with EAS Build.
- Add a small native helper via an Expo config plugin where needed (PDF rasterization on iOS using PDFKit).
- Why: fastest path to a polished iOS MVP with limited native surface; EAS simplifies distribution.

## ADR‑002: App Architecture Style
Status: Accepted

- Modular services + React Context for app‑wide state; avoid global state frameworks unless justified.
- Screen logic remains thin; business logic in `services/`; UI in `components/`.
- Why: clarity, testability, and alignment with current codebase (`services/`, `contexts/`).

## ADR‑003: Navigation & IA
Status: Accepted

- Tabs: Home | + | Documents | Settings; central “+” opens action sheet (Scan | Import Photos | Import PDF).
- Stack navigators for detail/modals.
- Why: matches `PRD.md` IA and common iOS patterns.

## ADR‑004: Local Database & Search
Status: Accepted

- SQLite via `expo-sqlite` with FTS5 for full‑text search over OCR content.
- MVP: FTS tables unencrypted (app sandbox + App Lock); Phase 2: migrate to SQLCipher for full DB encryption.
- Schema follows `PRD.md` tables: `documents`, `pages`, `fts_pages`, `categories`, `attributes`, `attribute_definitions`, `ocr_jobs`.
- Why: reliable on‑device search with progressive updates; incremental hardening in Phase 2.

## ADR‑005: File System Layout & Encryption
Status: Accepted

- Directories (app sandbox):
  - `originals/` (encrypted sources), `compiled/` (encrypted compiled PDFs), `thumbs/` (thumbnails), `temp/` (transient rasters).
- Encryption: AES‑256‑GCM using `react-native-aes-crypto`.
- Key handling: master key derived (Argon2/PBKDF2), wrapped and stored in Keychain via `expo-secure-store`.
- Thumbnails remain unencrypted; temp rasters deleted after each page OCR completes.
- Optionally encrypt sensitive metadata (e.g., attributes, titles) while retaining normalized shadows for sort/search if needed.
- Why: balances performance and security for MVP; respects `PRD.md` guidance.

## ADR‑006: OCR Engine & Model Strategy
Status: Accepted

- Use `react-native-mlkit-ocr` (English only for MVP).
- Lazy‑load model on first OCR job; no multi‑engine fallback in MVP.
- Why: meets scope quickly; reduces implementation complexity.

## ADR‑007: Progressive OCR Pipeline
Status: Accepted

- Queue `ocr_jobs` in SQLite; FIFO; concurrency = 1.
- States: `PENDING → PROCESSING → DONE/FAILED` with 3 retries and exponential backoff.
- Pause OCR below 20% battery; resume on foreground/charging.
- Write recognized text to `fts_pages` per page; delete temp rasters immediately.
- Why: predictable resource usage; aligns with UX requirement to keep UI responsive.

## ADR‑008: PDF Handling
Status: Accepted

- Viewing: `react-native-webview` for MVP.
- Assembly: `pdf-lib` to compile scan sessions into PDFs and append metadata.
- Rasterization: native iOS helper (Expo config plugin) using PDFKit to produce bitmaps for thumbnails and OCR.
- Default raster DPI: 180 DPI (tunable; chosen to balance legibility and performance for OCR and thumbnails).
- Why: fast, reliable MVP without shipping a heavy native PDF viewer.

## ADR‑009: Capture & Import
Status: Accepted

- Scan: `react-native-document-scanner-plugin` with edge detection and perspective fix; default filter B/W; remember last.
- Import: `expo-image-picker` (multi‑select images) and native PDF picker.
- PDF constraints: ≤50MB or ≤50 pages; offer “Import first 50 pages” fallback.
- Why: meets functional and performance constraints in `PRD.md`.

## ADR‑010: Security & App Lock
Status: Accepted

- App Lock enabled by default: biometrics with passcode fallback; auto‑lock after 3 minutes; soft haptics.
- All originals and compiled PDFs encrypted at rest; sensitive metadata encrypted where required by policy.
- Logs are sanitized: no OCR text or file paths; shareable via native sheet.
- Why: user trust, platform compliance, and App Store readiness.

## ADR‑011: Performance & UX Guarantees
Status: Accepted

- Thumbnails generated first to meet ≤3s visibility target on large PDFs.
- Lists use skeletons; thumbnails lazy‑load with crossfade.
- OCR deprioritized while scrolling to keep 60 FPS.
- Why: preserves perceived performance while background work progresses.

## ADR‑012: Export Behavior Defaults
Status: Accepted

- Scan sessions export to compiled PDF by default.
- Imported PDFs/images default to exporting the original file.
- When both make sense, show an export choice sheet and remember last selection.
- Why: consistent with `PRD.md` and platform expectations.

## ADR‑013: Offline‑Only & Privacy Posture
Status: Accepted

- No cloud sync/backups in MVP; all processing on‑device.
- No analytics/tracking; only local sanitized logs for support.
- Why: simplifies privacy compliance and architecture; aligns with scope.

## ADR‑014: Error Handling Philosophy
Status: Accepted

- Fail visible, fail fast, and recover automatically where safe.
- OCR/job retries capped (3) with backoff; surface status in UI; never block core navigation.
- Why: resilience without user confusion; keeps UI responsive.

## ADR‑015: Accessibility & Theming
Status: Accepted

- Touch targets ≥44×44pt; typography ≥13–14pt; contrast ≥4.5:1; support dark mode (avoid pure black).
- Why: meets `PRD.md` non‑functional requirements and iOS HIG.

---

Open decisions to revisit (if product direction changes):
- Encrypting `documents.title` by default vs. Phase 2 only.
- Final raster DPI for thumbnails/OCR based on device tests (180–200 DPI range).


