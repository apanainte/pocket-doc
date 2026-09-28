# TASKS.md - PocketDoc MVP Status

**Last Updated**: September 2026 - MVP tested via TestFlight; refresh planned for late 2026

---

## Current MVP Status

### ✅ **MVP FEATURES COMPLETED**
- **3-Screen Navigation**: Library, Upload, Settings ✅
- **Document Management**: Upload (4 methods), search, viewing ✅
- **Database**: SQLite with migration system ✅
- **Authentication**: Basic biometric authentication ✅
- **UI/UX**: Compact, responsive design ✅
- **Honest OCR**: ML Kit only, failures shown as failures (no fake text) ✅
- **Categories**: Single-level categories with filter chips in the Library ✅

### 📦 **Distribution**
- MVP distributed to testers through TestFlight (summer 2025)
- Not yet on the public App Store

### 🔄 **Next: late-2026 refresh**
- Scope to be defined (see Post-MVP list below)
- Housekeeping: remove unused `components/AuthScreen.tsx` and `services/passkeyAuth.ts` prototype

---

## MVP Critical Tasks

### ✅ **Priority 1: Fix OCR Fake Content (done)**
- [x] Remove fake text generation from OCR service
- [x] Show honest "OCR failed" messages instead of fake content
- [ ] Add manual text entry option when OCR fails (candidate for the refresh)
- **Why Critical**: User trust - fake results undermine app credibility

### ✅ **Priority 2: Basic Categories (done)**
- [x] Implement categories table in database
- [x] Add category selection during document upload
- [x] Add basic category management in Settings
- [x] Display categories in document cards
- **Why Critical**: PRD explicitly requires "single-level manual categorization"

---

## MVP Success Criteria
- [x] **Core Upload**: 4 upload methods working ✅
- [x] **Document Storage**: Local SQLite storage ✅  
- [x] **Search**: Text search functionality ✅
- [x] **3-Screen Navigation**: Library, Upload, Settings ✅
- [x] **Basic Security**: Biometric authentication ✅
- [x] **Honest OCR**: No fake content generation ✅
- [x] **Categories**: Single-level categorization ✅

---

## Post-MVP (Future Releases)
- **Architecture**: MVVM pattern implementation
- **Advanced Security**: Passcode management
- **Performance**: OCR service optimization
- **Code Quality**: Service layer refactoring

---

## Current Status
- **MVP Progress**: Complete; tested via TestFlight
- **Next**: refresh planned for late 2026
- **Blockers**: none for the MVP
- **Ready for**: refresh planning