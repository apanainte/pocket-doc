/**
 * Enhanced AI Metadata Service - Cloud-First Implementation
 * 
 * This service leverages the new cloud OCR architecture to generate
 * superior metadata with precise tagging and descriptions. It integrates
 * seamlessly with the enhanced OCR service for optimal results.
 */

import { MetadataGenerationResponse } from '@/types/document';
import { enhancedOCRService, EnhancedOCRResult } from './ocrService.v2';
import { textProcessingService } from './textProcessingService';

export interface EnhancedMetadataResponse extends MetadataGenerationResponse {
  // Core metadata
  title: string;
  description: string;
  tags: string[];
  
  // Enhanced metadata from cloud OCR
  categories?: string[];
  keyInformation?: string[];
  documentType?: string;
  language?: string;
  
  // Processing information
  source: 'cloud' | 'local' | 'hybrid';
  confidence: number;
  processingTime: number;
  qualityScore?: number;
  
  // OCR details
  extractedText?: string;
  ocrProvider?: string;
  ocrModel?: string;
  
  // Recommendations and insights
  recommendations?: string[];
  insights?: {
    complexity: 'simple' | 'moderate' | 'complex';
    contentType: string;
    suggestedActions: string[];
  };
}

/**
 * Enhanced metadata generation with cloud OCR integration
 */
export async function generateEnhancedMetadata(
  uri: string,
  type: 'image' | 'pdf',
  options: {
    useCloudOCR?: boolean;
    enhancedAnalysis?: boolean;
    confidenceThreshold?: number;
  } = {}
): Promise<EnhancedMetadataResponse> {
  
  const startTime = Date.now();
  console.log('🚀 EnhancedMetadata: Starting cloud-first metadata generation...');
  console.log(`📁 Document type: ${type}, URI: ${uri.substring(0, 50)}...`);

  const {
    useCloudOCR = true,
    enhancedAnalysis = true,
    confidenceThreshold = 0.5
  } = options;

  try {
    let ocrResult: EnhancedOCRResult | null = null;
    let source: 'cloud' | 'local' | 'hybrid' = 'cloud';

    // Extract text using enhanced OCR for images
    if (type === 'image') {
      console.log('🔍 EnhancedMetadata: Extracting text using enhanced OCR...');
      
      try {
        ocrResult = await enhancedOCRService.recognizeText(uri, {
          recognitionLevel: 'accurate',
          minimumConfidence: confidenceThreshold
        });
        
        source = ocrResult.source;
        
        console.log(`✅ EnhancedMetadata: OCR completed via ${ocrResult.source} provider`);
        console.log(`📊 Text extracted: ${ocrResult.text.length} characters`);
        console.log(`🎯 Confidence: ${ocrResult.confidence.toFixed(3)}`);
        console.log(`⭐ Quality score: ${ocrResult.qualityScore?.toFixed(3) || 'N/A'}`);
        
        if (ocrResult.enhancedMetadata) {
          console.log('🧠 Enhanced metadata available from cloud provider');
        }
        
      } catch (error) {
        console.warn('⚠️ EnhancedMetadata: OCR extraction failed:', error);
        // Continue with fallback generation
      }
    }

    // Generate metadata based on available data
    let metadata: EnhancedMetadataResponse;

    if (ocrResult && ocrResult.enhancedMetadata && enhancedAnalysis && source === 'cloud') {
      // Use cloud-generated enhanced metadata
      console.log('☁️ EnhancedMetadata: Using cloud-generated enhanced metadata');
      
      metadata = await generateCloudEnhancedMetadata(ocrResult, type);
      
    } else if (ocrResult && ocrResult.text.trim().length > 10) {
      // Generate metadata from extracted text
      console.log('🔄 EnhancedMetadata: Generating metadata from extracted text');
      
      metadata = await generateTextBasedMetadata(ocrResult, type);
      
    } else {
      // Fallback to intelligent mock generation
      console.log('📝 EnhancedMetadata: Using enhanced fallback generation');
      
      metadata = await generateIntelligentFallback(uri, type);
    }

    const totalProcessingTime = Date.now() - startTime;
    
    // Finalize metadata with processing information
    const finalMetadata: EnhancedMetadataResponse = {
      ...metadata,
      source,
      processingTime: totalProcessingTime,
      extractedText: ocrResult?.text,
      ocrProvider: ocrResult?.provider,
      ocrModel: ocrResult?.model,
      qualityScore: ocrResult?.qualityScore,
      recommendations: [
        ...(metadata.recommendations || []),
        ...(ocrResult?.recommendations || [])
      ].filter((item, index, arr) => arr.indexOf(item) === index) // Remove duplicates
    };

    console.log(`✅ EnhancedMetadata: Generation completed in ${totalProcessingTime}ms`);
    console.log(`📝 Final title: "${finalMetadata.title}"`);
    console.log(`🏷️ Tags generated: ${finalMetadata.tags.length}`);
    console.log(`📊 Source: ${finalMetadata.source}, Confidence: ${finalMetadata.confidence.toFixed(3)}`);

    return finalMetadata;

  } catch (error) {
    console.error('❌ EnhancedMetadata: Critical error in metadata generation:', error);
    
    // Emergency fallback
    const processingTime = Date.now() - startTime;
    return generateEmergencyFallback(uri, type, processingTime, error);
  }
}

