#!/usr/bin/env python3
"""
Mobile Test Runner for Pocket Doc Application

This script runs comprehensive mobile tests for all three use cases:
1. Upload and Classify Documents
2. Visualize and Edit Metadata  
3. Search and Retrieve Documents

Requirements:
- Appium Server running on localhost:4723
- iOS Simulator or Android Emulator
- Expo Go app installed on device/simulator
- Pocket Doc app running in Expo Go

Usage:
    python run_tests.py [options]
    
Options:
    --platform ios|android  Target platform (default: auto-detect)
    --suite use_case_1|use_case_2|use_case_3|integration|all  Test suite to run (default: all)
    --report-format html|json|xml  Report format (default: html)
    --screenshot-on-failure  Take screenshots on test failures
    --verbose  Verbose output
    --dry-run  Show what would be executed without running tests
"""

import os
import sys
import argparse
import subprocess
import json
import time
from pathlib import Path
import requests
from datetime import datetime

class MobileTestRunner:
    """Mobile test runner with comprehensive reporting and setup validation"""
    
    def __init__(self):
        self.test_dir = Path(__file__).parent
        self.project_root = self.test_dir.parent
        self.report_dir = self.test_dir / "reports"
        self.screenshot_dir = self.test_dir / "test_screenshots"
        
        # Create directories
        self.report_dir.mkdir(exist_ok=True)
        self.screenshot_dir.mkdir(exist_ok=True)
        
        self.test_suites = {
            'use_case_1': 'test_use_case_1_upload.py',
            'use_case_2': 'test_use_case_2_metadata.py',
            'use_case_3': 'test_use_case_3_search.py',
            'integration': 'test_integration.py'
        }
        
        self.requirements_checked = False
        self.appium_server_running = False
        self.device_ready = False
    
    def parse_arguments(self):
        """Parse command line arguments"""
        parser = argparse.ArgumentParser(
            description="Mobile Test Runner for Pocket Doc Application",
            formatter_class=argparse.RawDescriptionHelpFormatter,
            epilog=__doc__
        )
        
        parser.add_argument(
            '--platform',
            choices=['ios', 'android', 'auto'],
            default='auto',
            help='Target platform for testing'
        )
        
        parser.add_argument(
            '--suite',
            choices=['use_case_1', 'use_case_2', 'use_case_3', 'integration', 'all'],
            default='all',
            help='Test suite to run'
        )
        
        parser.add_argument(
            '--report-format',
            choices=['html', 'json', 'xml'],
            default='html',
            help='Test report format'
        )
        
        parser.add_argument(
            '--screenshot-on-failure',
            action='store_true',
            help='Take screenshots on test failures'
        )
        
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Verbose output'
        )
        
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be executed without running tests'
        )
        
        parser.add_argument(
            '--setup-only',
            action='store_true',
            help='Only run setup validation, do not execute tests'
        )
        
        return parser.parse_args()
    
    def validate_requirements(self):
        """Validate that all requirements are met for testing"""
        print("🔍 Validating test requirements...")
        
        # Check Python packages
        required_packages = [
            ('pytest', 'pytest'),
            ('appium-python-client', 'appium'),
            ('selenium', 'selenium'),
            ('requests', 'requests')
        ]
        
        missing_packages = []
        for package_name, import_name in required_packages:
            try:
                __import__(import_name)
                print(f"✅ {package_name} installed")
            except ImportError:
                missing_packages.append(package_name)
                print(f"❌ {package_name} missing")
        
        if missing_packages:
            print(f"\n❌ Missing packages: {', '.join(missing_packages)}")
            print("Install with: pip install " + " ".join(missing_packages))
            return False
        
        # Check Appium server
        if self.check_appium_server():
            print("✅ Appium server running")
            self.appium_server_running = True
        else:
            print("❌ Appium server not running")
            print("Start with: appium --port 4723")
            return False
        
        # Check device/simulator
        if self.check_device_ready():
            print("✅ Device/simulator ready")
            self.device_ready = True
        else:
            print("❌ Device/simulator not ready")
            print("Start iOS Simulator or Android Emulator")
            return False
        
        self.requirements_checked = True
        return True
    
    def check_appium_server(self):
        """Check if Appium server is running"""
        try:
            response = requests.get("http://localhost:4723/status", timeout=5)
            return response.status_code == 200
        except requests.exceptions.RequestException:
            return False
    
    def check_device_ready(self):
        """Check if device/simulator is ready"""
        # Check iOS Simulator
        try:
            result = subprocess.run(
                ['xcrun', 'simctl', 'list', 'devices'], 
                capture_output=True, text=True, timeout=10
            )
            if 'Booted' in result.stdout:
                return True
        except (subprocess.TimeoutExpired, FileNotFoundError):
            pass
        
        # Check Android Emulator
        try:
            result = subprocess.run(
                ['adb', 'devices'], 
                capture_output=True, text=True, timeout=10
            )
            if 'device' in result.stdout and 'List of devices' in result.stdout:
                lines = result.stdout.strip().split('\n')[1:]  # Skip header
                return any('device' in line for line in lines)
        except (subprocess.TimeoutExpired, FileNotFoundError):
            pass
        
        return False
    
    def print_setup_instructions(self):
        """Print detailed setup instructions"""
        print("\n" + "="*60)
        print("🚀 MOBILE TESTING SETUP INSTRUCTIONS")
        print("="*60)
        
        print("\n1. INSTALL APPIUM SERVER:")
        print("   npm install -g appium")
        print("   npm install -g @appium/doctor")
        print("   appium-doctor --ios  # Check iOS setup")
        print("   appium-doctor --android  # Check Android setup")
        
        print("\n2. START APPIUM SERVER:")
        print("   appium --port 4723")
        
        print("\n3. iOS SETUP:")
        print("   - Open Xcode")
        print("   - Open iOS Simulator (Device > Simulator)")
        print("   - Install Expo Go from App Store in simulator")
        print("   - Start your React Native app: expo start")
        print("   - Scan QR code in Expo Go")
        
        print("\n4. ANDROID SETUP:")
        print("   - Start Android Studio")
        print("   - Open AVD Manager and start an emulator")
        print("   - Install Expo Go from Play Store in emulator")
        print("   - Start your React Native app: expo start")
        print("   - Use development build or Expo Go")
        
        print("\n5. VERIFY YOUR APP IS RUNNING:")
        print("   - App should be visible and functional")
        print("   - Test basic navigation between tabs")
        print("   - Ensure upload, library, and search screens work")
        
        print("\n6. RUN TESTS:")
        print("   python tests/run_tests.py --suite all")
        
        print("\n" + "="*60)
    
    def run_test_suite(self, suite_name, args):
        """Run a specific test suite"""
        if suite_name not in self.test_suites:
            print(f"❌ Unknown test suite: {suite_name}")
            return False
        
        test_file = self.test_suites[suite_name]
        test_path = self.test_dir / test_file
        
        if not test_path.exists():
            print(f"❌ Test file not found: {test_path}")
            return False
        
        print(f"\n🧪 Running {suite_name} tests...")
        
        # Build pytest command
        cmd = [
            sys.executable, '-m', 'pytest', 
            str(test_path),
            '-v',
            '--tb=short'
        ]
        
        # Add report format
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        report_file = self.report_dir / f"{suite_name}_{timestamp}"
        
        if args.report_format == 'html':
            cmd.extend(['--html', f"{report_file}.html", '--self-contained-html'])
        elif args.report_format == 'json':
            cmd.extend(['--json-report', '--json-report-file', f"{report_file}.json"])
        elif args.report_format == 'xml':
            cmd.extend(['--junitxml', f"{report_file}.xml"])
        
        # Add screenshot option
        if args.screenshot_on_failure:
            cmd.extend(['--screenshot-on-failure'])
        
        if args.dry_run:
            print(f"Would execute: {' '.join(cmd)}")
            return True
        
        # Execute tests
        start_time = time.time()
        result = subprocess.run(cmd, cwd=self.project_root)
        end_time = time.time()
        
        duration = end_time - start_time
        success = result.returncode == 0
        
        print(f"\n{'✅' if success else '❌'} {suite_name} tests completed in {duration:.2f}s")
        
        if success:
            print(f"📊 Report saved: {report_file}.{args.report_format}")
        else:
            print("❌ Tests failed. Check the output above for details.")
        
        return success
    
    def run_all_tests(self, args):
        """Run all test suites"""
        print("\n🎯 Running all test suites...")
        
        results = {}
        total_start = time.time()
        
        # Run individual use case tests
        for suite_name in ['use_case_1', 'use_case_2', 'use_case_3']:
            results[suite_name] = self.run_test_suite(suite_name, args)
        
        # Run integration tests if individual tests passed
        if all(results.values()):
            print("\n🔗 Individual tests passed, running integration tests...")
            results['integration'] = self.run_test_suite('integration', args)
        else:
            print("\n⚠️  Skipping integration tests due to individual test failures")
            results['integration'] = False
        
        total_time = time.time() - total_start
        
        # Print summary
        self.print_test_summary(results, total_time)
        
        return all(results.values())
    
    def print_test_summary(self, results, total_time):
        """Print comprehensive test summary"""
        print("\n" + "="*60)
        print("📋 TEST EXECUTION SUMMARY")
        print("="*60)
        
        passed = sum(1 for result in results.values() if result)
        total = len(results)
        
        print(f"\n📊 Overall Results: {passed}/{total} test suites passed")
        print(f"⏱️  Total execution time: {total_time:.2f} seconds")
        print(f"📁 Reports saved in: {self.report_dir}")
        print(f"📸 Screenshots saved in: {self.screenshot_dir}")
        
        print(f"\n{'Test Suite':<20} {'Status':<10} {'Notes'}")
        print("-" * 50)
        
        for suite_name, success in results.items():
            status = "✅ PASS" if success else "❌ FAIL"
            notes = self._get_test_notes(suite_name, success)
            print(f"{suite_name:<20} {status:<10} {notes}")
        
        if all(results.values()):
            print(f"\n🎉 ALL TESTS PASSED! Your Pocket Doc app is ready for production.")
            print("✨ All three use cases are working correctly:")
            print("   • Upload and Classify Documents")
            print("   • Visualize and Edit Metadata")
            print("   • Search and Retrieve Documents")
        else:
            print(f"\n⚠️  SOME TESTS FAILED. Review the reports and fix issues before production.")
            failed_suites = [name for name, success in results.items() if not success]
            print(f"❌ Failed suites: {', '.join(failed_suites)}")
        
        print("\n" + "="*60)
    
    def _get_test_notes(self, suite_name, success):
        """Get notes for test results"""
        if success:
            return {
                'use_case_1': 'Upload workflow working',
                'use_case_2': 'Metadata editing working', 
                'use_case_3': 'Search functionality working',
                'integration': 'End-to-end workflow working'
            }.get(suite_name, 'Working correctly')
        else:
            return {
                'use_case_1': 'Check upload, file selection, AI processing',
                'use_case_2': 'Check metadata editing, validation',
                'use_case_3': 'Check search, filtering, performance',
                'integration': 'Check complete workflow'
            }.get(suite_name, 'Review test output')
    
    def run(self):
        """Main execution method"""
        args = self.parse_arguments()
        
        print("🚀 POCKET DOC MOBILE TEST RUNNER")
        print("="*50)
        
        if args.setup_only:
            self.print_setup_instructions()
            return
        
        # Validate requirements
        if not self.validate_requirements():
            print("\n❌ Requirements validation failed!")
            self.print_setup_instructions()
            return False
        
        print("\n✅ All requirements validated successfully!")
        
        # Run tests based on suite selection
        if args.suite == 'all':
            success = self.run_all_tests(args)
        else:
            success = self.run_test_suite(args.suite, args)
        
        return success

def main():
    """Main entry point"""
    runner = MobileTestRunner()
    
    try:
        success = runner.run()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n⚠️  Test execution interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Test execution failed: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main() 