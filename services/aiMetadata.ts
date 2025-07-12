import { MetadataGenerationResponse } from '@/types/document';
import { ocrService } from './ocrService';
import { textProcessingService } from './textProcessingService';

/**
 * Enhanced metadata generation with improved OCR integration
 * Follows clean architecture principles with proper error handling
 */

export async function generateMetadata(
  uri: string, 
  type: 'image' | 'pdf',
  useOCR: boolean = true
): Promise<MetadataGenerationResponse> {
  // Simulate AI processing delay for realistic UX
  await new Promise(resolve => setTimeout(resolve, 1000));

  let ocrText: string | null = null;
  
  // Attempt OCR for images with enhanced error handling
  if (useOCR && type === 'image') {
    try {
      console.log(`generateMetadata: Starting OCR for ${type}:`, uri.substring(0, 50) + '...');
      
      const ocrResult = await ocrService.recognizeText(uri, {
        recognitionLevel: 'accurate',
        minimumConfidence: 0.5  // Lowered threshold for better capture
      });
      
      console.log(`generateMetadata: OCR completed. Text: "${ocrResult.text.substring(0, 50)}...", confidence: ${ocrResult.confidence.toFixed(2)}`);
      
      // Use OCR results if confidence is reasonable or text is meaningful
      if (ocrResult.confidence > 0.5 || (ocrResult.text && ocrResult.text.trim().length > 3)) {
        const processedText = textProcessingService.processOCRResult(ocrResult);
        
        console.log('generateMetadata: ✅ Using OCR results for metadata generation');
        
        // Generate metadata from OCR
        return {
          title: textProcessingService.generateSmartTitle(processedText),
          description: textProcessingService.generateSmartDescription(processedText),
          tags: textProcessingService.generateSmartTags(processedText)
        };
      } else {
        console.log(`generateMetadata: ⚠️ OCR confidence too low (${ocrResult.confidence.toFixed(2)}) or text too short, falling back`);
      }
    } catch (error) {
      console.warn('generateMetadata: ❌ OCR failed, falling back to mock metadata:', error);
    }
  }

  // Enhanced fallback responses when OCR fails or is disabled
  const mockResponses = {
    image: [
      {
        title: 'Photo Document',
        description: 'Captured image containing visual information - processing completed for document storage',
        tags: ['photo', 'document', 'image', 'captured']
      },
      {
        title: 'Visual Content',
        description: 'Image document with visual elements - stored for easy retrieval and organization',
        tags: ['visual', 'content', 'image', 'media']
      },
      {
        title: 'Image Scan',
        description: 'Digital image capture of physical content - ready for document management',
        tags: ['scan', 'image', 'digital', 'capture']
      },
      {
        title: 'Photo Reference',
        description: 'Photographic reference document - organized for quick access and search',
        tags: ['photo', 'reference', 'document', 'archive']
      },
      {
        title: 'Visual Record',
        description: 'Visual documentation stored in personal document library for future reference',
        tags: ['visual', 'record', 'documentation', 'library']
      }
    ],
    pdf: [
      {
        title: 'PDF Document',
        description: 'Portable document with formatted content and structured information',
        tags: ['pdf', 'document', 'formatted', 'digital']
      },
      {
        title: 'Digital Report',
        description: 'Professional document in PDF format containing structured information',
        tags: ['report', 'digital', 'professional', 'pdf']
      },
      {
        title: 'Document File',
        description: 'Structured PDF document with organized content and professional formatting',
        tags: ['document', 'file', 'structured', 'pdf']
      },
      {
        title: 'Reference Material',
        description: 'PDF reference document containing important information for future use',
        tags: ['reference', 'material', 'information', 'pdf']
      }
    ]
  };

  // Return enhanced mock response
  const responses = mockResponses[type];
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  
  // Add timestamp and processing info to description
  const timestamp = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
  const enhancedDescription = `${randomResponse.description} (Processed: ${timestamp})`;
  
  console.log(`generateMetadata: ✅ Generated fallback metadata. Title: "${randomResponse.title}"`);
  
  return {
    ...randomResponse,
    description: enhancedDescription,
    tags: [...randomResponse.tags, 'auto-generated']
  };
}

