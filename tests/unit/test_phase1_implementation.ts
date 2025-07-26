/**
 * Phase 1 Implementation Tests
 * 
 * Tests for the high-ROI Phase 1 changes:
 * - Sentry monitoring integration
 * - File validation service
 * - Performance monitoring service
 */

import { monitoringService, initializeMonitoring } from '../../services/monitoring';
import { fileValidationService, validateFile } from '../../services/fileValidation';
import { performanceMonitoringService, startOperation, completeOperation } from '../../services/performanceMonitoring';

describe('Phase 1 Implementation Tests', () => {
  beforeEach(() => {
    // Initialize monitoring for tests
    initializeMonitoring({
      dsn: 'test-dsn',
      environment: 'test',
    });
  });

  describe('Monitoring Service', () => {
    it('should initialize monitoring service', () => {
      expect(monitoringService).toBeDefined();
      expect(typeof monitoringService.captureError).toBe('function');
      expect(typeof monitoringService.captureMessage).toBe('function');
    });

    it('should capture errors without throwing', () => {
      const testError = new Error('Test error');
      expect(() => {
        monitoringService.captureError(testError, {
          tags: { test: 'true' },
          extra: { context: 'unit_test' },
        });
      }).not.toThrow();
    });

    it('should capture messages without throwing', () => {
      expect(() => {
        monitoringService.captureMessage('Test message', 'info');
      }).not.toThrow();
    });
  });

  describe('File Validation Service', () => {
    it('should validate valid image files', async () => {
      const validImageFile = {
        name: 'test.jpg',
        size: 1024 * 1024, // 1MB
        type: 'image/jpeg',
        uri: 'file://test.jpg',
        lastModified: Date.now(),
      };

      const result = await validateFile(validImageFile);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.metadata.mimeType).toBe('image/jpeg');
      expect(result.metadata.isImage).toBe(true);
    });

    it('should validate valid PDF files', async () => {
      const validPDFFile = {
        name: 'test.pdf',
        size: 2 * 1024 * 1024, // 2MB
        type: 'application/pdf',
        uri: 'file://test.pdf',
        lastModified: Date.now(),
      };

      const result = await validateFile(validPDFFile);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.metadata.mimeType).toBe('application/pdf');
      expect(result.metadata.isPDF).toBe(true);
    });

    it('should reject files that are too large', async () => {
      const largePDFFile = {
        name: 'large.pdf',
        size: 100 * 1024 * 1024, // 100MB (exceeds 50MB limit)
        type: 'application/pdf',
        uri: 'file://large.pdf',
        lastModified: Date.now(),
      };

      const result = await validateFile(largePDFFile);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('exceeds maximum allowed size');
    });

    it('should reject files with invalid extensions', async () => {
      const invalidFile = {
        name: 'test.exe',
        size: 1024,
        type: 'application/octet-stream',
        uri: 'file://test.exe',
        lastModified: Date.now(),
      };

      const result = await validateFile(invalidFile);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.includes('not allowed'))).toBe(true);
    });

    it('should detect suspicious file names', async () => {
      const suspiciousFile = {
        name: 'test<script>alert("xss")</script>.jpg',
        size: 1024,
        type: 'image/jpeg',
        uri: 'file://test.jpg',
        lastModified: Date.now(),
      };

      const result = await validateFile(suspiciousFile);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('suspicious pattern'))).toBe(true);
    });
  });

  describe('Performance Monitoring Service', () => {
    it('should track operations', () => {
      const operationId = startOperation('test_operation', 'ui', { test: true });
      expect(operationId).toBeDefined();
      expect(typeof operationId).toBe('string');
      expect(operationId.length).toBeGreaterThan(0);
    });

    it('should complete operations successfully', () => {
      const operationId = startOperation('test_operation', 'ui', { test: true });
      expect(() => {
        completeOperation(operationId, true, { result: 'success' });
      }).not.toThrow();
    });

    it('should handle failed operations', () => {
      const operationId = startOperation('test_operation', 'ui', { test: true });
      expect(() => {
        completeOperation(operationId, false, { reason: 'test_failure' });
      }).not.toThrow();
    });

    it('should generate performance reports', () => {
      // Create some test operations
      const op1 = startOperation('test_op_1', 'ui');
      const op2 = startOperation('test_op_2', 'database');
      
      // Complete them
      completeOperation(op1, true);
      completeOperation(op2, false);
      
      const report = performanceMonitoringService.getPerformanceReport();
      expect(report).toBeDefined();
      expect(report.totalOperations).toBeGreaterThan(0);
      expect(report.categoryBreakdown).toBeDefined();
      expect(report.recommendations).toBeDefined();
    });

    it('should track specialized operations', () => {
      expect(() => {
        performanceMonitoringService.trackOCRProcessing(1024, 'image/jpeg');
      }).not.toThrow();

      expect(() => {
        performanceMonitoringService.trackAIMetadataGeneration(500, 'openai');
      }).not.toThrow();

      expect(() => {
        performanceMonitoringService.trackFileUpload(2048, 'application/pdf');
      }).not.toThrow();

      expect(() => {
        performanceMonitoringService.trackSearchQuery(10, 2);
      }).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should work together for a complete upload flow', async () => {
      // Start file upload tracking
      const uploadId = startOperation('file_upload', 'upload', { fileType: 'image' });
      
      // Validate file
      const fileInfo = {
        name: 'test.jpg',
        size: 1024 * 1024,
        type: 'image/jpeg',
        uri: 'file://test.jpg',
        lastModified: Date.now(),
      };
      
      const validationResult = await validateFile(fileInfo);
      expect(validationResult.isValid).toBe(true);
      
      // Track AI processing
      const aiId = startOperation('ai_metadata_generation', 'ai', { model: 'test' });
      completeOperation(aiId, true, { textLength: 100 });
      
      // Complete upload
      completeOperation(uploadId, true, { fileSize: fileInfo.size });
      
      // Verify performance report includes our operations
      const report = performanceMonitoringService.getPerformanceReport();
      expect(report.totalOperations).toBeGreaterThan(0);
    });
  });
});

// Export for use in other tests
export {
  monitoringService,
  fileValidationService,
  performanceMonitoringService,
}; 