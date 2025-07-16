/**
 * Services Index
 * 
 * This file exports all services in a organized way for easy importing
 * throughout the application.
 */

// Core Services
export { ocrService } from './ocrService';
export { enhancedOCRService } from './ocrService.v2';
export { databaseService } from './database';
export { fileStorageService } from './fileStorage';

// Processing Services
export { textProcessingService } from './textProcessingService';
export { generateMetadata as generateSimplifiedMetadata } from './aiMetadata.simplified';

// Validation Services
export { default as ValidationService } from './validation';
export { fileValidationService, validateFile } from './fileValidation';

// Monitoring Services
export { monitoringService, initializeMonitoring, captureError, captureMessage } from './monitoring';
export { performanceMonitoringService, startOperation, completeOperation } from './performanceMonitoring';

// Authentication Services
export { AuthService } from './auth';
export { passkeyAuthService } from './passkeyAuth';

// Service Types (for TypeScript)
export type { OCRService } from './ocrService';
export type { FileStorageService } from './fileStorage';
export type { TextProcessingService } from './textProcessingService';
export type { PasskeyAuthService } from './passkeyAuth'; 