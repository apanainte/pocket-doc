# Pocket Doc Mobile Test Suite

This directory contains comprehensive automated tests for the Pocket Doc mobile application. The test suite validates all three primary use cases using Appium for mobile automation.

## 📋 Test Coverage

### Use Case 1: Upload and Classify Documents
- **File**: `test_use_case_1_upload.py`
- **Coverage**: File upload, AI metadata generation, metadata editing, document saving
- **Performance**: Upload completion < 5 seconds
- **Validation**: File type validation, error handling

### Use Case 2: Visualize and Edit Metadata
- **File**: `test_use_case_2_metadata.py`  
- **Coverage**: Document viewing, metadata editing, validation, persistence
- **Performance**: Updates complete < 1 second
- **Validation**: Input validation, error boundaries

### Use Case 3: Search and Retrieve Documents
- **File**: `test_use_case_3_search.py`
- **Coverage**: Search functionality, filtering, relevance ranking
- **Performance**: Search results < 2 seconds
- **Validation**: Various search queries, edge cases

### Integration Tests
- **File**: `test_integration.py`
- **Coverage**: Complete end-to-end workflows, cross-feature interactions
- **Scenarios**: Multi-document workflows, error recovery, data persistence

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# Install Python testing packages (already done for you)
pip install appium-python-client pytest selenium requests

# Install Appium server
npm install -g appium
npm install -g @appium/doctor
```

### 2. Verify Setup
```bash
# Check iOS setup
appium-doctor --ios

# Check Android setup  
appium-doctor --android
```

### 3. Start Required Services
```bash
# Terminal 1: Start Appium server
appium --port 4723

# Terminal 2: Start your React Native app
cd /path/to/pocket-doc
expo start
```

### 4. Prepare Device/Simulator
- **iOS**: Open simulator, install Expo Go, load your app
- **Android**: Start emulator, install Expo Go, load your app

### 5. Run Tests
```bash
# Run all tests
python tests/run_tests.py --suite all

# Run specific use case
python tests/run_tests.py --suite use_case_1

# Run with HTML report
python tests/run_tests.py --suite all --report-format html
```

## 🔧 Detailed Setup

### Prerequisites
- **Node.js** (for Appium)
- **Python 3.7+** (for test scripts)
- **Xcode** (for iOS testing)
- **Android Studio** (for Android testing)

### iOS Setup
1. **Install Xcode** from App Store
2. **Install Xcode Command Line Tools**:
   ```bash
   xcode-select --install
   ```
3. **Install iOS Simulator** (included with Xcode)
4. **Start iOS Simulator**:
   ```bash
   open -a Simulator
   ```
5. **Install Expo Go** in simulator from App Store

### Android Setup
1. **Install Android Studio**
2. **Configure Android SDK** through Android Studio
3. **Create Virtual Device** (AVD):
   - Open AVD Manager in Android Studio
   - Create new virtual device
   - Choose system image (API 28+)
   - Start the emulator
4. **Install Expo Go** from Play Store in emulator

### Appium Setup
1. **Install Appium**:
   ```bash
   npm install -g appium
   ```
2. **Install Appium Doctor**:
   ```bash
   npm install -g @appium/doctor
   ```
3. **Verify iOS setup**:
   ```bash
   appium-doctor --ios
   ```
4. **Verify Android setup**:
   ```bash
   appium-doctor --android
   ```
5. **Start Appium Server**:
   ```bash
   appium --port 4723
   ```

## 🎯 Running Tests

### Test Runner Script
The main test runner (`run_tests.py`) provides a comprehensive interface:

```bash
# Show setup instructions
python tests/run_tests.py --setup-only

# Validate requirements without running tests
python tests/run_tests.py --dry-run

# Run specific test suite
python tests/run_tests.py --suite use_case_1
python tests/run_tests.py --suite use_case_2  
python tests/run_tests.py --suite use_case_3
python tests/run_tests.py --suite integration

# Run all tests
python tests/run_tests.py --suite all

# Generate different report formats
python tests/run_tests.py --suite all --report-format html
python tests/run_tests.py --suite all --report-format json
python tests/run_tests.py --suite all --report-format xml

# Take screenshots on failures
python tests/run_tests.py --suite all --screenshot-on-failure

# Verbose output
python tests/run_tests.py --suite all --verbose
```

### Direct Pytest Usage
You can also run tests directly with pytest:

```bash
# Run specific test file
pytest tests/test_use_case_1_upload.py -v

# Run all tests
pytest tests/ -v

# Generate HTML report
pytest tests/ --html=reports/test_report.html --self-contained-html

