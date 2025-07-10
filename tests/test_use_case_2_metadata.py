import pytest
import time
from appium.webdriver.common.appiumby import AppiumBy
from conftest import TestConfig

class TestVisualizeAndEditMetadata:
    """
    Test Use Case 2: Review and Edit Generated Metadata for Uploaded Document
    
    Tests the complete metadata management workflow:
    1. User opens existing document from library
    2. User views generated metadata (description and tags)
    3. User edits metadata (title, description, tags)
    4. User saves changes
    5. Validation and error handling
    6. Changes take effect within 1 second
    """
    
    def test_navigate_to_document_library(self, app_state):
        """Test navigation to document library and view documents"""
        driver = app_state.driver
        
        # Take initial screenshot
        app_state.take_screenshot("metadata_test_start")
        
        # Navigate to Library tab (should be default)
        library_tab = app_state.wait_for_element(
            (AppiumBy.ACCESSIBILITY_ID, "Library"),
            timeout=TestConfig.DEFAULT_TIMEOUT
        )
        library_tab.click()
        
        # Verify library screen is displayed
        library_title = app_state.wait_for_element(
            (AppiumBy.XPATH, "//*[contains(@text, 'My Documents') or contains(@label, 'My Documents')]"),
            timeout=TestConfig.DEFAULT_TIMEOUT
        )
        
        assert library_title is not None, "Library screen title not found"
        app_state.take_screenshot("library_screen_loaded")
    
    def test_open_document_detail_modal(self, app_state):
        """Test opening document detail modal"""
        driver = app_state.driver
        
        # Navigate to library
        self._navigate_to_library(app_state)
        
        # Find and click on first document
        first_document = app_state.wait_for_element(
            (AppiumBy.XPATH, "//XCUIElementTypeCell[1] | //android.widget.LinearLayout[1]"),
            timeout=TestConfig.DEFAULT_TIMEOUT
        )
        first_document.click()
        
        # Verify document detail modal opened
        document_detail_title = app_state.wait_for_element(
            (AppiumBy.XPATH, "//*[contains(@text, 'Document Details') or contains(@label, 'Document Details')]"),
            timeout=TestConfig.DEFAULT_TIMEOUT
        )
        
        assert document_detail_title is not None, "Document detail modal not opened"
        app_state.take_screenshot("document_detail_modal_opened")
    
    def test_view_document_metadata(self, app_state):
        """Test viewing document metadata in detail modal"""
        driver = app_state.driver
        
        # Open document detail
        self._open_document_detail(app_state)
        
        # Verify metadata fields are displayed
        metadata_fields = ['Title', 'Description', 'Tags', 'Created', 'Type']
        
        for field in metadata_fields:
            field_element = app_state.wait_for_element(
                (AppiumBy.XPATH, f"//*[contains(@text, '{field}') or contains(@label, '{field}')]"),
                timeout=5
            )
            assert field_element is not None, f"Metadata field '{field}' not found"
        
        # Verify document preview/thumbnail is shown
        thumbnail = app_state.wait_for_element(
            (AppiumBy.XPATH, "//*[contains(@contentDescription, 'thumbnail') or contains(@label, 'thumbnail')]"),
            timeout=5
        )
        # Note: Thumbnail might not always be present, so we don't assert
        
        app_state.take_screenshot("metadata_fields_verified")
    
    def test_edit_document_title(self, app_state):
        """Test editing document title"""
        driver = app_state.driver
        
        # Open document detail and enter edit mode
        self._open_document_detail(app_state)
        self._enter_edit_mode(app_state)
        
        # Find and edit title field
        title_field = app_state.wait_for_element(
            (AppiumBy.XPATH, "//*[contains(@placeholder, 'title') or contains(@hint, 'title')]"),
            timeout=TestConfig.DEFAULT_TIMEOUT
        )
        
        # Clear existing title and enter new one
        original_title = title_field.text
        new_title = "Updated Test Document Title"
        
        title_field.clear()
        title_field.send_keys(new_title)
        
        # Save changes
        self._save_metadata_changes(app_state)
        
        # Verify title was updated
        self._verify_field_updated(app_state, "title", new_title)
        
        app_state.take_screenshot("title_updated")
    
    def test_edit_document_description(self, app_state):
        """Test editing document description"""
        driver = app_state.driver
        
        # Open document detail and enter edit mode
        self._open_document_detail(app_state)
        self._enter_edit_mode(app_state)
        
        # Find and edit description field
        description_field = app_state.wait_for_element(
            (AppiumBy.XPATH, "//*[contains(@placeholder, 'description') or contains(@hint, 'description')]"),
            timeout=TestConfig.DEFAULT_TIMEOUT
        )
        
        # Clear existing description and enter new one
        new_description = "This is an updated description for testing metadata editing functionality"
        
        description_field.clear()
        description_field.send_keys(new_description)
        
        # Save changes
        self._save_metadata_changes(app_state)
        
        # Verify description was updated
        self._verify_field_updated(app_state, "description", new_description)
        
        app_state.take_screenshot("description_updated")
    
    def test_edit_document_tags(self, app_state):
        """Test editing document tags"""
        driver = app_state.driver
        
        # Open document detail and enter edit mode
        self._open_document_detail(app_state)
        self._enter_edit_mode(app_state)
        
        # Find and edit tags field
        tags_field = app_state.wait_for_element(
            (AppiumBy.XPATH, "//*[contains(@placeholder, 'tags') or contains(@hint, 'tags')]"),
            timeout=TestConfig.DEFAULT_TIMEOUT
        )
        
        # Clear existing tags and enter new ones
        new_tags = "updated, test, metadata, editing"
        
        tags_field.clear()
        tags_field.send_keys(new_tags)
        
        # Save changes
        self._save_metadata_changes(app_state)
        
        # Verify tags were updated
        self._verify_tags_updated(app_state, new_tags.split(', '))
        
        app_state.take_screenshot("tags_updated")
    
    def test_metadata_validation_empty_title(self, app_state):
        """Test validation for empty title"""
        driver = app_state.driver
        
        # Open document detail and enter edit mode
        self._open_document_detail(app_state)
        self._enter_edit_mode(app_state)
        
        # Try to save with empty title
        title_field = app_state.wait_for_element(
            (AppiumBy.XPATH, "//*[contains(@placeholder, 'title')]"),
            timeout=TestConfig.DEFAULT_TIMEOUT
        )
        title_field.clear()
        
        # Attempt to save
        self._save_metadata_changes(app_state)
        
        # Verify validation error is shown
        error_message = app_state.wait_for_element(
            (AppiumBy.XPATH, "//*[contains(@text, 'Title') and contains(@text, 'required')]"),
            timeout=5
        )
        assert error_message is not None, "Validation error for empty title not shown"
        
        app_state.take_screenshot("title_validation_error")
    
    def test_metadata_validation_long_description(self, app_state):
        """Test validation for excessively long description"""
        driver = app_state.driver
        
        # Open document detail and enter edit mode
        self._open_document_detail(app_state)
        self._enter_edit_mode(app_state)
        
        # Try to enter description longer than 500 characters
        long_description = "A" * 501  # Exceeds 500 character limit
        
        description_field = app_state.wait_for_element(
            (AppiumBy.XPATH, "//*[contains(@placeholder, 'description')]"),
            timeout=TestConfig.DEFAULT_TIMEOUT
        )
        description_field.clear()
        description_field.send_keys(long_description)
        
        # Attempt to save
        self._save_metadata_changes(app_state)
        
        # Verify validation error is shown
        error_message = app_state.wait_for_element(
            (AppiumBy.XPATH, "//*[contains(@text, 'Description') and contains(@text, '500')]"),
            timeout=5
        )
        assert error_message is not None, "Validation error for long description not shown"
        
        app_state.take_screenshot("description_validation_error")
    
    def test_metadata_validation_too_many_tags(self, app_state):
        """Test validation for too many tags"""
        driver = app_state.driver
        
        # Open document detail and enter edit mode
        self._open_document_detail(app_state)
        self._enter_edit_mode(app_state)
        
        # Try to enter more than 10 tags
        too_many_tags = ", ".join([f"tag{i}" for i in range(1, 12)])  # 11 tags
        
        tags_field = app_state.wait_for_element(
            (AppiumBy.XPATH, "//*[contains(@placeholder, 'tags')]"),
            timeout=TestConfig.DEFAULT_TIMEOUT
        )
        tags_field.clear()
        tags_field.send_keys(too_many_tags)
        
        # Attempt to save
        self._save_metadata_changes(app_state)
        
        # Verify validation error is shown
        error_message = app_state.wait_for_element(
            (AppiumBy.XPATH, "//*[contains(@text, 'Maximum') and contains(@text, '10')]"),
            timeout=5
        )
        assert error_message is not None, "Validation error for too many tags not shown"
        
        app_state.take_screenshot("tags_validation_error")
    
    def test_update_performance(self, app_state):
        """Test that updates take effect within 1 second"""
        driver = app_state.driver
        
        # Open document detail and enter edit mode
        self._open_document_detail(app_state)
        self._enter_edit_mode(app_state)
        
        # Edit title
        title_field = app_state.wait_for_element(
            (AppiumBy.XPATH, "//*[contains(@placeholder, 'title')]"),
            timeout=TestConfig.DEFAULT_TIMEOUT
        )
        
        new_title = f"Performance Test {int(time.time())}"
        title_field.clear()
        title_field.send_keys(new_title)
        
        # Record time and save
        start_time = time.time()
        self._save_metadata_changes(app_state)
        
        # Wait for update confirmation
        self._wait_for_update_confirmation(app_state)
        elapsed_time = time.time() - start_time
        
        # Assert performance requirement
        assert elapsed_time < 1.0, f"Update took {elapsed_time:.2f} seconds, requirement is <1 second"
        
        app_state.take_screenshot("performance_test_complete")
    
    def test_cancel_metadata_edit(self, app_state):
        """Test canceling metadata edit without saving"""
        driver = app_state.driver
        
        # Open document detail and enter edit mode
        self._open_document_detail(app_state)
        
        # Get original title
        original_title_element = app_state.wait_for_element(
            (AppiumBy.XPATH, "//*[contains(@text, 'Title')]/following-sibling::*[1]"),
            timeout=5
        )
        original_title = original_title_element.text if original_title_element else "Original Title"
        
        self._enter_edit_mode(app_state)
        
        # Edit title
        title_field = app_state.wait_for_element(
            (AppiumBy.XPATH, "//*[contains(@placeholder, 'title')]"),
            timeout=TestConfig.DEFAULT_TIMEOUT
        )
        title_field.clear()
        title_field.send_keys("This should not be saved")
        
        # Cancel instead of save
        cancel_btn = app_state.wait_and_click(
            (AppiumBy.XPATH, "//*[contains(@text, 'Cancel') or contains(@label, 'Cancel')]")
        )
        
        # Verify changes were not saved
        current_title_element = app_state.wait_for_element(
            (AppiumBy.XPATH, "//*[contains(@text, 'Title')]/following-sibling::*[1]"),
            timeout=5
        )
        current_title = current_title_element.text if current_title_element else ""
        
        assert current_title == original_title, "Changes were saved when they should have been canceled"
        
        app_state.take_screenshot("metadata_edit_canceled")
    
    def test_delete_document(self, app_state):
        """Test deleting a document"""
        driver = app_state.driver
        
        # Open document detail
        self._open_document_detail(app_state)
        
        # Find and click delete button
        delete_btn = app_state.wait_for_element(
            (AppiumBy.XPATH, "//*[contains(@text, 'Delete') or contains(@label, 'Delete')]"),
            timeout=TestConfig.DEFAULT_TIMEOUT
        )
        delete_btn.click()
        
        # Handle confirmation dialog
        confirm_delete_btn = app_state.wait_and_click(
            (AppiumBy.XPATH, "//*[contains(@text, 'Delete') and not(contains(@text, 'Cancel'))]")
        )
        
        # Verify document was deleted (modal should close)
        time.sleep(2)  # Wait for deletion to complete
        
        # Check that we're back to library screen
        library_title = app_state.wait_for_element(
            (AppiumBy.XPATH, "//*[contains(@text, 'My Documents')]"),
            timeout=5
        )
        assert library_title is not None, "Document deletion did not return to library"
        
        app_state.take_screenshot("document_deleted")
    
    # Helper methods
    
    def _navigate_to_library(self, app_state):
        """Navigate to document library"""
        library_tab = app_state.wait_and_click(
            (AppiumBy.ACCESSIBILITY_ID, "Library")
        )
        app_state.take_screenshot("navigated_to_library")
    
    def _open_document_detail(self, app_state):
        """Open first document detail modal"""
        self._navigate_to_library(app_state)
        
        # Click on first document
        first_document = app_state.wait_and_click(
            (AppiumBy.XPATH, "//XCUIElementTypeCell[1] | //android.widget.LinearLayout[1]")
        )
        
        # Wait for modal to open
        app_state.wait_for_element(
            (AppiumBy.XPATH, "//*[contains(@text, 'Document Details')]"),
            timeout=TestConfig.DEFAULT_TIMEOUT
        )
        
        app_state.take_screenshot("document_detail_opened")
    
    def _enter_edit_mode(self, app_state):
        """Enter metadata edit mode"""
        edit_btn = app_state.wait_and_click(
            (AppiumBy.XPATH, "//*[contains(@label, 'Edit') or contains(@contentDescription, 'Edit')]")
        )
        app_state.take_screenshot("edit_mode_entered")
    
    def _save_metadata_changes(self, app_state):
        """Save metadata changes"""
        save_btn = app_state.wait_and_click(
            (AppiumBy.XPATH, "//*[contains(@text, 'Save') or contains(@label, 'Save')]")
        )
        app_state.take_screenshot("metadata_changes_saved")
    
    def _verify_field_updated(self, app_state, field_name, expected_value):
        """Verify that a field was updated with expected value"""
        # Wait a moment for UI to update
        time.sleep(1)
        
        field_element = app_state.wait_for_element(
            (AppiumBy.XPATH, f"//*[contains(@text, '{expected_value}')]"),
            timeout=5
        )
        assert field_element is not None, f"{field_name} was not updated to '{expected_value}'"
    
    def _verify_tags_updated(self, app_state, expected_tags):
        """Verify that tags were updated"""
        time.sleep(1)
        
        for tag in expected_tags:
            tag_element = app_state.wait_for_element(
                (AppiumBy.XPATH, f"//*[contains(@text, '{tag.strip()}')]"),
                timeout=5
            )
            assert tag_element is not None, f"Tag '{tag}' was not found after update"
    
    def _wait_for_update_confirmation(self, app_state):
        """Wait for update confirmation or success message"""
        try:
            success_indicator = app_state.wait_for_element(
                (AppiumBy.XPATH, "//*[contains(@text, 'Success') or contains(@text, 'Updated')]"),
                timeout=5
            )
        except:
            # If no explicit success message, assume update completed
            pass

if __name__ == "__main__":
    # Run tests with: python -m pytest tests/test_use_case_2_metadata.py -v
    pytest.main([__file__, "-v", "--tb=short"]) 