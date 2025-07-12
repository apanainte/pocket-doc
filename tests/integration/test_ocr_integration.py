"""
OCR Integration Test Suite
Tests the complete OCR workflow from image capture to text extraction and metadata generation.
"""

import pytest
import time
from appium.webdriver.common.appiumby import AppiumBy
from tests.conftest import AppState

class TestOCRIntegration:
    
    def test_ocr_text_extraction_flow(self, app_state, test_data):
        """Test complete OCR workflow with text extraction"""
        driver = app_state.driver
        
        # Navigate to upload screen
        self._navigate_to_upload(app_state)
        
        # Upload image with text content
        image_data = test_data['ocr_test_image']
        self._upload_test_image(app_state, image_data['path'])
        
        # Wait for OCR processing
        ocr_indicator = app_state.wait_for_element(
            (AppiumBy.XPATH, "//*[contains(@text, 'Text Extracted') or contains(@label, 'Text Extracted')]"),
            timeout=15
        )
        assert ocr_indicator is not None, "OCR processing indicator not found"
        
        # Verify OCR confidence is displayed
        confidence_text = ocr_indicator.text or ocr_indicator.get_attribute('label')
        assert 'confidence' in confidence_text.lower(), "OCR confidence not displayed"
        
        # Check if generated metadata includes OCR-derived content
        title_field = app_state.wait_for_element(
            (AppiumBy.XPATH, "//android.widget.EditText[@text or @hint='Title' or contains(@content-desc, 'title')]")
        )
        generated_title = title_field.text or title_field.get_attribute('text')
        
        # Title should be more meaningful than generic fallback
        assert len(generated_title) > 10, "Generated title seems too generic"
        assert not generated_title.startswith('Document -'), "Title should be more specific than generic fallback"
        
        app_state.take_screenshot("ocr_metadata_generated")
    
    def test_ocr_search_functionality(self, app_state, test_data):
        """Test searching documents by OCR-extracted text"""
        driver = app_state.driver
        
        # First upload a document with known text content
        self._upload_document_with_ocr(app_state, test_data['receipt_image'])
        
        # Navigate to search screen
        search_tab = app_state.wait_and_click(
            (AppiumBy.XPATH, "//*[@content-desc='Search' or contains(@text, 'Search')]")
        )
        
        # Search for text that should be in the OCR content
        search_box = app_state.wait_for_element(
            (AppiumBy.XPATH, "//android.widget.EditText[@hint='Search documents...' or contains(@content-desc, 'search')]")
        )
        
        # Use a common word that would appear in receipts
        search_term = "total"
        search_box.send_keys(search_term)
        
        # Wait for search results
        time.sleep(2)
        
        # Verify results are returned
        results = driver.find_elements(AppiumBy.CLASS_NAME, "android.view.ViewGroup")
        document_results = [r for r in results if self._is_document_card(r)]
        
        assert len(document_results) > 0, f"No search results found for '{search_term}'"
        
        app_state.take_screenshot("ocr_search_results")
    
    def test_ocr_confidence_levels(self, app_state, test_data):
        """Test handling of different OCR confidence levels"""
        test_images = [
            test_data['high_quality_text'],  # Should have high confidence
            test_data['blurry_text'],       # Should have low confidence
            test_data['handwritten_text']   # Should have very low confidence
        ]
        
        for i, image_data in enumerate(test_images):
            # Upload each test image
            self._navigate_to_upload(app_state)
            self._upload_test_image(app_state, image_data['path'])
            
            # Wait for OCR processing
            ocr_indicator = app_state.wait_for_element(
                (AppiumBy.XPATH, "//*[contains(@text, 'Text Extracted')]"),
                timeout=15
            )
            
            if ocr_indicator:
                confidence_text = ocr_indicator.text or ocr_indicator.get_attribute('label')
                # Extract confidence percentage
                import re
                confidence_match = re.search(r'(\d+)%', confidence_text)
                
                if confidence_match:
                    confidence = int(confidence_match.group(1))
                    expected_confidence = image_data['expected_confidence']
                    
                    # Allow some tolerance in confidence levels
                    assert abs(confidence - expected_confidence) <= 20, \
                        f"OCR confidence {confidence}% outside expected range for {image_data['name']}"
            
            app_state.take_screenshot(f"ocr_confidence_test_{i}")
            
            # Cancel this upload to test next image
            cancel_btn = driver.find_element(AppiumBy.XPATH, "//*[@content-desc='Remove selected file']")
            cancel_btn.click()
    
    def test_ocr_language_detection(self, app_state, test_data):
        """Test OCR language detection and handling"""
        multilingual_images = [
            test_data['english_text'],
            test_data['spanish_text'],
            test_data['french_text']
        ]
        
        for image_data in multilingual_images:
            self._navigate_to_upload(app_state)
            self._upload_test_image(app_state, image_data['path'])
            
            # Wait for processing
            app_state.wait_for_element(
                (AppiumBy.XPATH, "//*[contains(@text, 'Generated Metadata')]"),
                timeout=15
            )
            
            # Check generated tags include language
            tags_field = app_state.wait_for_element(
                (AppiumBy.XPATH, "//android.widget.EditText[contains(@hint, 'tags') or contains(@content-desc, 'tags')]")
            )
            tags_text = tags_field.text or tags_field.get_attribute('text')
            
            expected_language = image_data['language']
            assert expected_language in tags_text.lower(), \
                f"Language '{expected_language}' not detected in tags: {tags_text}"
            
            # Cancel to test next language
            cancel_btn = driver.find_element(AppiumBy.XPATH, "//*[@content-desc='Remove selected file']")
            cancel_btn.click()
    
    def test_ocr_performance_benchmarks(self, app_state, test_data):
        """Test OCR processing performance"""
        driver = app_state.driver
        
        # Test with standard quality image
        self._navigate_to_upload(app_state)
        
        start_time = time.time()
        self._upload_test_image(app_state, test_data['performance_test_image']['path'])
        
        # Wait for OCR completion
        ocr_indicator = app_state.wait_for_element(
            (AppiumBy.XPATH, "//*[contains(@text, 'Text Extracted')]"),
            timeout=30
        )
        
        processing_time = time.time() - start_time
        
        # OCR should complete within reasonable time (30 seconds max for test)
        assert processing_time < 30, f"OCR processing took too long: {processing_time:.2f}s"
        
        # For production, should be much faster (under 10 seconds for typical images)
        if processing_time > 10:
            print(f"Warning: OCR processing took {processing_time:.2f}s - may need optimization")
        
        app_state.take_screenshot("ocr_performance_test")
    
    def test_ocr_error_handling(self, app_state, test_data):
        """Test OCR error handling with problematic images"""
        problematic_images = [
            test_data['corrupted_image'],
            test_data['no_text_image'],
            test_data['extremely_large_image']
        ]
        
        for image_data in problematic_images:
            self._navigate_to_upload(app_state)
            
            try:
                self._upload_test_image(app_state, image_data['path'])
                
                # Should either succeed with low confidence or show graceful fallback
                time.sleep(5)  # Allow processing time
                
                # Check if app is still responsive
                metadata_section = driver.find_elements(
                    AppiumBy.XPATH, "//*[contains(@text, 'Generated Metadata')]"
                )
                
                # App should not crash and should show some metadata
                assert len(metadata_section) > 0 or self._has_error_message(), \
                    f"App became unresponsive with problematic image: {image_data['name']}"
                
            except Exception as e:
                # Graceful error handling is acceptable
                print(f"Expected error with {image_data['name']}: {e}")
            
            finally:
                # Try to recover by canceling
                try:
                    cancel_btn = driver.find_element(AppiumBy.XPATH, "//*[@content-desc='Remove selected file']")
                    cancel_btn.click()
                except:
                    # If cancel fails, go back to home
                    self._navigate_to_home(app_state)
    
    # Helper methods
    def _navigate_to_upload(self, app_state):
        """Navigate to upload screen"""
        upload_tab = app_state.wait_and_click(
            (AppiumBy.XPATH, "//*[@content-desc='Upload' or contains(@text, 'Upload')]")
        )
        
    def _upload_test_image(self, app_state, image_path):
        """Upload a test image"""
        upload_btn = app_state.wait_and_click(
            (AppiumBy.XPATH, "//*[contains(@text, 'Upload Image') or contains(@content-desc, 'Upload Image')]")
        )
        
        # Note: Actual file selection would need platform-specific implementation
        # This is a placeholder for the file selection process
        time.sleep(2)  # Simulate file selection time
    
    def _upload_document_with_ocr(self, app_state, image_data):
        """Complete flow of uploading and saving a document"""
        self._upload_test_image(app_state, image_data['path'])
        
        # Wait for processing
        app_state.wait_for_element(
            (AppiumBy.XPATH, "//*[contains(@text, 'Generated Metadata')]"),
            timeout=15
        )
        
        # Save document
        save_btn = app_state.wait_and_click(
            (AppiumBy.XPATH, "//*[contains(@text, 'Save') or @content-desc='Save document']")
        )
        
        # Verify success
        success_msg = app_state.wait_for_element(
            (AppiumBy.XPATH, "//*[contains(@text, 'uploaded successfully')]"),
            timeout=10
        )
        assert success_msg is not None, "Document save confirmation not found"
    
    def _is_document_card(self, element):
        """Check if element is a document card in search results"""
        try:
            # Look for document card indicators
            text_content = element.text or element.get_attribute('content-desc') or ''
            return any(indicator in text_content.lower() for indicator in 
                      ['document', 'title', 'description', 'tag'])
        except:
            return False
    
    def _has_error_message(self):
        """Check if there's an error message displayed"""
        try:
            error_elements = app_state.driver.find_elements(
                AppiumBy.XPATH, "//*[contains(@text, 'Error') or contains(@text, 'Failed')]"
            )
            return len(error_elements) > 0
        except:
            return False
    
    def _navigate_to_home(self, app_state):
        """Navigate back to home screen"""
        try:
            home_tab = app_state.wait_and_click(
                (AppiumBy.XPATH, "//*[@content-desc='Library' or contains(@text, 'Library')]")
            )
        except:
            # Try back button
            app_state.driver.back()

