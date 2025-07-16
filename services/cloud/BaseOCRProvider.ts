/**
 * Base OCR Provider - Abstract base class for cloud OCR providers
 * 
 * This provides a common interface for all OCR providers and implements
 * shared functionality like error handling, retry logic, and validation.
 */

import { OCRProviderInterface, CloudOCRConfig, CloudOCRResult, OCRProcessingOptions, OCRError, OCRProviderType } from '@/types/document';
import * as FileSystem from 'expo-file-system';

export abstract class BaseOCRProvider implements OCRProviderInterface {
  public abstract readonly name: OCRProviderType;
  public abstract readonly supportedFormats: string[];
  public abstract readonly maxFileSize: number;

  protected config?: CloudOCRConfig;
  protected isInitialized = false;

  constructor() {}

  /**
   * Initialize the provider with configuration
   */
  async initialize(config: CloudOCRConfig): Promise<void> {
    this.validateConfig(config);
    this.config = config;
    
    // Test connection during initialization
    const isConnected = await this.testConnection();
    if (!isConnected) {
      throw new OCRError({
        code: 'PROVIDER_ERROR',
        message: `Failed to connect to ${this.name} provider during initialization`
      });
    }
    
    this.isInitialized = true;
    console.log(`✅ ${this.name} OCR provider initialized successfully`);
  }

  /**
   * Check if provider is configured and ready
   */
  isConfigured(): boolean {
    return this.isInitialized && !!this.config;
  }

  /**
   * Validate configuration for the provider
   */
  protected validateConfig(config: CloudOCRConfig): void {
    if (!config.apiKey || config.apiKey.trim().length === 0) {
      throw new OCRError({
        code: 'INVALID_API_KEY',
        message: `API key is required for ${this.name} provider`
      });
    }

    if (config.provider !== this.name) {
      throw new OCRError({
        code: 'PROVIDER_ERROR',
        message: `Provider mismatch: expected ${this.name}, got ${config.provider}`
      });
    }
  }

  /**
   * Validate image file before processing
   */
  protected async validateImageFile(imageUri: string): Promise<void> {
    try {
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        throw new OCRError({
          code: 'UNSUPPORTED_FORMAT',
          message: 'Image file does not exist'
        });
      }

      // Check file size
      if (fileInfo.size && fileInfo.size > this.maxFileSize) {
        throw new OCRError({
          code: 'UNSUPPORTED_FORMAT',
          message: `File size ${Math.round(fileInfo.size / 1024 / 1024)}MB exceeds maximum ${Math.round(this.maxFileSize / 1024 / 1024)}MB`
        });
      }

      // Check file format by extension
      const extension = imageUri.split('.').pop()?.toLowerCase();
      if (!extension || !this.supportedFormats.includes(extension)) {
        throw new OCRError({
          code: 'UNSUPPORTED_FORMAT',
          message: `Unsupported file format: ${extension}. Supported formats: ${this.supportedFormats.join(', ')}`
        });
      }
    } catch (error) {
      if (error instanceof OCRError) {
        throw error;
      }
      throw new OCRError({
        code: 'PROCESSING_FAILED',
        message: 'Failed to validate image file',
        originalError: error as Error
      });
    }
  }

  /**
   * Convert image to base64 for API submission
   */
  protected async imageToBase64(imageUri: string): Promise<string> {
    try {
      let base64String: string;
      
      if (imageUri.startsWith('data:')) {
        // Already a data URI, extract base64 part
        base64String = imageUri.split(',')[1];
      } else {
        // Read file and convert to base64
        base64String = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      return base64String;
    } catch (error) {
      throw new OCRError({
        code: 'PROCESSING_FAILED',
        message: 'Failed to convert image to base64',
        originalError: error as Error
      });
    }
  }

  /**
   * Implement retry logic for API calls
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry certain types of errors
        if (error instanceof OCRError && 
            ['INVALID_API_KEY', 'UNSUPPORTED_FORMAT'].includes(error.code)) {
          throw error;
        }

        if (attempt < maxRetries) {
          console.warn(`${this.name} OCR attempt ${attempt} failed, retrying in ${delayMs}ms:`, error);
          await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
        }
      }
    }

    throw new OCRError({
      code: 'PROVIDER_ERROR',
      message: `${this.name} OCR failed after ${maxRetries} attempts`,
      originalError: lastError!
    });
  }

  /**
   * Abstract methods that must be implemented by each provider
   */
  abstract processImage(imageUri: string, options?: OCRProcessingOptions): Promise<CloudOCRResult>;
  abstract testConnection(): Promise<boolean>;

  /**
   * Optional method for getting usage statistics
   */
  async getUsage?(): Promise<{ requestsToday: number; costToday: number }>;

  /**
   * Get provider information
   */
  getInfo(): { name: OCRProviderType; configured: boolean; formats: string[]; maxSize: string } {
    return {
      name: this.name,
      configured: this.isConfigured(),
      formats: this.supportedFormats,
      maxSize: `${Math.round(this.maxFileSize / 1024 / 1024)}MB`
    };
  }
}