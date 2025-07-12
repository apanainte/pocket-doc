/**
 * OCR Service - Optical Character Recognition
 * 
 * This service provides text recognition capabilities for different platforms:
 * - iOS: Uses ML Kit OCR (primary) with VisionKit fallback
 * - Android: Uses ML Kit OCR for text recognition
 * - Web: Uses simulation for development
 * 
 * The service follows a singleton pattern to ensure consistent state
 * across the application and implements clean architecture principles.
 */

import { Platform, Alert } from 'react-native';
import { OCRResult, OCRProcessingOptions, OCRError } from '@/types/document';

// Platform-specific OCR implementations
import { VisionKitOCR } from './native/VisionKitOCR';
import { MLKitOCR } from './native/MLKitOCR';

/**
 * OCR Engine priority configuration
 */
interface OCREngineConfig {
  primary: 'mlkit' | 'visionkit';
  fallback?: 'mlkit' | 'visionkit';
  enableDebugLogs: boolean;
}

/**
 * Main OCR Service class
 * Handles text recognition across different platforms using clean architecture
 */
export class OCRService {
  private static instance: OCRService;
  private visionKitOCR?: VisionKitOCR;
  private mlKitOCR?: MLKitOCR;
  private isInitialized = false;
  private initializationError: Error | null = null;
  private debugMode = false;
  private engineConfig: OCREngineConfig;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Singleton pattern - prevents direct instantiation
    this.debugMode = __DEV__ || false;
    
