# Testing Guide 🧪

This directory contains all tests for the Pocket Doc application, organized by test type and complexity.

## 📁 Test Structure

```
tests/
├── unit/                   # Unit tests (individual functions/components)
├── integration/           # Integration tests (service interactions)
├── e2e/                   # End-to-end tests (full user workflows)
├── reports/               # Test reports and results
├── test_screenshots/      # Screenshots from test runs
├── conftest.py           # Test configuration and fixtures
└── run_tests.py          # Main test runner
```

## 🚀 Quick Start

### Run All Tests
```bash
# From project root
npm run test

# Or directly
cd tests && python run_tests.py
```

### Run Specific Test Types
```bash
# Unit tests only
python run_tests.py --unit

# Integration tests only  
python run_tests.py --integration

# E2E tests only
python run_tests.py --e2e
```

## 📋 Test Types

### Unit Tests (`unit/`)
Test individual functions and components in isolation.

- **`test_ocr.ts`** - OCR service unit tests
- Fast execution
- No external dependencies
- Mock data and services

### Integration Tests (`integration/`)
Test how different services work together.

- **`test_integration.py`** - Core app integration tests
- **`test_ocr_integration.py`** - OCR service integration tests
- Test service interactions
- Use real services but controlled data

### End-to-End Tests (`e2e/`)
Test complete user workflows from start to finish.

- **`test_use_case_1_upload.py`** - Document upload workflow
- **`test_use_case_2_metadata.py`** - Metadata generation workflow
- **`test_use_case_3_search.py`** - Search and filtering workflow
- Test full user journeys
- Use app UI automation

## 🔧 Test Configuration

### Prerequisites
```bash
# Install Python dependencies
pip install pytest selenium appium-python-client

# Install test requirements
pip install -r requirements.txt
```

### Environment Setup
Tests automatically detect and configure for:
- **Expo Go** (development)
- **iOS Simulator** (iOS testing)
- **Android Emulator** (Android testing)
- **Web Browser** (web testing)

## 📊 Test Reports

Test results are automatically saved to:
- `reports/` - HTML and JSON test reports
- `test_screenshots/` - Screenshots of failures
- Console output with detailed results

## 🎯 Writing Tests

### Unit Test Example
```typescript
// tests/unit/example.test.ts
import { ocrService } from '../../services/ocrService';

describe('OCR Service', () => {
  it('should initialize successfully', async () => {
    await ocrService.initialize();
    const isSupported = await ocrService.isSupported();
    expect(isSupported).toBe(true);
  });
});
```

### Integration Test Example
```python
# tests/integration/example.py
import pytest
from services.database import databaseService
from services.ocr import ocrService

class TestServiceIntegration:
    def test_ocr_database_workflow(self):
        # Test OCR → Database workflow
        result = ocrService.recognize_text("sample.jpg")
        document_id = databaseService.save_document(result)
        assert document_id is not None
```

### E2E Test Example
```python
# tests/e2e/example.py
import pytest
from selenium import webdriver

class TestUserWorkflow:
    def test_upload_document_workflow(self):
        # Test complete upload workflow
        driver = webdriver.Chrome()
        driver.get("http://localhost:8081")
        
        # Navigate to upload
        upload_btn = driver.find_element_by_text("Upload")
        upload_btn.click()
        
        # Upload file
        file_input = driver.find_element_by_type("file")
        file_input.send_keys("test_document.jpg")
        
        # Verify success
        success_msg = driver.find_element_by_text("Document uploaded")
        assert success_msg.is_displayed()
```

## 🐛 Debugging Tests

### Common Issues

#### 1. App Not Running
```bash
# Start the app first
npm run dev

# Then run tests
npm run test
```

#### 2. Service Initialization Failures
```bash
# Check service logs
python run_tests.py --verbose

# Test individual services
python -c "from services.ocr import ocrService; ocrService.test()"
```

#### 3. Screenshot Capture Failures
```bash
# Check permissions
ls -la test_screenshots/

# Run with screenshot debugging
python run_tests.py --debug-screenshots
```

## 📈 Test Coverage

Current test coverage:
- **Unit Tests**: Core services and utilities
- **Integration Tests**: Service interactions and data flow
- **E2E Tests**: Critical user workflows

### Coverage Goals
- [ ] 80%+ unit test coverage
- [ ] 100% critical path coverage
- [ ] All user workflows tested
- [ ] Cross-platform compatibility

## 🚀 Continuous Integration

Tests are designed to run in CI/CD environments:
- Automated on pull requests
- Nightly full test runs
- Performance regression testing
- Cross-platform compatibility checks

## 📚 Additional Resources

- [Expo Testing Guide](https://docs.expo.dev/guides/testing/)
- [React Native Testing](https://reactnative.dev/docs/testing-overview)
- [Pytest Documentation](https://docs.pytest.org/)
- [Selenium WebDriver](https://selenium-python.readthedocs.io/)

---

**Happy Testing! 🎉** 