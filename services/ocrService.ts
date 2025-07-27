/**
 * OCR Service - Simplified Single-Engine Implementation
 * 
 * This service provides text recognition using MLKit only:
 * - iOS: Uses ML Kit OCR
 * - Android: Uses ML Kit OCR  
 * - No fake content generation - real OCR or honest failure
 */

import { Platform } from 'react-native';
import { OCRResult, OCRProcessingOptions, OCRError } from '@/types/document';
import { MLKitOCR } from './native/MLKitOCR';

/**
 * Simplified OCR Service class
 * Single MLKit engine, no fake content generation
 */
export class OCRService {
  private static instance: OCRService;
  private mlKitOCR?: MLKitOCR;
  private isInitialized = false;

  private constructor() {
    // Singleton pattern
  }

  /**
   * Get the singleton instance of OCRService
   */
  static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  /**
   * Initialize the OCR service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('OCRService: Initializing simplified MLKit-only service...');

    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      try {
        console.log('OCRService: Initializing MLKit OCR...');
        this.mlKitOCR = new MLKitOCR();
        await this.mlKitOCR.initialize();
        console.log('OCRService: ✅ MLKit initialized successfully');
      } catch (error) {
        console.error('OCRService: ❌ MLKit initialization failed:', error);
        throw new OCRError({
          code: 'DEVICE_NOT_SUPPORTED',
          message: 'MLKit OCR initialization failed',
          originalError: error as Error
        });
      }
    } else {
      throw new OCRError({
        code: 'DEVICE_NOT_SUPPORTED',
        message: 'OCR not available on this platform'
      });
    }

    this.isInitialized = true;
    console.log('OCRService: ✅ Initialization completed');
  }

  /**
   * Check if OCR is supported on current platform
   */
  async isSupported(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      return this.mlKitOCR ? await this.mlKitOCR.isSupported() : false;
    } catch (error) {
      console.error('OCRService: Error checking OCR support:', error);
      return false;
    }
  }

  /**
   * Recognize text from image - simplified version
   */
  async recognizeText(
    imageUri: string,
    options: OCRProcessingOptions = {}
  ): Promise<OCRResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.mlKitOCR) {
      throw new OCRError({
        code: 'DEVICE_NOT_SUPPORTED',
        message: 'MLKit OCR not available'
      });
    }

    try {
      console.log('OCRService: Starting MLKit text recognition...');
      const startTime = Date.now();
      
      const result = await this.mlKitOCR.recognizeText(imageUri, options);
      const processingTime = Date.now() - startTime;
      
      console.log(`OCRService: ✅ Recognition completed in ${processingTime}ms`);
      console.log(`OCRService: Text length: ${result.text.length} characters`);
      console.log(`OCRService: Confidence: ${(result.confidence * 100).toFixed(1)}%`);

      return {
        ...result,
        processingTime
      };

    } catch (error) {
      console.error('OCRService: ❌ MLKit OCR failed:', error);
      
      throw new OCRError({
        code: 'PROCESSING_FAILED',
        message: 'Text recognition failed - please enter text manually',
        originalError: error as Error
      });
    }
  }

  /**
   * Get available languages
   */
  async getAvailableLanguages(): Promise<string[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      return this.mlKitOCR ? await this.mlKitOCR.getAvailableLanguages() : ['en'];
    } catch (error) {
      console.error('OCRService: Error getting available languages:', error);
      return ['en'];
    }
  }
}

// Export singleton instance
export const ocrService = OCRService.getInstance();
