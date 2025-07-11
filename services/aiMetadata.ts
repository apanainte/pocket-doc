import { MetadataGenerationResponse } from '@/types/document';
import { ocrService } from './ocrService';
import { textProcessingService } from './textProcessingService';

export async function generateMetadata(
  uri: string, 
  type: 'image' | 'pdf',
  useOCR: boolean = true
): Promise<MetadataGenerationResponse> {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  let ocrText: string | null = null;
  
  // Attempt OCR for images
  if (useOCR && type === 'image') {
    try {
      const ocrResult = await ocrService.recognizeText(uri, {
        recognitionLevel: 'accurate',
        minimumConfidence: 0.7
      });
      
      if (ocrResult.confidence > 0.7) {
        const processedText = textProcessingService.processOCRResult(ocrResult);
        
        // Generate metadata from OCR
        return {
          title: textProcessingService.generateSmartTitle(processedText),
          description: textProcessingService.generateSmartDescription(processedText),
          tags: textProcessingService.generateSmartTags(processedText)
        };
      }
    } catch (error) {
      console.warn('OCR failed, falling back to mock metadata:', error);
    }
  }

  // Fallback to mock responses when OCR fails or is disabled
  const mockResponses = {
    image: [
      {
        title: 'Document Scan',
        description: 'Scanned document captured with camera - content analysis in progress',
        tags: ['document', 'scan', 'image', 'unprocessed']
      },
      {
        title: 'Business Card',
        description: 'Contact information card with potential business details',
        tags: ['business-card', 'contact', 'networking', 'professional']
      },
      {
        title: 'Receipt',
        description: 'Purchase receipt or transaction record',
        tags: ['receipt', 'financial', 'transaction', 'expense']
      },
      {
        title: 'Handwritten Note',
        description: 'Handwritten document or note',
        tags: ['handwritten', 'note', 'personal', 'memo']
      },
      {
        title: 'Printed Document',
        description: 'Typed or printed text document with multiple paragraphs',
        tags: ['document', 'printed', 'text', 'formal']
      }
    ],
    pdf: [
      {
        title: 'PDF Document',
        description: 'Portable document with formatted content and potential embedded text',
        tags: ['pdf', 'document', 'formatted', 'digital']
      },
      {
        title: 'Report',
        description: 'Professional report or analysis document in PDF format',
        tags: ['report', 'analysis', 'business', 'professional', 'pdf']
      },
      {
        title: 'Contract',
        description: 'Legal document or contract with terms and conditions',
        tags: ['contract', 'legal', 'agreement', 'formal', 'pdf']
      },
      {
        title: 'Manual',
        description: 'Technical manual or instructional document',
        tags: ['manual', 'instructions', 'technical', 'guide', 'pdf']
      }
    ]
  };

  // Return enhanced mock response
  const responses = mockResponses[type];
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  
  // Add timestamp and processing info to description
  const enhancedDescription = `${randomResponse.description}. Processed on ${new Date().toLocaleDateString()}.`;
  
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
}> {
  const startTime = Date.now();
  
  try {
    let extractedText = existingText;
    let confidence = 1.0;
    
    // Extract text via OCR if not provided
    if (!existingText && type === 'image') {
      try {
        const ocrResult = await ocrService.recognizeText(uri, {
          recognitionLevel: 'accurate',
          minimumConfidence: 0.6
        });
        extractedText = ocrResult.text;
        confidence = ocrResult.confidence;
      } catch (error) {
        console.warn('OCR extraction failed:', error);
      }
    }
    
    // Generate smart metadata
    let metadata: MetadataGenerationResponse;
    
    if (extractedText && extractedText.trim().length > 10) {
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
    } else {
      // Fallback to standard generation
      metadata = await generateMetadata(uri, type, false);
    }
    
    const processingTime = Date.now() - startTime;
    
    return {
      ...metadata,
      extractedText,
      confidence,
      processingTime
    };
    
  } catch (error) {
    console.error('Enhanced metadata generation failed:', error);
    
    // Fallback to basic generation
    const metadata = await generateMetadata(uri, type, false);
    const processingTime = Date.now() - startTime;
    
    return {
      ...metadata,
      processingTime
    };
  }
}