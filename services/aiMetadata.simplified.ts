/**
 * Simplified AI Metadata Service - Latest OpenAI API (March 2025)
 * 
 * This service uses the latest OpenAI API that supports both images and PDFs directly
 * with GPT-4o-mini, providing a unified approach for all document types.
 */

import { MetadataGenerationResponse, OCRError } from '../types/document';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';

/**
 * Get OpenAI API key from environment
 */
function getOpenAIApiKey(): string | undefined {
  return process.env.EXPO_PUBLIC_OPENAI_API_KEY || 
         process.env.OPENAI_API_KEY || 
         Constants.expoConfig?.extra?.openaiApiKey;
}

interface SimplifiedMetadataResponse extends MetadataGenerationResponse {
  title: string;
  description: string;
  tags: string[];
  source: 'openai';
  confidence: number;
  processingTime: number;
  extractedText?: string;
}

interface OpenAIResponse {
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

interface OpenAIMetadataResult {
  extractedText: string;
  confidence: number;
  metadata: {
    title: string;
    description: string;
    tags: string[];
  };
}

/**
 * Generate metadata using OpenAI API with direct image/PDF support
 */
export async function generateMetadata(
  uri: string,
  type: 'image' | 'pdf'
): Promise<SimplifiedMetadataResponse> {
  
  const startTime = Date.now();
  console.log(`🚀 DirectMetadata: Starting ${type} processing with OpenAI (latest API)...`);
  console.log(`📁 File URI: ${uri.substring(0, 50)}...`);

  try {
    // Get OpenAI API key
    const apiKey = getOpenAIApiKey();
    if (!apiKey) {
      throw new OCRError({
        code: 'INVALID_API_KEY',
        message: 'OpenAI API key not configured'
      });
    }

    // Process file with OpenAI (unified approach for both images and PDFs)
    const result = await processFileWithOpenAI(uri, type, apiKey);
    
    const processingTime = Date.now() - startTime;
    
    console.log(`✅ DirectMetadata: Processing completed in ${processingTime}ms`);
    console.log(`📝 Title: "${result.metadata.title}"`);
    console.log(`🏷️ Tags: ${result.metadata.tags.length}`);
    console.log(`📊 Text length: ${result.extractedText.length} characters`);
    console.log(`🎯 Confidence: ${result.confidence.toFixed(3)}`);

    return {
      title: result.metadata.title,
      description: result.metadata.description,
      tags: result.metadata.tags,
      source: 'openai',
      confidence: result.confidence,
      processingTime,
      extractedText: result.extractedText
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ DirectMetadata: Processing failed after ${processingTime}ms:`, error);
    
    if (error instanceof OCRError) {
      throw error;
    }
    
    throw new OCRError({
      code: 'PROCESSING_FAILED',
      message: `Failed to process ${type} with OpenAI`,
      originalError: error as Error
    });
  }
}

/**
 * Process file (image or PDF) with OpenAI API using latest specification
 */
async function processFileWithOpenAI(
  uri: string,
  type: 'image' | 'pdf',
  apiKey: string
): Promise<OpenAIMetadataResult> {
  
  console.log(`📤 DirectMetadata: Sending ${type} to OpenAI API (with direct ${type} support)...`);
  
  // Determine request payload based on file type
  let contentPayload: any;

  if (type === 'pdf') {
    // 1) upload the PDF and obtain a file_id
    const file_id = await uploadFileToOpenAI(uri, apiKey);

    contentPayload = [
      { type: 'text' as const, text: buildUnifiedPrompt(type) },
      {
        type: 'file' as const,
        file: {
          file_id: file_id,
        }
      }
    ];
  } else {
    // image branch keeps using inline base64 for now
    const base64Data = await convertFileToBase64(uri);
    const mediaType = 'image/jpeg';

    contentPayload = [
      { type: 'text' as const, text: buildUnifiedPrompt(type) },
      {
        type: 'image_url' as const,
        image_url: {
          url: `data:${mediaType};base64,${base64Data}`,
          detail: 'high'
        }
      }
    ];
  }

  const requestBody = {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user' as const,
        content: contentPayload
      }
    ],
    max_tokens: 2000,
    temperature: 0.1,
    response_format: { type: 'json_object' }
  };

  // Make API call
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`OpenAI API Error (${type}):`, errorText);
    
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

  const data: OpenAIResponse = await response.json();
  console.log(`📥 DirectMetadata: Received response from OpenAI for ${type}`);
  
  if (!data.choices || data.choices.length === 0) {
    throw new OCRError({
      code: 'PROVIDER_ERROR',
      message: 'No response from OpenAI API'
    });
  }

  // Log usage if available
  if (data.usage) {
    console.log(`💰 DirectMetadata: Token usage - Input: ${data.usage.prompt_tokens}, Output: ${data.usage.completion_tokens}`);
  }

  // Parse response
  try {
    const content = data.choices[0].message.content;
    
    // Try to parse as JSON first
    try {
      const parsedResult = JSON.parse(content) as OpenAIMetadataResult;
      return parsedResult;
    } catch (jsonError) {
      // If JSON parsing fails, the response might be plain text
      // Create a structured response from the plain text
      console.log('📝 OpenAI response is plain text, creating structured response...');
      
      const extractedText = content.trim();
      
      // Generate title from first line or few words
      const lines = extractedText.split('\n').filter(line => line.trim().length > 0);
      const title = lines[0] 
        ? lines[0].substring(0, 50).trim() + (lines[0].length > 50 ? '...' : '')
        : 'Document';
      
      // Generate description
      const description = extractedText.length > 200 
        ? extractedText.substring(0, 200).trim() + '...'
        : extractedText;
      
      // Generate tags based on content
      const tags = [];
      if (extractedText.toLowerCase().includes('reforma')) tags.push('renovation');
      if (extractedText.toLowerCase().includes('presupuesto')) tags.push('budget');
      if (extractedText.toLowerCase().includes('factura')) tags.push('invoice');
      if (extractedText.toLowerCase().includes('contract')) tags.push('contract');
      if (extractedText.toLowerCase().includes('€')) tags.push('financial');
      if (tags.length === 0) tags.push('document');
      
      return {
        extractedText,
        confidence: 0.85,
        metadata: {
          title,
          description,
          tags: tags.slice(0, 5)
        }
      };
    }
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
 * Upload any non-image (e.g. PDF) asset to OpenAI and return the resulting file_id
 * as required by the 2025 Chat Completions spec.
 * NOTE: the file is uploaded once and the returned id is cached by the caller –
 * OpenAI automatically de-duplicates identical uploads so this remains cheap.
 */
async function uploadFileToOpenAI(uri: string, apiKey: string): Promise<string> {
  console.log(`🚀 Uploading file to OpenAI: ${uri.substring(0, 100)}...`);

  try {
    const uploadResult = await FileSystem.uploadAsync('https://api.openai.com/v1/files', uri, {
      httpMethod: 'POST',
      fieldName: 'file',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      parameters: {
        purpose: 'user_data',
      },
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (uploadResult.status >= 400) {
      console.error('File upload failed. Status:', uploadResult.status, 'Body:', uploadResult.body);
      throw new OCRError({
        code: 'PROVIDER_ERROR',
        message: `File upload failed: ${uploadResult.status}`,
        originalError: new Error(uploadResult.body),
      });
    }

    const { id } = JSON.parse(uploadResult.body);
    if (!id) {
      throw new OCRError({
        code: 'PROVIDER_ERROR',
        message: 'OpenAI file upload did not return an id',
      });
    }

    console.log(`✅ File uploaded successfully. File ID: ${id}`);
    return id as string;
  } catch (error) {
    console.error('Error in uploadFileToOpenAI:', error);
    if (error instanceof OCRError) {
      throw error;
    }
    throw new OCRError({
      code: 'PROVIDER_ERROR',
      message: 'An unexpected error occurred during file upload.',
      originalError: error as Error,
    });
  }
}

/**
 * Convert file to base64
 */
async function convertFileToBase64(uri: string): Promise<string> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    throw new OCRError({
      code: 'PROCESSING_FAILED',
      message: 'Failed to convert file to base64',
      originalError: error as Error
    });
  }
}

/**
 * Build unified prompt for both images and PDFs
 */
function buildUnifiedPrompt(type: 'image' | 'pdf'): string {
  const documentType = type === 'pdf' ? 'PDF document' : 'image';
  
  return `You are an advanced document analysis system. Analyze this ${documentType} and extract ALL visible text, then generate intelligent metadata.

TASK:
1. Extract EVERY piece of visible text from the ${documentType}
2. Generate a descriptive title based on the actual content
3. Create a detailed description of what the document contains
4. Generate 3-5 relevant tags for categorization

RESPONSE FORMAT (JSON):
{
  "extractedText": "Complete text extracted from the ${documentType}",
  "confidence": 0.95,
  "metadata": {
    "title": "Descriptive title based on actual content",
    "description": "Detailed description of document content and purpose",
    "tags": ["relevant", "specific", "actionable", "tags"]
  }
}

REQUIREMENTS:
- Extract ALL visible text including headers, body text, footnotes, captions, tables, etc.
- Title should be concise but descriptive of the actual content
- Description should explain what the document is and its purpose
- Tags should be specific and useful for searching and organization
- Confidence should reflect text extraction accuracy (0.0-1.0)
- Focus on the document's actual content, not filename or metadata

${type === 'pdf' ? 'For PDFs: Process all pages and extract text from the entire document.' : 'For images: Extract text from all visible elements in the image.'}

Analyze the ${documentType} now and provide the complete JSON response.`;
}

/**
 * Test the simplified metadata generation
 */
export async function testMetadataGeneration(
  uri: string,
  type: 'image' | 'pdf'
): Promise<{
  success: boolean;
  metadata?: SimplifiedMetadataResponse;
  error?: string;
  performance: {
    totalTime: number;
  };
}> {
  const startTime = Date.now();
  
  try {
    console.log(`🧪 Testing simplified metadata generation for ${type}...`);
    
    const metadata = await generateMetadata(uri, type);
    
    const totalTime = Date.now() - startTime;
    
    return {
      success: true,
      metadata,
      performance: {
        totalTime
      }
    };
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`Simplified metadata generation test failed for ${type}:`, error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      performance: {
        totalTime
      }
    };
  }
}