# PDF Processing Error Investigation

## Context
PocketDoc allows users to upload PDFs which are then sent to OpenAI’s Vision-enabled Chat Completions endpoint for metadata extraction.  While image uploads have always worked, PDF uploads started failing after OpenAI’s April 2025 API update.

---

## 1 · Initial Error & Diagnosis  (Week 1)
```json
{
  "error": {
    "message": "messages[0].content[0].type must be one of 'text', 'image_url', 'audio', 'file'. Found 'input_text'.",
    "type": "invalid_request_error",
    "code": "content_validation"
  }
}
```
**Findings**
* Our request payload used `type: "input_text"`, a legacy alias that was removed in the April 2025 spec.
* We were also embedding the raw Base-64 PDF inside the `content` array – this is no longer accepted.

### Root Cause
The implementation was still following the deprecated *inline-PDF* approach instead of the new **two-step _file_id_ flow** defined in the [OpenAI Vision Spec §“Files”](https://platform.openai.com/docs/api-reference/files).

---

## 2 · First Fix Implemented  (Week 1)
* Added `uploadFileToOpenAI(uri, apiKey)` helper → `POST /v1/files` with `purpose="vision"`.
* Chat request now references the returned `file_id`:
  ```ts
  content: [
    { type: "file", file_id },
    { type: "text", text: prompt }
  ]
  ```
* Removed all usage of `input_text`.

Unit & manual tests on web passed; image uploads continued to work.

---

## 3 · Latest Error (Week 2)
The chat call now succeeds, but the *file upload* step fails on mobile.  Full log as provided by QA:
```text
[expo] 400 – { "error": "No file uploaded.  Content-Type must be multipart/form-data" }
```

---

## 4 · Second-Round Analysis
* **Where it fails:** `fetch(..., { method:'POST', body:FormData })` from React-Native/Expo.
* **Why:** The native bridge silently drops the file stream for local `file://` URIs when the payload is large (>2 MB). OpenAI therefore receives an empty request and returns HTTP 400.
* **Resolution:** Switch to Expo’s *native* multipart uploader which streams the file correctly:
  ```ts
  import * as FileSystem from 'expo-file-system';
  
  const uploadRes = await FileSystem.uploadAsync(
    'https://api.openai.com/v1/files',
    uri,
    {
      fieldName: 'file',
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      parameters: { purpose: 'vision' },
      headers: { Authorization: `Bearer ${apiKey}` }
    }
  );
  const { id: file_id } = JSON.parse(uploadRes.body);
  ```

---

## 5 · Next-Step Checklist
- [ ] Replace `fetch + FormData` with `FileSystem.uploadAsync()` in `uploadFileToOpenAI`.
- [ ] Retest PDF upload on iOS & Android physical devices (>5 MB).
- [ ] Add retry logic on `ENETUNREACH` & `504` gateway-timeout.
- [ ] Cache uploaded `file_id` locally to avoid duplicate uploads of the same document.
- [ ] Update unit tests & e2e script `tests/e2e/test_use_case_1_upload.py`.

---

## Appendix A · Key Code Diff (abridged)
```diff
- const formData = new FormData();
- formData.append('purpose', 'vision');
- formData.append('file', {
-   uri,
-   name: filename,
-   type: 'application/pdf'
- });
- const res = await fetch('https://api.openai.com/v1/files', {
-   method: 'POST',
-   headers: { 'Authorization': `Bearer ${apiKey}` },
-   body: formData
- });
+ const uploadRes = await FileSystem.uploadAsync(
+   'https://api.openai.com/v1/files',
+   uri,
+   {
+     fieldName: 'file',
+     uploadType: FileSystem.FileSystemUploadType.MULTIPART,
+     parameters: { purpose: 'vision' },
+     headers: { Authorization: `Bearer ${apiKey}` }
+   }
+ );
```

> **Status:** Pending implementation & QA verification. 