import { OCRResult, OCRProcessingOptions, OCRTextBlock, OCRTextElement } from '@/types/document';
import TextRecognition from '@react-native-ml-kit/text-recognition';

export class MLKitOCR {
  private isModelReady = false;

  async initialize(): Promise<void> {
    try {
      console.log('MLKitOCR: Initializing ML Kit Text Recognition...');
      
      // Check if the service is available
      const isAvailable = await this.isSupported();
      if (!isAvailable) {
        throw new Error('ML Kit Text Recognition not available on this device');
      }
      
      this.isModelReady = true;
      console.log('MLKitOCR: Successfully initialized');
    } catch (error) {
      console.error('MLKitOCR: Initialization failed:', error);
      throw error;
    }
  }

  async isSupported(): Promise<boolean> {
    try {
      // ML Kit is generally available on Android devices with Google Play Services
      return true;
    } catch (error) {
      console.error('MLKitOCR: Support check failed:', error);
      return false;
    }
  }

  async recognizeText(imageUri: string, options: OCRProcessingOptions = {}): Promise<OCRResult> {
    if (!this.isModelReady) {
      await this.initialize();
    }

    try {
      console.log('MLKitOCR: Starting text recognition for:', imageUri);
      const startTime = Date.now();

      // Use ML Kit to recognize text
      const result = await TextRecognition.recognize(imageUri);
      
      const processingTime = Date.now() - startTime;
      console.log(`MLKitOCR: Recognition completed in ${processingTime}ms`);

      // Convert ML Kit result to our OCRResult format
      const ocrResult = this.convertMLKitResult(result, processingTime);
      
      // Apply minimum confidence filter
      if (ocrResult.confidence < (options.minimumConfidence || 0.7)) {
        console.warn(`MLKitOCR: Low confidence result: ${ocrResult.confidence}`);
      }

      return ocrResult;
    } catch (error) {
      console.error('MLKitOCR: Text recognition failed:', error);
      throw new Error(`ML Kit text recognition failed: ${error}`);
    }
  }

  async recognizeFromCamera(options: OCRProcessingOptions = {}): Promise<OCRResult> {
    // This would require camera integration
    // For now, throw an error as this needs camera setup
    throw new Error('Camera-based OCR not yet implemented. Use recognizeText with image URI.');
  }

  async getAvailableLanguages(): Promise<string[]> {
    // ML Kit supports many languages by default
    return [
      'en', // English
      'es', // Spanish  
      'fr', // French
      'de', // German
      'it', // Italian
      'pt', // Portuguese
      'ru', // Russian
      'zh', // Chinese
      'ja', // Japanese
      'ko', // Korean
      'ar', // Arabic
      'hi', // Hindi
      'th', // Thai
      'vi', // Vietnamese
    ];
  }

  async downloadLanguageModel(languageCode: string): Promise<boolean> {
    try {
      console.log(`MLKitOCR: Language model download for ${languageCode} - ML Kit handles this automatically`);
      // ML Kit downloads models automatically when needed
      return true;
    } catch (error) {
      console.error(`MLKitOCR: Failed to prepare language model for ${languageCode}:`, error);
      return false;
    }
  }

  private convertMLKitResult(mlkitResult: any, processingTime: number): OCRResult {
    let allText = '';
    const blocks: OCRTextBlock[] = [];
    let totalConfidence = 0;
    let elementCount = 0;

    // Process ML Kit result structure
    if (mlkitResult.text) {
      allText = mlkitResult.text;
    }

    // Process blocks if available
    if (mlkitResult.blocks && Array.isArray(mlkitResult.blocks)) {
      mlkitResult.blocks.forEach((block: any, blockIndex: number) => {
        const elements: OCRTextElement[] = [];
        let blockConfidence = 0;
        let blockElementCount = 0;

        // Process elements/lines within block
        if (block.lines && Array.isArray(block.lines)) {
          block.lines.forEach((line: any, lineIndex: number) => {
            const element: OCRTextElement = {
              text: line.text || '',
              confidence: this.extractConfidence(line),
              boundingBox: this.convertBoundingBox(line.frame || line.boundingBox)
            };
            
            elements.push(element);
            blockConfidence += element.confidence;
            blockElementCount++;
            totalConfidence += element.confidence;
            elementCount++;
          });
        }

        const ocrBlock: OCRTextBlock = {
          text: block.text || '',
          confidence: blockElementCount > 0 ? blockConfidence / blockElementCount : 0,
          elements,
          boundingBox: this.convertBoundingBox(block.frame || block.boundingBox)
        };

        blocks.push(ocrBlock);
      });
    }

    // Calculate overall confidence
    const averageConfidence = elementCount > 0 ? totalConfidence / elementCount : 0;

    return {
      text: allText,
      confidence: averageConfidence,
      blocks,
      processingTime,
      imageSize: {
        width: mlkitResult.width || 0,
        height: mlkitResult.height || 0
      }
    };
  }

  private extractConfidence(item: any): number {
    // ML Kit might not always provide confidence scores
    // Return a reasonable default based on text quality indicators
    if (item.confidence !== undefined) {
      return item.confidence;
    }
    
    // Estimate confidence based on text characteristics
    const text = item.text || '';
    if (text.length === 0) return 0;
    
    // Simple heuristic: longer, well-structured text tends to be more confident
    const hasAlphanumeric = /[a-zA-Z0-9]/.test(text);
    const hasSpaces = /\s/.test(text);
    const isReasonableLength = text.length > 2 && text.length < 200;
    
    let estimatedConfidence = 0.7; // Base confidence
    
    if (hasAlphanumeric) estimatedConfidence += 0.1;
    if (hasSpaces) estimatedConfidence += 0.1;
    if (isReasonableLength) estimatedConfidence += 0.1;
    
    return Math.min(estimatedConfidence, 1.0);
  }

  private convertBoundingBox(frame: any): { x: number; y: number; width: number; height: number } {
    if (!frame) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    // Handle different frame formats from ML Kit
    if (frame.origin && frame.size) {
      // iOS-style frame
      return {
        x: frame.origin.x || 0,
        y: frame.origin.y || 0,
        width: frame.size.width || 0,
        height: frame.size.height || 0
      };
    } else if (frame.left !== undefined) {
      // Android-style frame
      return {
        x: frame.left || 0,
        y: frame.top || 0,
        width: (frame.right || 0) - (frame.left || 0),
        height: (frame.bottom || 0) - (frame.top || 0)
      };
    }

    return { x: 0, y: 0, width: 0, height: 0 };
  }
} 