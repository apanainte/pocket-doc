/**
 * Services Index
 * 
 * This file exports all services in a organized way for easy importing
 * throughout the application.
 */

// Core services
export { databaseService } from './database';
export { ocrService } from './ocrService';
export { documentScannerService } from './DocumentScannerService';
export { AuthService } from './auth';
export { passkeyAuthService } from './passkeyAuth';

// File and storage services
export { fileStorageService } from './fileStorage';
export { fileValidationService } from './fileValidation';

// Monitoring services
export { monitoringService } from './monitoring';

// Basic types
export type { Document, Category } from '../types/document';
export type { AuthMethod } from './auth'; 