/**
 * Generate metadata using cloud-provided enhanced metadata
 */
async function generateCloudEnhancedMetadata(
  ocrResult: EnhancedOCRResult,
  type: 'image' | 'pdf'
): Promise<EnhancedMetadataResponse> {
  
  const enhancedMeta = ocrResult.enhancedMetadata!;
  
  // Calculate confidence based on OCR confidence and metadata richness
  let confidence = ocrResult.confidence;
  if (enhancedMeta.tags.length > 3) confidence += 0.1;
  if (enhancedMeta.keyInformation.length > 0) confidence += 0.1;
  if (enhancedMeta.categories.length > 0) confidence += 0.05;
  
  // Generate insights
  const insights = generateContentInsights(ocrResult.text, enhancedMeta);
  
  return {
    title: enhancedMeta.title,
    description: enhancedMeta.description,
    tags: enhancedMeta.tags,
    categories: enhancedMeta.categories,
    keyInformation: enhancedMeta.keyInformation,
    documentType: enhancedMeta.categories[0] || type,
    language: 'en', // Could be detected by cloud provider
    source: 'cloud',
    confidence: Math.min(confidence, 1.0),
    processingTime: 0, // Will be set by caller
    insights,
    recommendations: generateRecommendations(ocrResult, enhancedMeta)
  };
}

/**
 * Generate metadata from extracted text using local processing
 */
async function generateTextBasedMetadata(
  ocrResult: EnhancedOCRResult,
  type: 'image' | 'pdf'
): Promise<EnhancedMetadataResponse> {
  
  console.log('🔧 Processing extracted text for metadata generation...');
  
  // Use existing text processing service
  const processedText = textProcessingService.processOCRResult({
    text: ocrResult.text,
    confidence: ocrResult.confidence,
    blocks: ocrResult.blocks,
    processingTime: ocrResult.processingTime,
    imageSize: ocrResult.imageSize
  });

  const title = textProcessingService.generateSmartTitle(processedText);
  const description = textProcessingService.generateSmartDescription(processedText);
  const tags = textProcessingService.generateSmartTags(processedText);
  
  // Enhanced analysis for additional metadata
  const categories = detectDocumentCategories(ocrResult.text);
  const keyInformation = extractKeyInformation(ocrResult.text);
  const documentType = detectDocumentType(ocrResult.text);
  
  const insights = generateContentInsights(ocrResult.text, {
    title,
    description,
    tags,
    categories,
    keyInformation
  });

  return {
    title,
    description,
    tags,
    categories,
    keyInformation,
    documentType,
    language: 'en',
    source: ocrResult.source,
    confidence: ocrResult.confidence,
    processingTime: 0,
    insights,
    recommendations: [
      'Generated using local text processing',
      ...(ocrResult.source === 'local' ? ['Consider using cloud OCR for enhanced accuracy'] : [])
    ]
  };
}

/**
 * Generate intelligent fallback metadata when OCR fails
 */
