import pytest
import os
import time
from appium import webdriver
from appium.webdriver.common.appiumby import AppiumBy
from appium.options.ios import XCUITestOptions
from appium.options.android import UiAutomator2Options

class TestConfig:
    """Test configuration and constants"""
    
    # Timeouts
    DEFAULT_TIMEOUT = 10
    UPLOAD_TIMEOUT = 30
    SEARCH_TIMEOUT = 5
    
    # Test data
    TEST_DOCUMENTS = {
        'image': {
            'title': 'Test Recipe Card',
            'description': 'Handwritten family recipe with ingredients and instructions',
            'tags': ['recipe', 'cooking', 'family', 'food'],
            'file_type': 'image'
        },
        'pdf': {
            'title': 'Business Contract Document',
            'description': 'Legal agreement between parties with terms and conditions',
            'tags': ['contract', 'business', 'legal', 'agreement'],
            'file_type': 'pdf'
        }
    }
    
    # Search test cases
    SEARCH_TEST_CASES = [
        {
            'query': 'recipe',
            'expected_min_results': 1,
            'description': 'Search by tag'
        },
        {
            'query': 'business',
            'expected_min_results': 1,
            'description': 'Search by title keyword'
        },
        {
            'query': 'agreement',
            'expected_min_results': 1,
            'description': 'Search by description keyword'
        },
        {
            'query': 'nonexistent',
            'expected_min_results': 0,
            'description': 'Search with no results'
        }
    ]

class MobileTestBase:
    """Base class for mobile testing with Appium"""
    
    def __init__(self):
        self.driver = None
        self.platform = None
        
    def setup_ios_driver(self):
        """Set up iOS driver. Uses real device if IOS_UDID is provided; otherwise targets simulator."""
        options = XCUITestOptions()
        options.platform_name = "iOS"
        options.automation_name = "XCUITest"
        options.new_command_timeout = 300
        options.no_reset = True

        # App under test (already installed via Xcode/Expo)
        options.bundle_id = "com.pocketdoc.app"

        ios_udid = os.environ.get('IOS_UDID')
        if ios_udid:
            # Real device config
            options.udid = ios_udid
            # Optional: provide org/team for WDA auto-signing if needed
            xcode_org_id = os.environ.get('XCODE_ORG_ID')
            xcode_signing_id = os.environ.get('XCODE_SIGNING_ID', 'iPhone Developer')
            if xcode_org_id:
                options.set_capability('xcodeOrgId', xcode_org_id)
                options.set_capability('xcodeSigningId', xcode_signing_id)
            # Unique WDA bundle id for your team (must be trusted on device)
            wda_bundle_id = os.environ.get('WDA_BUNDLE_ID', 'com.pocketdoc.WebDriverAgentRunner')
            options.set_capability('updatedWDABundleId', wda_bundle_id)
            # Improve visibility and stability
            options.set_capability('showXcodeLog', True)
            options.set_capability('waitForQuiescence', False)
            # Improve WDA stability on device
            options.set_capability('usePrebuiltWDA', False)
            options.set_capability('wdaLaunchTimeout', 120000)
            options.set_capability('wdaConnectionTimeout', 120000)
            options.set_capability('allowProvisioningUpdates', True)
            options.set_capability('shouldUseSingletonTestManager', True)
        else:
            # Simulator fallback
            options.platform_version = os.environ.get('IOS_SIM_VERSION', '18.5')
            options.device_name = os.environ.get('IOS_SIM_DEVICE', 'iPhone 16 Pro')

        # Connect to Appium server
        self.driver = webdriver.Remote('http://localhost:4723', options=options)
        self.platform = "iOS"
        return self.driver
    
    def setup_android_driver(self):
        """Set up Android driver for emulator testing"""
        options = UiAutomator2Options()
        options.platform_name = "Android"
        options.platform_version = "11"  # Adjust based on your emulator
        options.device_name = "Android Emulator"
        options.app_package = "host.exp.exponent"  # Expo Go package
        options.app_activity = "host.exp.exponent.MainActivity"
        options.automation_name = "UiAutomator2"
        options.new_command_timeout = 300
        options.no_reset = True
        
        # Connect to Appium server
        self.driver = webdriver.Remote('http://localhost:4723', options=options)
        self.platform = "Android"
        return self.driver
    
    def wait_for_element(self, locator, timeout=TestConfig.DEFAULT_TIMEOUT):
        """Wait for element to be present and return it"""
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
        
        wait = WebDriverWait(self.driver, timeout)
        return wait.until(EC.presence_of_element_located(locator))
    
    def wait_and_click(self, locator, timeout=TestConfig.DEFAULT_TIMEOUT):
        """Wait for element and click it"""
        element = self.wait_for_element(locator, timeout)
        element.click()
        return element
    
    def wait_and_send_keys(self, locator, text, timeout=TestConfig.DEFAULT_TIMEOUT):
        """Wait for element and send keys to it"""
        element = self.wait_for_element(locator, timeout)
        element.clear()
        element.send_keys(text)
        return element
    
    def scroll_to_element(self, element_text):
        """Scroll to find an element with specific text"""
        if self.platform == "iOS":
            # iOS scrolling
            self.driver.execute_script("mobile: scroll", {"direction": "down"})
        else:
            # Android scrolling
            self.driver.find_element(
                AppiumBy.ANDROID_UIAUTOMATOR,
                f'new UiScrollable(new UiSelector()).scrollIntoView(text("{element_text}"))'
            )
    
    def take_screenshot(self, filename):
        """Take screenshot for test evidence"""
        screenshot_dir = "test_screenshots"
        os.makedirs(screenshot_dir, exist_ok=True)
        
        timestamp = int(time.time())
        screenshot_path = os.path.join(screenshot_dir, f"{filename}_{timestamp}.png")
        self.driver.save_screenshot(screenshot_path)
        print(f"Screenshot saved: {screenshot_path}")
        return screenshot_path

@pytest.fixture(scope="session")
def mobile_driver():
    """Pytest fixture to set up and tear down mobile driver"""
    test_base = MobileTestBase()
    
    # Try to set up iOS driver first, fallback to Android
    try:
        driver = test_base.setup_ios_driver()
        print("iOS driver initialized successfully")
    except Exception as e:
        print(f"iOS driver failed: {e}")
        try:
            driver = test_base.setup_android_driver()
            print("Android driver initialized successfully")
        except Exception as e:
            print(f"Android driver failed: {e}")
            pytest.skip("No mobile driver available. Please start Appium server and simulator/emulator.")
    
    yield test_base
    
    # Cleanup
    if test_base.driver:
        test_base.driver.quit()

@pytest.fixture
def app_state(mobile_driver):
    """Fixture to ensure app is in a clean state for each test"""
    # Navigate to home screen
    try:
        # Try to find and click the home/library tab
        home_tab = mobile_driver.wait_for_element(
            (AppiumBy.ACCESSIBILITY_ID, "Library"), 
            timeout=5
        )
        home_tab.click()
    except:
        # If home tab not found, app might not be loaded
        print("Warning: Could not find Library tab, app might not be loaded")
    
    # Wait for app to stabilize
    time.sleep(2)
    
    yield mobile_driver
    
    # Cleanup after each test
    mobile_driver.take_screenshot("test_cleanup")

@pytest.fixture
def test_data():
    """Fixture providing test data"""
    return TestConfig.TEST_DOCUMENTS

@pytest.fixture
def search_cases():
    """Fixture providing search test cases"""
    return TestConfig.SEARCH_TEST_CASES 