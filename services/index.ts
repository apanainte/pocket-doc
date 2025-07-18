/**
 * Services Index
 * 
 * This file exports all services in a organized way for easy importing
 * throughout the application.
 */

// Core Services
export { databaseService } from './database';
export { fileStorageService } from './fileStorage';

// Processing Services
export { generateMetadata as generateSimplifiedMetadata } from './aiMetadata.simplified';

// Validation Services
export { fileValidationService, validateFile } from './fileValidation';

// Monitoring Services
export { monitoringService, initializeMonitoring, captureError, captureMessage } from './monitoring';
export { performanceMonitoringService, startOperation, completeOperation } from './performanceMonitoring';

// Authentication Services
export { AuthService } from './auth';

// Service Types (for TypeScript)
export type { FileStorageService } from './fileStorage';