# Run with screenshots on failure
pytest tests/ --screenshot-on-failure
```

## 📊 Test Reports

Test reports are generated in the `tests/reports/` directory:

- **HTML Reports**: Interactive reports with test details, timings, and screenshots
- **JSON Reports**: Machine-readable data for CI/CD integration
- **XML Reports**: JUnit-compatible format for Jenkins/CI systems

Screenshots are saved in `tests/test_screenshots/` with timestamps.

## 🛠 Configuration

### Test Configuration
Edit `tests/conftest.py` to modify:
- **Device settings** (simulator versions, device names)
- **Timeouts** (default: 10s, upload: 30s, search: 5s)
- **Test data** (document types, search queries)

### Platform-Specific Settings
The test framework auto-detects the platform but you can specify:

```bash
# Force iOS testing
python tests/run_tests.py --platform ios --suite all

# Force Android testing  
python tests/run_tests.py --platform android --suite all
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Appium Server Not Starting
```bash
# Check if port is in use
lsof -i :4723

# Kill existing process
kill -9 <PID>

# Restart Appium
appium --port 4723
```

#### 2. Device/Simulator Not Detected
```bash
# iOS: Check simulators
xcrun simctl list devices

# Android: Check emulators
adb devices
```

#### 3. App Not Loading in Expo Go
- Ensure your React Native app is running (`expo start`)
- Check that device and development machine are on same network
- Verify QR code scanning or manual URL entry

#### 4. Tests Failing to Find Elements
- Check if app is fully loaded before tests start
- Verify element locators match your app's UI
- Take screenshots during failures to debug UI state

#### 5. Permission Issues
```bash
# iOS: Reset simulator
xcrun simctl erase all

# Android: Reset emulator data
# Or create new AVD
```

### Environment Variables
Set these if needed:
```bash
export ANDROID_HOME=/path/to/android/sdk
export JAVA_HOME=/path/to/java
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### Debug Mode
Run tests with verbose output and screenshots:
```bash
python tests/run_tests.py --suite use_case_1 --verbose --screenshot-on-failure
```

## 📈 Performance Requirements

The tests validate these performance benchmarks:

| Operation | Requirement | Test Validation |
|-----------|-------------|-----------------|
| Document Upload | < 5 seconds | ✅ Measured and asserted |
| Metadata Update | < 1 second | ✅ Measured and asserted |
| Search Results | < 2 seconds | ✅ Measured and asserted |

## 🎯 Test Scenarios

### Upload Tests
- Image upload with metadata generation
- PDF upload with metadata generation  
- Camera capture and upload
- File validation and error handling
- Performance benchmarking

### Metadata Tests
- View document metadata
- Edit title, description, tags
- Validation error handling
- Cancel editing
- Document deletion

### Search Tests
- Search by title keywords
- Search by description content
- Search by tags
- No results handling
- Performance testing
- Case-insensitive search
- Special character handling
- Multi-keyword search

### Integration Tests
- Complete document workflow (upload → edit → search)
- Multiple document scenarios
- Error recovery testing
- Data persistence validation
- Cross-platform compatibility

## 🔄 CI/CD Integration

For continuous integration, use:

```bash
# CI-friendly command
python tests/run_tests.py --suite all --report-format xml --verbose

# Exit codes:
# 0: All tests passed
# 1: Some tests failed or setup issues
```

## 📝 Test Data

Test data is defined in `tests/conftest.py`:

```python
TEST_DOCUMENTS = {
    'image': {
        'title': 'Test Recipe Card',
        'description': 'Handwritten family recipe...',
        'tags': ['recipe', 'cooking', 'family', 'food']
    },
    'pdf': {
        'title': 'Business Contract Document', 
        'description': 'Legal agreement...',
        'tags': ['contract', 'business', 'legal']
    }
}
```

## 🤝 Contributing

When adding new tests:

1. **Follow naming convention**: `test_[feature]_[scenario].py`
2. **Use helper methods**: Defined in `conftest.py`
3. **Add documentation**: Docstrings for all test methods
4. **Include assertions**: Validate expected outcomes
5. **Take screenshots**: For debugging failed tests
6. **Update this README**: If adding new test scenarios

## 📞 Support

If you encounter issues:

1. **Check setup requirements** with `--setup-only`
2. **Validate environment** with `--dry-run`
3. **Review test reports** in `tests/reports/`
4. **Check screenshots** in `tests/test_screenshots/`
5. **Run individual tests** to isolate issues

For additional help, refer to:
- [Appium Documentation](http://appium.io/docs/)
- [pytest Documentation](https://docs.pytest.org/)
- [Expo Testing Guide](https://docs.expo.dev/guides/testing/) 