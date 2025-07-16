export interface Document {
  id: string;
  title: string;
  description: string;
  tags: string[];
  type: 'image' | 'pdf';
  uri: string;
  thumbnail?: string;
  createdAt: Date;
  updatedAt: Date;
  fileSize?: number;
  // OCR-extracted content
  extractedText?: string;
  ocrData?: OCRResult;
}

export interface MetadataGenerationResponse {
  description: string;
  tags: string[];
  title: string;
}

// OCR Types
export interface OCRTextElement {
  text: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface OCRTextBlock {
  text: string;
  confidence: number;
  elements: OCRTextElement[];
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface OCRResult {
  text: string;
  confidence: number;
  blocks: OCRTextBlock[];
  processingTime: number;
  imageSize: {
    width: number;
    height: number;
  };
}

export interface OCRProcessingOptions {
  language?: string;
  recognitionLevel?: 'fast' | 'accurate';
  minimumConfidence?: number;
  imagePreprocessing?: {
    autoRotate?: boolean;
    enhanceContrast?: boolean;
    denoiseImage?: boolean;
  };
}

export class OCRError extends Error {
  public readonly code: 'PERMISSION_DENIED' | 'PROCESSING_FAILED' | 'UNSUPPORTED_FORMAT' | 'DEVICE_NOT_SUPPORTED' | 'PROVIDER_ERROR' | 'NETWORK_ERROR' | 'INVALID_API_KEY';
  public readonly originalError?: Error;

  constructor(params: {
    code: 'PERMISSION_DENIED' | 'PROCESSING_FAILED' | 'UNSUPPORTED_FORMAT' | 'DEVICE_NOT_SUPPORTED' | 'PROVIDER_ERROR' | 'NETWORK_ERROR' | 'INVALID_API_KEY';
    message: string;
    originalError?: Error;
  }) {
    super(params.message);
    this.name = 'OCRError';
    this.code = params.code;
    this.originalError = params.originalError;
  }
}

// Cloud OCR Provider Types
export type OCRProviderType = 'openai' | 'google-cloud' | 'azure' | 'aws' | 'deepseek' | 'local';

export interface CloudOCRResult extends OCRResult {
  provider: OCRProviderType;
  model?: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    cost?: number;
  };
  enhancedMetadata?: {
    title: string;
    description: string;
    tags: string[];
    categories: string[];
    keyInformation: string[];
  };
}

export interface CloudOCRConfig {
  provider: OCRProviderType;
  apiKey: string;
  model?: string;
  endpoint?: string;
  timeout?: number;
  maxRetries?: number;
  enableEnhancedMetadata?: boolean;
}

export interface OCRProviderInterface {
  readonly name: OCRProviderType;
  readonly supportedFormats: string[];
  readonly maxFileSize: number;
  
  initialize(config: CloudOCRConfig): Promise<void>;
  isConfigured(): boolean;
  processImage(imageUri: string, options?: OCRProcessingOptions): Promise<CloudOCRResult>;
  testConnection(): Promise<boolean>;
  getUsage?(): Promise<{ requestsToday: number; costToday: number }>;
}