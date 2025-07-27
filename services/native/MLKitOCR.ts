import { OCRResult, OCRProcessingOptions, OCRTextBlock, OCRTextElement } from '@/types/document';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

// Import the actual ML Kit OCR library
let MlkitOcr: any = null;

// Try to import the library, handle gracefully if not available
try {
  MlkitOcr = require('react-native-mlkit-ocr').default;
  console.log('MLKitOCR: Library imported successfully');
} catch (error) {
  console.warn('MLKit OCR library not available, using intelligent fallback');
}

export class MLKitOCR {
  private isModelReady = false;
  private useRealOCR = false;
  private initializationError: Error | null = null;

  async initialize(): Promise<void> {
    try {
      console.log('MLKitOCR: Initializing...');
      
      // Check if we can use real ML Kit OCR
      if (MlkitOcr && (Platform.OS === 'android' || Platform.OS === 'ios')) {
        try {
          console.log('MLKitOCR: Testing real ML Kit OCR capability...');
          
          // Create a simple test image (1x1 white pixel) to test the library
          const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
          const testImageUri = `data:image/png;base64,${testImageBase64}`;
          
          // Test if ML Kit is available and working
          const testResult = await MlkitOcr.detectFromUri(testImageUri);
          console.log('MLKitOCR: Test result:', testResult);
          
          this.useRealOCR = true;
          console.log('MLKitOCR: ✅ Successfully initialized with real ML Kit OCR');
          
        } catch (error) {
          console.warn('MLKitOCR: ❌ Real ML Kit failed, using intelligent fallback:', error);
          this.initializationError = error as Error;
          this.useRealOCR = false;
        }
      } else {
        console.log('MLKitOCR: Using intelligent analysis mode (real ML Kit not available)');
        this.useRealOCR = false;
      }
      
      this.isModelReady = true;
      console.log(`MLKitOCR: Initialized successfully (useRealOCR: ${this.useRealOCR})`);
    } catch (error) {
      console.error('MLKitOCR: Initialization failed:', error);
      this.initializationError = error as Error;
      this.isModelReady = true; // Set to true to allow fallback processing
      this.useRealOCR = false;
    }
  }

  async testOCRCapability(): Promise<void> {
    console.log('=== MLKitOCR Debug Test ===');
    console.log('Platform:', Platform.OS);
    console.log('MlkitOcr available:', !!MlkitOcr);
    console.log('useRealOCR:', this.useRealOCR);
    console.log('isModelReady:', this.isModelReady);
    
    if (this.initializationError) {
      console.log('Initialization error:', this.initializationError.message);
    }
    
    if (MlkitOcr) {
      try {
        const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        const testImageUri = `data:image/png;base64,${testImageBase64}`;
        const testResult = await MlkitOcr.detectFromUri(testImageUri);
        console.log('Test OCR result:', testResult);
      } catch (error) {
        console.error('Test OCR failed:', error);
      }
    }
  }

  async isSupported(): Promise<boolean> {
    return this.useRealOCR;
  }

  async getAvailableLanguages(): Promise<string[]> {
    if (this.useRealOCR) {
      return ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ru', 'ar', 'hi'];
    }
    return ['en'];
  }

  async downloadLanguageModel(languageCode: string): Promise<boolean> {
    if (this.useRealOCR) {
      console.log(`MLKitOCR: Language model for ${languageCode} is managed by ML Kit`);
      return true;
    }
    return false;
  }

  async recognizeText(imageUri: string, options: OCRProcessingOptions = {}): Promise<OCRResult> {
    if (!this.isModelReady) {
      await this.initialize();
    }

    try {
      console.log('MLKitOCR: Starting text recognition for:', imageUri);
      const startTime = Date.now();

      let result: Omit<OCRResult, 'processingTime'>;

      if (this.useRealOCR && MlkitOcr) {
        console.log('MLKitOCR: Using real ML Kit OCR');
        result = await this.performRealMLKitOCR(imageUri, options);
      } else {
        console.log('MLKitOCR: Using intelligent analysis fallback');
        result = await this.performIntelligentAnalysis(imageUri, options);
      }

      const processingTime = Date.now() - startTime;
      console.log(`MLKitOCR: Recognition completed in ${processingTime}ms`);

      return {
        ...result,
        processingTime
      };
    } catch (error) {
      console.error('MLKitOCR: Text recognition failed:', error);
      throw new Error(`ML Kit text recognition failed: ${error}`);
    }
  }

