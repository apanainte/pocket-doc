/**
 * OpenAI OCR Provider - GPT-4o-mini Implementation
 * 
 * This provider uses OpenAI's GPT-4o-mini vision model for OCR and enhanced
 * metadata generation. It provides high-quality text extraction and intelligent
 * document analysis with precise tagging and descriptions.
 */

import { BaseOCRProvider } from './BaseOCRProvider';
import { CloudOCRResult, OCRProcessingOptions, OCRError, OCRTextBlock, OCRTextElement } from '@/types/document';

interface OpenAIVisionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenAIOCRResult {
  extractedText: string;
  confidence: number;
  metadata: {
    title: string;
    description: string;
    tags: string[];
    categories: string[];
    keyInformation: string[];
    documentType: string;
    language: string;
  };
  analysis: {
    quality: 'excellent' | 'good' | 'fair' | 'poor';
    readability: number;
    structure: string;
    recommendations: string[];
  };
}

export class OpenAIOCRProvider extends BaseOCRProvider {
  public readonly name = 'openai' as const;
  public readonly supportedFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  public readonly maxFileSize = 20 * 1024 * 1024; // 20MB - OpenAI limit

  private readonly baseUrl = 'https://api.openai.com/v1';
  private readonly model = 'gpt-4o-mini';

  /**
   * Create a timeout-compatible abort controller for React Native
   */
  private createTimeoutController(timeoutMs: number): AbortController {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);
    
    // Clean up timeout when request completes
    const originalSignal = controller.signal;
    const cleanup = () => clearTimeout(timeoutId);
    originalSignal.addEventListener('abort', cleanup);
    