async function generateIntelligentFallback(
  uri: string,
  type: 'image' | 'pdf'
): Promise<EnhancedMetadataResponse> {
  
  const timestamp = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  // Analyze file name for hints
  const fileName = uri.split('/').pop() || '';
  const nameHints = analyzeFileName(fileName);
  
  const fallbackData = {
    image: {
      title: nameHints.suggestedTitle || 'Document Image',
      description: `Visual document captured on ${timestamp}. ${nameHints.description || 'Contains visual information for reference and storage.'}`,
      tags: ['image', 'document', 'visual', ...nameHints.tags],
      categories: ['image', 'document'],
      documentType: 'image'
    },
    pdf: {
      title: nameHints.suggestedTitle || 'PDF Document',
      description: `Digital document in PDF format from ${timestamp}. ${nameHints.description || 'Contains structured information and content.'}`,
      tags: ['pdf', 'document', 'digital', ...nameHints.tags],
      categories: ['pdf', 'document'],
      documentType: 'pdf'
    }
  };

  const data = fallbackData[type];
  
  return {
    ...data,
    keyInformation: nameHints.keyInfo,
    language: 'en',
    source: 'hybrid',
    confidence: 0.6, // Moderate confidence for fallback
    processingTime: 0,
    insights: {
      complexity: 'simple',
      contentType: 'fallback-generated',
      suggestedActions: [
        'Try retaking the photo with better lighting',
        'Ensure text is clearly visible and not blurred',
        'Check network connection for cloud OCR access'
      ]
    },
    recommendations: [
      'Metadata generated using fallback method',
      'For better results, ensure text is clearly visible',
      'Consider configuring cloud OCR for enhanced accuracy'
    ]
  };
}

/**
 * Emergency fallback when everything fails
 */
function generateEmergencyFallback(
  uri: string,
  type: 'image' | 'pdf',
  processingTime: number,
  error: any
): EnhancedMetadataResponse {
  
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  
  return {
    title: `${type === 'image' ? 'Image' : 'PDF'} Document`,
    description: `Document processed with errors on ${new Date().toLocaleDateString()}. The file was saved but metadata generation encountered issues.`,
    tags: [type, 'document', 'error-recovery', 'needs-review'],
    categories: [type, 'error'],
    keyInformation: [`Processing error: ${errorMessage}`],
    documentType: type,
    language: 'en',
    source: 'hybrid',
    confidence: 0.3,
    processingTime,
    insights: {
      complexity: 'simple',
      contentType: 'error-recovery',
      suggestedActions: [
        'Review document manually',
        'Try processing again',
        'Check system configuration'
      ]
    },
    recommendations: [
      'Emergency metadata generated due to processing errors',
      'Manual review recommended',
      'Consider re-uploading the document'
    ]
  };
}

/**
 * Helper functions for enhanced analysis
 */

function detectDocumentCategories(text: string): string[] {
  const categories: string[] = [];
  const lowerText = text.toLowerCase();
  
  // Financial documents
  if (lowerText.includes('invoice') || lowerText.includes('receipt') || lowerText.includes('payment')) {
    categories.push('financial');
  }
  
  // Legal documents
  if (lowerText.includes('contract') || lowerText.includes('agreement') || lowerText.includes('legal')) {
    categories.push('legal');
  }
  
  // Medical documents
  if (lowerText.includes('medical') || lowerText.includes('doctor') || lowerText.includes('patient')) {
    categories.push('medical');
  }
  
  // Business documents
  if (lowerText.includes('business') || lowerText.includes('company') || lowerText.includes('corporate')) {
    categories.push('business');
  }
  
  // Personal documents
  if (lowerText.includes('personal') || lowerText.includes('private') || lowerText.includes('individual')) {
    categories.push('personal');
  }
  
  return categories.length > 0 ? categories : ['general'];
}

function extractKeyInformation(text: string): string[] {
  const keyInfo: string[] = [];
  
  // Extract dates
  const dateRegex = /\\b\\d{1,2}[\/\\-]\\d{1,2}[\/\\-]\\d{2,4}\\b/g;
  const dates = text.match(dateRegex);
  if (dates) {
    keyInfo.push(...dates.map(date => `Date: ${date}`));
  }
  
  // Extract amounts
  const amountRegex = /\\$[\\d,]+\\.?\\d*/g;
  const amounts = text.match(amountRegex);
  if (amounts) {
    keyInfo.push(...amounts.map(amount => `Amount: ${amount}`));
  }
  
  // Extract email addresses
  const emailRegex = /\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b/g;
  const emails = text.match(emailRegex);
  if (emails) {
    keyInfo.push(...emails.map(email => `Email: ${email}`));
  }
  
  // Extract phone numbers
  const phoneRegex = /\\b\\d{3}[\\-\\.]?\\d{3}[\\-\\.]?\\d{4}\\b/g;
  const phones = text.match(phoneRegex);
  if (phones) {
    keyInfo.push(...phones.map(phone => `Phone: ${phone}`));
  }
  
  return keyInfo.slice(0, 5); // Limit to 5 key pieces of information
}

