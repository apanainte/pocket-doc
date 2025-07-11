import { Platform, Alert } from 'react-native';
import { OCRResult, OCRProcessingOptions, OCRError } from '@/types/document';

// Platform-specific imports (will be implemented in native modules)
import { VisionKitOCR } from './native/VisionKitOCR';
import { MLKitOCR } from './native/MLKitOCR';

export class OCRService {
  private static instance: OCRService;
  private visionKitOCR?: VisionKitOCR;
  private mlKitOCR?: MLKitOCR;
  private isInitialized = false;

  private constructor() {
    // Singleton pattern
  }

  static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) return;

      if (Platform.OS === 'ios') {
        this.visionKitOCR = new VisionKitOCR();
        await this.visionKitOCR.initialize();
      } else if (Platform.OS === 'android') {
        this.mlKitOCR = new MLKitOCR();
        await this.mlKitOCR.initialize();
      } else {
        // Web fallback - disable OCR but don't throw error
        console.log('OCR not available on web platform, using mock data');
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize OCR service:', error);
      // Don't throw error - gracefully fallback to mock metadata
      this.isInitialized = true;
      console.log('OCR initialization failed, will use mock data for metadata generation');
    }
  }

  async isSupported(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        return this.visionKitOCR?.isSupported() ?? false;
      } else if (Platform.OS === 'android') {
        return this.mlKitOCR?.isSupported() ?? false;
      }
      return false;
    } catch (error) {
      console.error('Error checking OCR support:', error);
      return false;
    }
  }

  async recognizeText(
    imageUri: string,
    options: OCRProcessingOptions = {}
  ): Promise<OCRResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const defaultOptions: OCRProcessingOptions = {
      language: 'en',
      recognitionLevel: 'accurate',
      minimumConfidence: 0.7,
      imagePreprocessing: {
        autoRotate: true,
        enhanceContrast: true,
        denoiseImage: false
      },
      ...options
    };

    try {
      const startTime = Date.now();

      let result: OCRResult;
      if (Platform.OS === 'ios' && this.visionKitOCR) {
        result = await this.visionKitOCR.recognizeText(imageUri, defaultOptions);
      } else if (Platform.OS === 'android' && this.mlKitOCR) {
        result = await this.mlKitOCR.recognizeText(imageUri, defaultOptions);
      } else {
        throw new OCRError({
          code: 'DEVICE_NOT_SUPPORTED',
          message: 'OCR not available on this platform'
        });
      }

      const processingTime = Date.now() - startTime;
      
      return {
        ...result,
        processingTime,
        text: this.postProcessText(result.text)
      };

    } catch (error) {
      console.error('OCR recognition failed:', error);
      
      if (error instanceof OCRError) {
        throw error;
      }
      
      throw new OCRError({
        code: 'PROCESSING_FAILED',
        message: 'Failed to recognize text from image',
        originalError: error as Error
      });
    }
  }

  async recognizeTextFromCamera(
    options: OCRProcessingOptions = {}
  ): Promise<OCRResult> {
    try {
      if (Platform.OS === 'ios' && this.visionKitOCR) {
        return await this.visionKitOCR.recognizeFromCamera(options);
      } else if (Platform.OS === 'android' && this.mlKitOCR) {
        return await this.mlKitOCR.recognizeFromCamera(options);
      } else {
        throw new OCRError({
          code: 'DEVICE_NOT_SUPPORTED',
          message: 'Camera OCR not available on this platform'
        });
      }
    } catch (error) {
      console.error('Camera OCR failed:', error);
      throw new OCRError({
        code: 'PROCESSING_FAILED',
        message: 'Failed to recognize text from camera',
        originalError: error as Error
      });
    }
  }

  private postProcessText(text: string): string {
    // Clean up common OCR artifacts
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/([.!?])\s*([A-Z])/g, '$1 $2') // Fix sentence spacing
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Fix missing spaces between words
      .trim();
  }

  async getAvailableLanguages(): Promise<string[]> {
    if (Platform.OS === 'ios' && this.visionKitOCR) {
      return await this.visionKitOCR.getAvailableLanguages();
    } else if (Platform.OS === 'android' && this.mlKitOCR) {
      return await this.mlKitOCR.getAvailableLanguages();
    }
    return ['en']; // Default to English
  }

  async downloadLanguageModel(languageCode: string): Promise<boolean> {
    try {
      if (Platform.OS === 'android' && this.mlKitOCR) {
        return await this.mlKitOCR.downloadLanguageModel(languageCode);
      }
      // iOS VisionKit uses system-wide language models
      return true;
    } catch (error) {
      console.error('Failed to download language model:', error);
      return false;
    }
  }
}

// Export singleton instance
export const ocrService = OCRService.getInstance(); 