    // Configure OCR engines - MLKit is primary for both platforms
    this.engineConfig = {
      primary: 'mlkit',
      fallback: Platform.OS === 'ios' ? 'visionkit' : undefined,
      enableDebugLogs: this.debugMode
    };
  }

  /**
   * Get the singleton instance of OCRService
   * @returns The OCRService instance
   */
  static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  /**
   * Enable debug mode for detailed logging
   */
  enableDebugMode(): void {
    this.debugMode = true;
    this.engineConfig.enableDebugLogs = true;
    console.log('OCRService: Debug mode enabled');
  }

  /**
   * Disable debug mode
   */
  disableDebugMode(): void {
    this.debugMode = false;
    this.engineConfig.enableDebugLogs = false;
    console.log('OCRService: Debug mode disabled');
  }

  /**
   * Test OCR capabilities on current platform
   */
  async testOCRCapabilities(): Promise<void> {
    console.log('=== OCR Service Debug Test ===');
    console.log('Platform:', Platform.OS);
    console.log('Debug mode:', this.debugMode);
    console.log('Initialized:', this.isInitialized);
    console.log('Engine config:', this.engineConfig);
    
    if (this.initializationError) {
      console.log('Service initialization error:', this.initializationError.message);
    }

    // Test MLKit OCR (primary engine)
    if (this.mlKitOCR) {
      console.log('\n--- Testing ML Kit OCR (Primary) ---');
      try {
        await this.mlKitOCR.testOCRCapability();
        const isSupported = await this.mlKitOCR.isSupported();
        console.log('ML Kit supported:', isSupported);
      } catch (error) {
        console.error('ML Kit test failed:', error);
      }
    }

    // Test VisionKit OCR (fallback for iOS)
    if (Platform.OS === 'ios' && this.visionKitOCR) {
      console.log('\n--- Testing VisionKit OCR (Fallback) ---');
      try {
        await this.visionKitOCR.testOCRCapability();
        const isSupported = await this.visionKitOCR.isSupported();
        console.log('VisionKit supported:', isSupported);
      } catch (error) {
        console.error('VisionKit test failed:', error);
      }
    }

    // Test available languages
    console.log('\n--- Available Languages ---');
    try {
      const languages = await this.getAvailableLanguages();
      console.log('Languages:', languages);
    } catch (error) {
      console.error('Language detection failed:', error);
    }

    console.log('=== OCR Test Complete ===\n');
  }

  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) return;

      console.log('OCRService: Initializing with clean architecture...');
      console.log(`OCRService: Platform: ${Platform.OS}, Primary engine: ${this.engineConfig.primary}`);

      // Initialize MLKitOCR as primary engine for both iOS and Android
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        try {
          console.log('OCRService: Initializing MLKit OCR (Primary Engine)...');
          this.mlKitOCR = new MLKitOCR();
          await this.mlKitOCR.initialize();
          console.log(`OCRService: ✅ ML Kit initialized successfully for ${Platform.OS}`);
        } catch (error) {
          console.error('OCRService: ❌ MLKit initialization failed:', error);
          this.initializationError = error as Error;
        }
        
        // Initialize VisionKit as fallback for iOS only
        if (Platform.OS === 'ios' && this.engineConfig.fallback === 'visionkit') {
          try {
            console.log('OCRService: Initializing VisionKit OCR (Fallback Engine)...');
            this.visionKitOCR = new VisionKitOCR();
            await this.visionKitOCR.initialize();
            console.log('OCRService: ✅ VisionKit fallback initialized');
          } catch (error) {
            console.warn('OCRService: ⚠️ VisionKit fallback initialization failed:', error);
            // Don't set initializationError for fallback failure
          }
        }
      } else {
        // Web fallback - disable OCR but don't throw error
        console.log('OCRService: Web platform detected, OCR capabilities limited');
      }

      this.isInitialized = true;
      console.log('OCRService: ✅ Initialization completed successfully');
      
      // Run debug test in debug mode
      if (this.debugMode) {
        await this.testOCRCapabilities();
      }
    } catch (error) {
      console.error('OCRService: ❌ Critical initialization failed:', error);
      this.initializationError = error as Error;
      // Don't throw error - gracefully fallback to mock metadata
      this.isInitialized = true;
      console.log('OCRService: Using fallback mode due to initialization failure');
    }
  }

  async isSupported(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Check primary engine (MLKit) first
      if (this.mlKitOCR) {
        const mlkitSupported = await this.mlKitOCR.isSupported();
        if (mlkitSupported) {
          return true;
        }
      }

      // Check fallback engine (VisionKit for iOS)
      if (Platform.OS === 'ios' && this.visionKitOCR) {
        return this.visionKitOCR.isSupported() ?? false;
      }
      
      return false;
    } catch (error) {
      console.error('OCRService: Error checking OCR support:', error);
      return false;
    }
  }

  /**
   * Recognize text from professionally scanned documents with enhanced preprocessing
   * Optimized for high-quality, perspective-corrected documents
   */
  async recognizeTextFromScannedDocument(
    imageUri: string,
    options: OCRProcessingOptions = {}
  ): Promise<OCRResult> {
    const scannedDocumentOptions: OCRProcessingOptions = {
      language: 'en',
      recognitionLevel: 'accurate',
      minimumConfidence: 0.8, // Higher confidence for scanned docs
      imagePreprocessing: {
        autoRotate: false, // Scanner already handles rotation
        enhanceContrast: true,
        denoiseImage: true, // More aggressive denoising for scanned docs
      },
      ...options
    };

    if (this.debugMode) {
      console.log('OCRService: Processing professionally scanned document');
      console.log('OCRService: Using enhanced preprocessing for scanned document');
    }

    return this.recognizeText(imageUri, scannedDocumentOptions);
  }

  /**
   * Recognize text from image using the best available OCR engine
   * Follows clean architecture with clear separation of concerns
   */
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
      if (this.debugMode) {
        console.log('OCRService: Starting text recognition with enhanced engine selection');
        console.log('OCRService: Options:', defaultOptions);
        console.log('OCRService: Image URI:', imageUri.substring(0, 50) + '...');
      }

      const startTime = Date.now();
      let result: OCRResult;
      let engineUsed = 'unknown';

      // Primary: Try MLKit OCR first (works on both iOS and Android)
      if (this.mlKitOCR) {
        try {
          console.log(`OCRService: 🚀 Using MLKit OCR (Primary) for ${Platform.OS}`);
          result = await this.mlKitOCR.recognizeText(imageUri, defaultOptions);
          engineUsed = 'mlkit-primary';
          
          // Validate result quality
          if (result.text && result.text.trim().length > 0 && result.confidence > 0.3) {
            console.log(`OCRService: ✅ MLKit OCR succeeded with confidence ${result.confidence.toFixed(2)}`);
          } else {
            throw new Error(`Low quality result: text length ${result.text?.length}, confidence ${result.confidence}`);
          }
        } catch (error) {
          console.warn(`OCRService: ⚠️ MLKit OCR failed for ${Platform.OS}:`, error);
          
          // Fallback to VisionKit for iOS only
          if (Platform.OS === 'ios' && this.visionKitOCR) {
            console.log('OCRService: 🔄 Falling back to VisionKit OCR for iOS');
            result = await this.visionKitOCR.recognizeText(imageUri, defaultOptions);
            engineUsed = 'visionkit-fallback';
          } else {
            throw error; // Re-throw if no fallback available
          }
        }
      } else if (Platform.OS === 'ios' && this.visionKitOCR) {
        // Fallback: VisionKit for iOS if MLKit is not available
        console.log('OCRService: 🔄 Using VisionKit OCR (MLKit not available)');
        result = await this.visionKitOCR.recognizeText(imageUri, defaultOptions);
        engineUsed = 'visionkit-only';
      } else {
        throw new OCRError({
          code: 'DEVICE_NOT_SUPPORTED',
          message: 'No OCR engines available on this platform'
        });
      }

      const processingTime = Date.now() - startTime;
      
      const finalResult = {
        ...result,
        processingTime,
        text: this.postProcessText(result.text)
      };

      if (this.debugMode) {
        console.log('OCRService: ✅ Recognition completed successfully');
        console.log(`OCRService: Engine used: ${engineUsed}`);
        console.log(`OCRService: Processing time: ${processingTime}ms`);
        console.log(`OCRService: Text length: ${finalResult.text.length} characters`);
        console.log(`OCRService: Confidence: ${(finalResult.confidence * 100).toFixed(1)}%`);
        console.log(`OCRService: Blocks: ${finalResult.blocks.length}`);
        console.log(`OCRService: Text preview: "${finalResult.text.substring(0, 100)}${finalResult.text.length > 100 ? '...' : ''}"`);
      }

      return finalResult;

    } catch (error) {
      console.error('OCRService: ❌ All OCR engines failed:', error);
      
      if (error instanceof OCRError) {
        throw error;
      }
      
      throw new OCRError({
        code: 'PROCESSING_FAILED',
        message: 'Failed to recognize text from image using all available engines',
        originalError: error as Error
      });
    }
  }

  async recognizeTextFromCamera(
    options: OCRProcessingOptions = {}
  ): Promise<OCRResult> {
    try {
      if (this.debugMode) {
        console.log('OCRService: Starting camera text recognition');
      }

      // Prioritize MLKit for camera OCR
      if (this.mlKitOCR) {
        return await this.mlKitOCR.recognizeFromCamera(options);
      } else if (Platform.OS === 'ios' && this.visionKitOCR) {
        return await this.visionKitOCR.recognizeFromCamera(options);
      } else {
        throw new OCRError({
          code: 'DEVICE_NOT_SUPPORTED',
          message: 'Camera OCR not available on this platform'
        });
      }
    } catch (error) {
      console.error('OCRService: ❌ Camera OCR failed:', error);
      throw new OCRError({
        code: 'PROCESSING_FAILED',
        message: 'Failed to recognize text from camera',
        originalError: error as Error
      });
    }
  }

  private postProcessText(text: string): string {
    // Enhanced text post-processing following clean architecture
    const cleanedText = text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/([.!?])\s*([A-Z])/g, '$1 $2') // Fix sentence spacing
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Fix missing spaces between words
      .replace(/([0-9])\s*([A-Z])/g, '$1 $2') // Fix number-letter spacing
      .replace(/[^\w\s.,!?;:()[\]{}"'-]/g, '') // Remove scanning artifacts
      .trim();

    if (this.debugMode) {
      console.log('OCRService: Post-processed text:', cleanedText !== text ? 'Yes' : 'No');
      if (cleanedText !== text) {
        console.log('OCRService: Original length:', text.length, '→ Cleaned length:', cleanedText.length);
      }
    }

    return cleanedText;
  }

  async getAvailableLanguages(): Promise<string[]> {
    try {
      // Prioritize MLKit languages
      if (this.mlKitOCR) {
        return await this.mlKitOCR.getAvailableLanguages();
      } else if (Platform.OS === 'ios' && this.visionKitOCR) {
        return await this.visionKitOCR.getAvailableLanguages();
      }
      return ['en']; // Default to English
    } catch (error) {
      console.error('OCRService: Error getting available languages:', error);
      return ['en'];
    }
  }

  async downloadLanguageModel(languageCode: string): Promise<boolean> {
    try {
      if (this.debugMode) {
        console.log(`OCRService: Downloading language model for ${languageCode}`);
      }

      // Try MLKit first
      if (this.mlKitOCR) {
        return await this.mlKitOCR.downloadLanguageModel(languageCode);
      }
      
      // VisionKit uses system-wide language models (no download needed)
      return true;
    } catch (error) {
      console.error('OCRService: Failed to download language model:', error);
      return false;
    }
  }

  /**
   * Test OCR with a sample image and display results
   * This is useful for debugging OCR issues in production
   */
  async testOCRWithSampleImage(): Promise<{
    success: boolean;
    text: string;
    confidence: number;
    engineUsed: string;
    error?: string;
    diagnostics: any;
  }> {
    try {
      console.log('🧪 Testing OCR with sample image...');
      
      // Create a simple test image (base64 encoded 1x1 pixel)
      const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      const testImageUri = `data:image/png;base64,${testImageBase64}`;
      
      const result = await this.recognizeText(testImageUri, {
        minimumConfidence: 0.5,
        recognitionLevel: 'accurate'
      });
      
      const diagnostics = await this.getDiagnostics();
      
      console.log('✅ OCR test completed successfully');
      console.log('📊 Results:', {
        textLength: result.text.length,
        confidence: result.confidence,
        blocks: result.blocks.length,
        processingTime: result.processingTime
      });
      
      return {
        success: true,
        text: result.text,
        confidence: result.confidence,
        engineUsed: this.mlKitOCR ? 'mlkit' : 'visionkit',
        diagnostics
      };
      
    } catch (error) {
      console.error('❌ OCR test failed:', error);
      const diagnostics = await this.getDiagnostics();
      
      return {
        success: false,
        text: '',
        confidence: 0,
        engineUsed: 'none',
        error: error instanceof Error ? error.message : 'Unknown error',
        diagnostics
      };
    }
  }

  /**
   * Test OCR with a real image and provide detailed feedback
   */
  async testOCRWithRealImage(imageUri: string): Promise<{
    success: boolean;
    results: {
      text: string;
      confidence: number;
      blocks: number;
      processingTime: number;
      textPreview: string;
      engineUsed: string;
    } | null;
    error?: string;
    suggestions: string[];
  }> {
    try {
      console.log('🖼️ Testing OCR with real image:', imageUri.substring(0, 50) + '...');
      
      const result = await this.recognizeText(imageUri, {
        minimumConfidence: 0.3, // Lower threshold for testing
        recognitionLevel: 'accurate'
      });
      
      const suggestions: string[] = [];
      const engineUsed = this.mlKitOCR ? 'mlkit' : 'visionkit';
      
      // Generate suggestions based on results
      if (result.confidence < 0.5) {
        suggestions.push('Low confidence detected - try a clearer image with better lighting');
      }
      
      if (result.text.length < 10) {
        suggestions.push('Very little text detected - ensure the image contains clear, readable text');
      }
      
      if (result.blocks.length === 0) {
        suggestions.push('No text blocks detected - the image might not contain readable text');
      }
      
      if (result.processingTime > 5000) {
        suggestions.push('Long processing time detected - consider using a smaller image');
      }

      if (engineUsed === 'visionkit') {
        suggestions.push('VisionKit fallback was used - MLKit may not be properly configured');
      }
      
      console.log('✅ Real image OCR test completed');
      console.log('📊 Results:', {
        textLength: result.text.length,
        confidence: result.confidence,
        blocks: result.blocks.length,
        processingTime: result.processingTime,
        engineUsed
      });
      
      return {
        success: true,
        results: {
          text: result.text,
          confidence: result.confidence,
          blocks: result.blocks.length,
          processingTime: result.processingTime,
          textPreview: result.text.substring(0, 100) + (result.text.length > 100 ? '...' : ''),
          engineUsed
        },
        suggestions
      };
      
    } catch (error) {
      console.error('❌ Real image OCR test failed:', error);
      
      const suggestions = [
        'Check if the image file exists and is accessible',
        'Ensure the image is a valid format (PNG, JPEG)',
        'Try with a different image',
        'Check console logs for detailed error information',
        'Verify OCR engines are properly initialized'
      ];
      
      return {
        success: false,
        results: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        suggestions
      };
    }
  }

  /**
   * Get service diagnostics for troubleshooting
   */
  async getDiagnostics(): Promise<{
    platform: string;
    initialized: boolean;
    supported: boolean;
    availableLanguages: string[];
    engineConfig: OCREngineConfig;
    mlkitAvailable: boolean;
    visionkitAvailable: boolean;
    error: string | null;
    debugMode: boolean;
  }> {
    try {
      return {
        platform: Platform.OS,
        initialized: this.isInitialized,
        supported: await this.isSupported(),
        availableLanguages: await this.getAvailableLanguages(),
        engineConfig: this.engineConfig,
        mlkitAvailable: !!this.mlKitOCR,
        visionkitAvailable: !!this.visionKitOCR,
        error: this.initializationError?.message || null,
        debugMode: this.debugMode
      };
    } catch (error) {
      return {
        platform: Platform.OS,
        initialized: this.isInitialized,
        supported: false,
        availableLanguages: [],
        engineConfig: this.engineConfig,
        mlkitAvailable: !!this.mlKitOCR,
        visionkitAvailable: !!this.visionKitOCR,
        error: error instanceof Error ? error.message : 'Unknown error',
        debugMode: this.debugMode
      };
    }
  }
}

// Export singleton instance
export const ocrService = OCRService.getInstance();