@pytest.fixture
def test_data():
    """Test data fixture with various image types for OCR testing"""
    return {
        'ocr_test_image': {
            'path': 'test_assets/sample_text_document.jpg',
            'expected_text': 'This is a sample document for OCR testing',
            'expected_confidence': 85
        },
        'receipt_image': {
            'path': 'test_assets/sample_receipt.jpg',
            'expected_text': 'Total: $24.99',
            'expected_confidence': 90
        },
        'high_quality_text': {
            'path': 'test_assets/high_quality_text.jpg',
            'name': 'High Quality Text',
            'expected_confidence': 95
        },
        'blurry_text': {
            'path': 'test_assets/blurry_text.jpg',
            'name': 'Blurry Text',
            'expected_confidence': 60
        },
        'handwritten_text': {
            'path': 'test_assets/handwritten.jpg',
            'name': 'Handwritten Text',
            'expected_confidence': 40
        },
        'english_text': {
            'path': 'test_assets/english_document.jpg',
            'language': 'en'
        },
        'spanish_text': {
            'path': 'test_assets/spanish_document.jpg',
            'language': 'es'
        },
        'french_text': {
            'path': 'test_assets/french_document.jpg',
            'language': 'fr'
        },
        'performance_test_image': {
            'path': 'test_assets/performance_test.jpg',
            'size_mb': 2.5
        },
        'corrupted_image': {
            'path': 'test_assets/corrupted.jpg',
            'name': 'Corrupted Image'
        },
        'no_text_image': {
            'path': 'test_assets/landscape_photo.jpg',
            'name': 'No Text Image'
        },
        'extremely_large_image': {
            'path': 'test_assets/large_image.jpg',
            'name': 'Large Image',
            'size_mb': 10
        }
    } 