function detectDocumentType(text: string): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('invoice')) return 'invoice';
  if (lowerText.includes('receipt')) return 'receipt';
  if (lowerText.includes('contract')) return 'contract';
  if (lowerText.includes('agreement')) return 'agreement';
  if (lowerText.includes('report')) return 'report';
  if (lowerText.includes('letter')) return 'letter';
  if (lowerText.includes('memo')) return 'memo';
  if (lowerText.includes('form')) return 'form';
  if (lowerText.includes('certificate')) return 'certificate';
  if (lowerText.includes('license')) return 'license';
  
  return 'document';
}

function analyzeFileName(fileName: string): {
  suggestedTitle?: string;
  description?: string;
  tags: string[];
  keyInfo: string[];
} {
  const cleanName = fileName.replace(/\\.[^/.]+$/, ''); // Remove extension
  const words = cleanName.split(/[_\\-\\s]+/).filter(Boolean);
  
  const tags: string[] = [];
  const keyInfo: string[] = [];
  
  // Extract meaningful words as tags
  words.forEach(word => {
    if (word.length > 2 && !/^\\d+$/.test(word)) {
      tags.push(word.toLowerCase());
    }
  });
  
  // Look for dates in filename
  const datePattern = /\\d{4}[\\-_]\\d{2}[\\-_]\\d{2}/;
  const dateMatch = fileName.match(datePattern);
  if (dateMatch) {
    keyInfo.push(`File date: ${dateMatch[0]}`);
  }
  
  const suggestedTitle = words
    .filter(word => word.length > 2)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ') || undefined;
  
  return {
    suggestedTitle,
    description: suggestedTitle ? `Document based on filename: ${cleanName}` : undefined,
    tags: tags.slice(0, 3),
    keyInfo
  };
}

function generateContentInsights(text: string, metadata: any): {
  complexity: 'simple' | 'moderate' | 'complex';
  contentType: string;
  suggestedActions: string[];
} {
  const textLength = text.length;
  const wordCount = text.split(/\\s+/).length;
  const lineCount = text.split('\\n').length;
  
  // Determine complexity
  let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
  if (textLength > 500 && wordCount > 100) complexity = 'moderate';
  if (textLength > 1500 && wordCount > 300) complexity = 'complex';
  
  // Determine content type
  let contentType = 'text';
  if (metadata.categories?.includes('financial')) contentType = 'financial';
  if (metadata.categories?.includes('legal')) contentType = 'legal';
  if (metadata.categories?.includes('medical')) contentType = 'medical';
  
  // Generate suggested actions
  const suggestedActions: string[] = [];
  
  if (complexity === 'complex') {
    suggestedActions.push('Consider creating a summary');
    suggestedActions.push('Review key information section');
  }
  
  if (metadata.keyInformation?.length > 0) {
    suggestedActions.push('Review extracted key information');
  }
  
  if (contentType === 'financial') {
    suggestedActions.push('Verify financial information');
    suggestedActions.push('Consider categorizing for tax purposes');
  }
  
  return { complexity, contentType, suggestedActions };
}

function generateRecommendations(ocrResult: EnhancedOCRResult, enhancedMeta: any): string[] {
  const recommendations: string[] = [];
  
  if (ocrResult.confidence < 0.8) {
    recommendations.push('OCR confidence could be improved with better image quality');
  }
  
  if (enhancedMeta.tags.length > 5) {
    recommendations.push('Document has rich tagging for easy organization');
  }
  
  if (enhancedMeta.keyInformation.length > 0) {
    recommendations.push('Key information extracted for quick reference');
  }
  
  if (ocrResult.source === 'cloud') {
    recommendations.push('Enhanced analysis completed using cloud AI');
  }
  
  return recommendations;
}

/**
 * Test the enhanced metadata service
 */
export async function testEnhancedMetadataGeneration(
  uri: string,
  type: 'image' | 'pdf'
): Promise<{
  success: boolean;
  metadata?: EnhancedMetadataResponse;
  error?: string;
  performance: {
    ocrTime?: number;
    metadataTime: number;
    totalTime: number;
  };
}> {
  const startTime = Date.now();
  
  try {
    console.log('🧪 Testing enhanced metadata generation...');
    
    const metadata = await generateEnhancedMetadata(uri, type, {
      useCloudOCR: true,
      enhancedAnalysis: true,
      confidenceThreshold: 0.3
    });
    
    const totalTime = Date.now() - startTime;
    
    return {
      success: true,
      metadata,
      performance: {
        metadataTime: metadata.processingTime,
        totalTime
      }
    };
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('Enhanced metadata generation test failed:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      performance: {
        metadataTime: 0,
        totalTime
      }
    };
  }
}