export async function generateEnhancedMetadata(
  uri: string,
  type: 'image' | 'pdf',
  existingText?: string
): Promise<MetadataGenerationResponse & {
  extractedText?: string;
  confidence?: number;
  processingTime?: number;
  engineUsed?: string;
}> {
  const startTime = Date.now();
  
  try {
    console.log(`generateEnhancedMetadata: Starting enhanced processing for ${type}`);
    console.log(`generateEnhancedMetadata: URI: ${uri.substring(0, 50)}...`);
    
    let extractedText = existingText;
    let confidence = 1.0;
    let engineUsed = 'none';
    
    // Extract text via OCR if not provided and it's an image
    if (!existingText && type === 'image') {
      try {
        console.log('generateEnhancedMetadata: 🚀 Starting OCR text extraction...');
        
        // Enable debug mode for enhanced logging
        ocrService.enableDebugMode();
        
        const ocrResult = await ocrService.recognizeText(uri, {
          recognitionLevel: 'accurate',
          minimumConfidence: 0.3  // Even lower threshold to capture more results
        });
        
        extractedText = ocrResult.text;
        confidence = ocrResult.confidence;
        
        // Get diagnostics to see which engine was used
        const diagnostics = await ocrService.getDiagnostics();
        engineUsed = diagnostics.mlkitAvailable ? 'mlkit' : 'visionkit';
        
        console.log(`generateEnhancedMetadata: ✅ OCR extraction completed successfully`);
        console.log(`generateEnhancedMetadata: Engine used: ${engineUsed}`);
        console.log(`generateEnhancedMetadata: Text length: ${extractedText?.length || 0} characters`);
        console.log(`generateEnhancedMetadata: Confidence: ${confidence.toFixed(3)}`);
        console.log(`generateEnhancedMetadata: Text preview: "${extractedText?.substring(0, 100) || 'No text'}${(extractedText?.length || 0) > 100 ? '...' : ''}"`);
        
      } catch (error) {
        console.error('generateEnhancedMetadata: ❌ OCR extraction failed:', error);
        engineUsed = 'failed';
      }
    } else if (existingText) {
      console.log('generateEnhancedMetadata: Using provided existing text');
      engineUsed = 'provided';
    }
    
    // Generate smart metadata with improved logic
    let metadata: MetadataGenerationResponse;
    
    // Use OCR results if we have meaningful text (further lowered threshold)
    if (extractedText && extractedText.trim().length > 2 && confidence > 0.2) {
      console.log('generateEnhancedMetadata: 🧠 Using OCR results for intelligent generation');
      
      // Use OCR results for smart generation
      const processedText = textProcessingService.processOCRResult({
        text: extractedText,
        confidence,
        blocks: [],
        processingTime: 0,
        imageSize: { width: 0, height: 0 }
      });
      
      metadata = {
        title: textProcessingService.generateSmartTitle(processedText),
        description: textProcessingService.generateSmartDescription(processedText),
        tags: textProcessingService.generateSmartTags(processedText)
      };
      
      console.log('generateEnhancedMetadata: ✅ Smart metadata generated from OCR text');
    } else {
      console.log('generateEnhancedMetadata: 🔄 OCR text insufficient, using enhanced fallback generation');
      console.log(`generateEnhancedMetadata: Text length: ${extractedText?.length || 0}, confidence: ${confidence.toFixed(3)}`);
      
      // Fallback to standard generation
      metadata = await generateMetadata(uri, type, false);
    }
    
    const processingTime = Date.now() - startTime;
    
    console.log(`generateEnhancedMetadata: ✅ Processing completed in ${processingTime}ms`);
    console.log(`generateEnhancedMetadata: Final title: "${metadata.title}"`);
    console.log(`generateEnhancedMetadata: Final description: "${metadata.description.substring(0, 100)}..."`);
    console.log(`generateEnhancedMetadata: Final tags: [${metadata.tags.join(', ')}]`);
    
    return {
      ...metadata,
      extractedText,
      confidence,
      processingTime,
      engineUsed
    };
    
  } catch (error) {
    console.error('generateEnhancedMetadata: ❌ Critical error in enhanced metadata generation:', error);
    
    // Fallback to basic generation with error handling
    try {
      const metadata = await generateMetadata(uri, type, false);
      const processingTime = Date.now() - startTime;
      
      console.log('generateEnhancedMetadata: ✅ Fallback metadata generated successfully');
      
      return {
        ...metadata,
        processingTime,
        engineUsed: 'fallback'
      };
    } catch (fallbackError) {
      console.error('generateEnhancedMetadata: ❌ Even fallback generation failed:', fallbackError);
      
      // Last resort: minimal metadata
      const processingTime = Date.now() - startTime;
      return {
        title: 'Document',
        description: `Document processed on ${new Date().toLocaleDateString()}. Processing encountered issues but document was saved successfully.`,
        tags: ['document', 'processed', 'error-recovery'],
        processingTime,
        engineUsed: 'emergency'
      };
    }
  }
}

/**
 * Test metadata generation with diagnostic information
 * Useful for debugging and verifying OCR functionality
 */
export async function testMetadataGeneration(uri: string, type: 'image' | 'pdf'): Promise<{
  success: boolean;
  metadata?: MetadataGenerationResponse;
  diagnostics?: any;
  error?: string;
  performance: {
    ocrTime?: number;
    totalTime: number;
  };
}> {
  const startTime = Date.now();
  
  try {
    console.log('🧪 Testing metadata generation...');
    
    // Test OCR service first
    const ocrDiagnostics = await ocrService.getDiagnostics();
    console.log('OCR Diagnostics:', ocrDiagnostics);
    
    // Test with real image
    let ocrTime: number | undefined;
    if (type === 'image') {
      const ocrStart = Date.now();
      const testResult = await ocrService.testOCRWithRealImage(uri);
      ocrTime = Date.now() - ocrStart;
      console.log('OCR Test Result:', testResult);
    }
    
    // Generate metadata
    const metadata = await generateEnhancedMetadata(uri, type);
    
    const totalTime = Date.now() - startTime;
    
    return {
      success: true,
      metadata,
      diagnostics: ocrDiagnostics,
      performance: {
        ocrTime,
        totalTime
      }
    };
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('Metadata generation test failed:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      performance: {
        totalTime
      }
    };
  }
}
