export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
}

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
  // Category association
  categoryId?: string;
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
  public readonly code: 'PERMISSION_DENIED' | 'PROCESSING_FAILED' | 'UNSUPPORTED_FORMAT' | 'DEVICE_NOT_SUPPORTED';
  public readonly originalError?: Error;

  constructor(params: {
    code: 'PERMISSION_DENIED' | 'PROCESSING_FAILED' | 'UNSUPPORTED_FORMAT' | 'DEVICE_NOT_SUPPORTED';
    message: string;
    originalError?: Error;
  }) {
    super(params.message);
    this.name = 'OCRError';
    this.code = params.code;
    this.originalError = params.originalError;
  }
}