    return controller;
  }

  /**
   * Test connection to OpenAI API
   */
  async testConnection(): Promise<boolean> {
    try {
      const timeoutController = this.createTimeoutController(5000); // 5 second timeout
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config!.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: timeoutController.signal
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new OCRError({
            code: 'INVALID_API_KEY',
            message: 'Invalid OpenAI API key'
          });
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Check if GPT-4o-mini is available
      const hasModel = data.data?.some((model: any) => 
        model.id === this.model || model.id === 'gpt-4o-mini'
      );

      if (!hasModel) {
        console.warn('GPT-4o-mini not found in available models, but connection successful');
      }

      return true;
    } catch (error) {
      console.error('OpenAI connection test failed:', error);
      if (error instanceof OCRError) {
        throw error;
      }
      return false;
    }
  }

  /**
   * Process image using OpenAI GPT-4o-mini Vision
   */
  async processImage(imageUri: string, options: OCRProcessingOptions = {}): Promise<CloudOCRResult> {
    if (!this.isConfigured()) {
      throw new OCRError({
        code: 'PROVIDER_ERROR',
        message: 'OpenAI provider not initialized'
      });
    }

    await this.validateImageFile(imageUri);
    
    const startTime = Date.now();
    console.log('🚀 OpenAI OCR: Starting image processing with GPT-4o-mini');

    try {
      const base64Image = await this.imageToBase64(imageUri);
      
      // Determine media type from file extension
      const extension = imageUri.split('.').pop()?.toLowerCase();
      const mediaType = extension === 'png' ? 'image/png' : 'image/jpeg';

      const result = await this.withRetry(async () => {
        return await this.callOpenAIVision(base64Image, mediaType, options);
      }, this.config!.maxRetries || 3);

      const processingTime = Date.now() - startTime;
      
      console.log(`✅ OpenAI OCR: Processing completed in ${processingTime}ms`);
      console.log(`📊 OpenAI OCR: Text length: ${result.extractedText.length} characters`);
      console.log(`🎯 OpenAI OCR: Confidence: ${result.confidence}`);
      console.log(`🏷️ OpenAI OCR: Generated ${result.metadata.tags.length} tags`);

      // Convert to standard OCR format
      return this.convertToStandardFormat(result, processingTime);

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`❌ OpenAI OCR: Processing failed after ${processingTime}ms:`, error);
      
      if (error instanceof OCRError) {
        throw error;
      }
      
      throw new OCRError({
        code: 'PROCESSING_FAILED',
        message: 'OpenAI OCR processing failed',
        originalError: error as Error
      });
    }
  }

  /**
   * Call OpenAI Vision API with structured prompt for OCR and metadata
   */
  private async callOpenAIVision(
    base64Image: string, 
    mediaType: string, 
    options: OCRProcessingOptions
  ): Promise<OpenAIOCRResult> {
    const prompt = this.buildOCRPrompt(options);
    
    const requestBody = {
      model: this.model,
      messages: [
        {
          role: 'user' as const,
          content: [
            {
              type: 'text' as const,
              text: prompt
            },
            {
              type: 'image_url' as const,
              image_url: {
                url: `data:${mediaType};base64,${base64Image}`,
                detail: options.recognitionLevel === 'fast' ? 'low' : 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.1, // Low temperature for consistent, accurate results
      response_format: { type: 'json_object' }
    };

    console.log('📤 OpenAI OCR: Sending request to GPT-4o-mini...');
    
    const timeoutController = this.createTimeoutController(this.config!.timeout || 30000);
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config!.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: timeoutController.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error Response:', errorText);
      
      if (response.status === 401) {
        throw new OCRError({
          code: 'INVALID_API_KEY',
          message: 'Invalid OpenAI API key'
        });
      } else if (response.status === 429) {
        throw new OCRError({
          code: 'PROVIDER_ERROR',
          message: 'OpenAI rate limit exceeded'
        });
      } else if (response.status >= 500) {
        throw new OCRError({
          code: 'PROVIDER_ERROR',
          message: 'OpenAI server error'
        });
      }
      
      throw new OCRError({
        code: 'PROVIDER_ERROR',
        message: `OpenAI API error: ${response.status} ${response.statusText}`
      });
    }

    const data: OpenAIVisionResponse = await response.json();
    console.log('📥 OpenAI OCR: Received response from API');
    
    if (!data.choices || data.choices.length === 0) {
      throw new OCRError({
        code: 'PROVIDER_ERROR',
        message: 'No response from OpenAI API'
      });
    }

    try {
      const content = data.choices[0].message.content;
      const parsedResult = JSON.parse(content) as OpenAIOCRResult;
      
      // Add usage information if available
      if (data.usage) {
        console.log(`💰 OpenAI OCR: Token usage - Input: ${data.usage.prompt_tokens}, Output: ${data.usage.completion_tokens}`);
      }
      
      return parsedResult;
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', data.choices[0].message.content);
      throw new OCRError({
        code: 'PROVIDER_ERROR',
        message: 'Failed to parse OpenAI response',
        originalError: parseError as Error
      });
    }
  }

  /**
   * Build comprehensive OCR prompt for GPT-4o-mini
   */
  private buildOCRPrompt(options: OCRProcessingOptions): string {
    const language = options.language || 'en';
    
    return `You are an advanced OCR and document analysis system. Analyze this image and extract ALL visible text with high precision, then generate intelligent metadata.

CRITICAL REQUIREMENTS:
1. Extract EVERY piece of visible text, including:
   - Main content (paragraphs, headings, body text)
   - Fine print, footnotes, disclaimers
   - Form fields, labels, captions
   - Headers, footers, watermarks
   - Numbers, dates, codes, references
   - Tables, lists, bullet points
   - Handwritten text (if legible)

2. Maintain text structure and formatting as much as possible
3. Generate precise, relevant metadata based on the actual content
4. Detect document type and provide intelligent categorization
5. Create actionable tags for document organization

RESPONSE FORMAT (JSON):
{
  "extractedText": "Complete text extracted from the image with proper formatting and structure",
  "confidence": 0.95,
  "metadata": {
    "title": "Concise, descriptive title based on actual content",
    "description": "Detailed description of document content and purpose",
    "tags": ["relevant", "specific", "actionable", "tags"],
    "categories": ["document_type", "subject_area"],
    "keyInformation": ["important facts", "key details", "critical data"],
    "documentType": "specific document type (e.g., invoice, contract, receipt, form, letter, report)",
    "language": "${language}"
  },
  "analysis": {
    "quality": "excellent|good|fair|poor",
    "readability": 0.9,
    "structure": "Description of document structure and layout",
    "recommendations": ["actionable suggestions for document handling"]
  }
}

QUALITY STANDARDS:
- Confidence should reflect actual text clarity and extraction accuracy
- Tags should be specific and useful for searching/organization
- Description should be informative and actionable
- Key information should highlight the most important content
- Document type should be as specific as possible

Analyze the image now and provide the complete JSON response.`;
  }

  /**
   * Convert OpenAI result to standard CloudOCRResult format
   */
  private convertToStandardFormat(result: OpenAIOCRResult, processingTime: number): CloudOCRResult {
    // Create synthetic text blocks for compatibility
    const blocks: OCRTextBlock[] = [];
    
    if (result.extractedText.trim()) {
      // Split text into logical blocks (paragraphs or sections)
      const textSections = result.extractedText.split(/\n\s*\n/).filter(section => section.trim());
      
      textSections.forEach((section, index) => {
        const lines = section.trim().split('\n');
        const elements: OCRTextElement[] = lines.map((line, lineIndex) => ({
          text: line.trim(),
          confidence: result.confidence,
          boundingBox: {
            x: 0,
            y: lineIndex * 20,
            width: line.length * 8, // Approximate width
            height: 18
          }
        }));

        blocks.push({
          text: section.trim(),
          confidence: result.confidence,
          elements,
          boundingBox: {
            x: 0,
            y: index * 100,
            width: Math.max(...lines.map(l => l.length * 8)),
            height: lines.length * 20
          }
        });
      });
    }

    return {
      text: result.extractedText,
      confidence: result.confidence,
      blocks,
      processingTime,
      imageSize: { width: 0, height: 0 }, // Unknown for API processing
      provider: 'openai',
      model: this.model,
      usage: {
        // Usage info would be available from the API response
        inputTokens: 0,
        outputTokens: 0,
        cost: 0
      },
      enhancedMetadata: {
        title: result.metadata.title,
        description: result.metadata.description,
        tags: result.metadata.tags,
        categories: result.metadata.categories,
        keyInformation: result.metadata.keyInformation
      }
    };
  }

  /**
   * Get usage statistics (placeholder for future implementation)
   */
  async getUsage(): Promise<{ requestsToday: number; costToday: number }> {
    // In a production app, you'd track this in your database
    return {
      requestsToday: 0,
      costToday: 0
    };
  }
}