  async recognizeFromCamera(options: OCRProcessingOptions = {}): Promise<OCRResult> {
    if (!this.isModelReady) {
      await this.initialize();
    }

    throw new Error('Camera OCR not yet implemented for ML Kit');
  }

  private async performRealMLKitOCR(imageUri: string, options: OCRProcessingOptions): Promise<Omit<OCRResult, 'processingTime'>> {
    try {
      console.log('MLKitOCR: Performing real ML Kit OCR on:', imageUri);
      
      // Use the actual ML Kit OCR library
      const result = await MlkitOcr.detectFromUri(imageUri);
      
      console.log('MLKitOCR: Real OCR result:', {
        textLength: result?.length || 0,
        blocks: result?.length || 0,
        rawResult: result
      });

      if (!result || result.length === 0) {
        console.warn('MLKitOCR: No text detected by real ML Kit OCR');
        return this.createEmptyResult();
      }

      // Convert ML Kit result to our format
      const fullText = result.map((block: any) => block.text).join('\n');
      const blocks: OCRTextBlock[] = result.map((block: any) => {
        const elements: OCRTextElement[] = block.lines?.map((line: any) => ({
          text: line.text,
          confidence: line.confidence || 0.8,
          boundingBox: {
            x: line.cornerPoints?.[0]?.x || 0,
            y: line.cornerPoints?.[0]?.y || 0,
            width: Math.abs((line.cornerPoints?.[1]?.x || 0) - (line.cornerPoints?.[0]?.x || 0)),
            height: Math.abs((line.cornerPoints?.[2]?.y || 0) - (line.cornerPoints?.[0]?.y || 0))
          }
        })) || [{
          text: block.text,
          confidence: block.confidence || 0.8,
          boundingBox: {
            x: block.cornerPoints?.[0]?.x || 0,
            y: block.cornerPoints?.[0]?.y || 0,
            width: Math.abs((block.cornerPoints?.[1]?.x || 0) - (block.cornerPoints?.[0]?.x || 0)),
            height: Math.abs((block.cornerPoints?.[2]?.y || 0) - (block.cornerPoints?.[0]?.y || 0))
          }
        }];

        return {
          text: block.text,
          confidence: block.confidence || 0.8,
          elements,
          boundingBox: {
            x: block.cornerPoints?.[0]?.x || 0,
            y: block.cornerPoints?.[0]?.y || 0,
            width: Math.abs((block.cornerPoints?.[1]?.x || 0) - (block.cornerPoints?.[0]?.x || 0)),
            height: Math.abs((block.cornerPoints?.[2]?.y || 0) - (block.cornerPoints?.[0]?.y || 0))
          }
        };
      });

      // Calculate overall confidence
      const totalConfidence = blocks.reduce((sum, block) => sum + block.confidence, 0);
      const averageConfidence = blocks.length > 0 ? totalConfidence / blocks.length : 0;

      console.log(`MLKitOCR: ✅ Real OCR extracted ${fullText.length} characters with confidence ${averageConfidence.toFixed(2)}`);
      console.log(`MLKitOCR: Extracted text: "${fullText.substring(0, 100)}${fullText.length > 100 ? '...' : ''}"`);

      return {
        text: fullText,
        confidence: averageConfidence,
        blocks,
        imageSize: { width: 0, height: 0 } // Will be filled by the calling function if needed
      };

    } catch (error) {
      console.error('MLKitOCR: Real OCR processing failed:', error);
      throw error;
    }
  }

  private async performIntelligentAnalysis(imageUri: string, options: OCRProcessingOptions): Promise<Omit<OCRResult, 'processingTime'>> {
    console.log('MLKitOCR: OCR failed - no fallback text generation');
    
    // No fake text generation - throw error for honest handling
    throw new Error('MLKit OCR not available - real text extraction failed');
  }

// REMOVED: analyzeImageCharacteristics - no fake content analysis needed

// REMOVED: generateFallbackText - no fake text generation

// REMOVED: createMinimalResult - no fake results

  private createEmptyResult(): Omit<OCRResult, 'processingTime'> {
    return {
      text: '',
      confidence: 0,
      blocks: [],
      imageSize: { width: 0, height: 0 }
    };
  }

// REMOVED: createOCRResult - no fake OCR result generation
} 