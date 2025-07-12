import { OCRResult, OCRTextBlock } from '@/types/document';

interface ProcessedText {
  cleanedText: string;
  structuredData: {
    emails: string[];
    phoneNumbers: string[];
    dates: string[];
    urls: string[];
    addresses: string[];
  };
  metadata: {
    wordCount: number;
    language: string;
    confidence: number;
    textType: 'document' | 'receipt' | 'business_card' | 'handwritten' | 'other';
  };
}

export class TextProcessingService {
  private static instance: TextProcessingService;

  static getInstance(): TextProcessingService {
    if (!TextProcessingService.instance) {
      TextProcessingService.instance = new TextProcessingService();
    }
    return TextProcessingService.instance;
  }

  processOCRResult(ocrResult: OCRResult): ProcessedText {
    const cleanedText = this.cleanText(ocrResult.text);
    const structuredData = this.extractStructuredData(cleanedText);
    const metadata = this.generateMetadata(ocrResult, cleanedText);

    return {
      cleanedText,
      structuredData,
      metadata
    };
  }

  private cleanText(rawText: string): string {
    return rawText
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Fix common OCR errors
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([.!?])\s*([A-Z])/g, '$1 $2')
      // Remove scanning artifacts
      .replace(/[^\w\s.,!?;:()[\]{}"'-]/g, '')
      // Fix common character substitutions
      .replace(/0/g, 'O') // in text context
      .replace(/1/g, 'I') // in text context
      .replace(/5/g, 'S') // in text context
      .trim();
  }

  private extractStructuredData(text: string): ProcessedText['structuredData'] {
    return {
      emails: this.extractEmails(text),
      phoneNumbers: this.extractPhoneNumbers(text),
      dates: this.extractDates(text),
      urls: this.extractUrls(text),
      addresses: this.extractAddresses(text)
    };
  }

  private extractEmails(text: string): string[] {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    return text.match(emailRegex) || [];
  }

  private extractPhoneNumbers(text: string): string[] {
    const phoneRegex = /(\+?1-?)?(\(?[0-9]{3}\)?[-.\s]?)?[0-9]{3}[-.\s]?[0-9]{4}/g;
    return text.match(phoneRegex) || [];
  }

  private extractDates(text: string): string[] {
    const dateRegexes = [
      /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, // MM/DD/YYYY or DD/MM/YYYY
      /\b\d{1,2}-\d{1,2}-\d{2,4}\b/g,   // MM-DD-YYYY or DD-MM-YYYY
      /\b\w+\s+\d{1,2},?\s+\d{4}\b/g,   // Month DD, YYYY
      /\b\d{1,2}\s+\w+\s+\d{4}\b/g      // DD Month YYYY
    ];

    const dates: string[] = [];
    dateRegexes.forEach(regex => {
      const matches = text.match(regex);
      if (matches) {
        dates.push(...matches);
      }
    });

    return [...new Set(dates)]; // Remove duplicates
  }

  private extractUrls(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s]+/g;
    return text.match(urlRegex) || [];
  }

  private extractAddresses(text: string): string[] {
    // Simple address detection - can be enhanced
    const addressRegex = /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl)/gi;
    return text.match(addressRegex) || [];
  }

  private generateMetadata(ocrResult: OCRResult, cleanedText: string): ProcessedText['metadata'] {
    const wordCount = cleanedText.split(/\s+/).length;
    const language = this.detectLanguage(cleanedText);
    const textType = this.classifyTextType(cleanedText, ocrResult);

    return {
      wordCount,
      language,
      confidence: ocrResult.confidence,
      textType
    };
  }

  private detectLanguage(text: string): string {
    // Simple language detection - can be enhanced with proper library
    const commonWords = {
      en: ['the', 'and', 'of', 'to', 'a', 'in', 'is', 'it', 'you', 'that'],
      es: ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se'],
      fr: ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir'],
      de: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich']
    };

    const lowerText = text.toLowerCase();
    let maxScore = 0;
    let detectedLanguage = 'en';

    Object.entries(commonWords).forEach(([lang, words]) => {
      const score = words.reduce((acc, word) => {
        return acc + (lowerText.includes(word) ? 1 : 0);
      }, 0);

      if (score > maxScore) {
        maxScore = score;
        detectedLanguage = lang;
      }
    });

    return detectedLanguage;
  }

  private classifyTextType(
    text: string, 
    ocrResult: OCRResult
  ): ProcessedText['metadata']['textType'] {
    const lowerText = text.toLowerCase();

    // Receipt indicators
    if (lowerText.includes('total') || 
        lowerText.includes('tax') || 
        lowerText.includes('receipt') ||
        /\$\d+\.\d{2}/.test(text)) {
      return 'receipt';
    }

    // Business card indicators
    if (lowerText.includes('email') || 
        lowerText.includes('phone') ||
        /@/.test(text) ||
        /\(\d{3}\)/.test(text)) {
      return 'business_card';
    }

    // Handwritten indicators (based on confidence and character patterns)
    if (ocrResult.confidence < 0.8) {
      return 'handwritten';
    }

    // Document indicators
    if (text.length > 200 && ocrResult.confidence > 0.9) {
      return 'document';
    }

    return 'other';
  }

  generateSmartTitle(processedText: ProcessedText): string {
    const { cleanedText, structuredData, metadata } = processedText;
    
    // Get first meaningful line as title
    const lines = cleanedText.split('\n').filter(line => line.trim().length > 2);
    
    if (lines.length === 0) {
      return `${metadata.textType.charAt(0).toUpperCase()}${metadata.textType.slice(1)} Document`;
    }
    
    // For receipts, try to find store name
    if (metadata.textType === 'receipt') {
      const firstLine = lines[0].trim();
      if (firstLine.length > 3 && firstLine.length < 50) {
        return `Receipt from ${firstLine}`;
      }
      return 'Store Receipt';
    }
    
    // For business cards, try to find name
    if (metadata.textType === 'business_card') {
      for (const line of lines.slice(0, 3)) {
        // Look for name patterns (2-4 words, proper case)
        if (/^[A-Z][a-z]+ [A-Z][a-z]+/.test(line.trim()) && line.trim().split(' ').length <= 4) {
          return `Business Card - ${line.trim()}`;
        }
      }
      return 'Business Card';
    }
    
    // For documents, use first meaningful line
    const firstLine = lines[0].trim();
    if (firstLine.length > 5 && firstLine.length < 80) {
      // Clean up the title
      const title = firstLine
        .replace(/[^\w\s-]/g, '') // Remove special chars except hyphens
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();
      
      if (title.length > 3) {
        return title;
      }
    }
    
    return `${metadata.textType.charAt(0).toUpperCase()}${metadata.textType.slice(1)} Document`;
  }

  generateSmartDescription(processedText: ProcessedText): string {
    const { cleanedText, structuredData, metadata } = processedText;

    let description = `${metadata.textType === 'handwritten' ? 'Handwritten' : 'Typed'} ${metadata.textType} `;
    description += `with ${metadata.wordCount} words. `;

    // Add specific details based on text type
    if (metadata.textType === 'receipt') {
      // Look for total amount
      const totalMatch = cleanedText.match(/total[:\s]*\$?(\d+\.?\d*)/i);
      if (totalMatch) {
        description += `Total amount: $${totalMatch[1]}. `;
      }
    }

    if (metadata.textType === 'business_card') {
      if (structuredData.emails.length > 0) {
        description += `Email: ${structuredData.emails[0]}. `;
      }
      if (structuredData.phoneNumbers.length > 0) {
        description += `Phone: ${structuredData.phoneNumbers[0]}. `;
      }
    }

    // Add general structured data
    if (structuredData.emails.length > 0 && metadata.textType !== 'business_card') {
      description += `Contains ${structuredData.emails.length} email address(es). `;
    }

    if (structuredData.phoneNumbers.length > 0 && metadata.textType !== 'business_card') {
      description += `Contains ${structuredData.phoneNumbers.length} phone number(s). `;
    }

    if (structuredData.dates.length > 0) {
      description += `Contains ${structuredData.dates.length} date(s). `;
    }

    // Add content preview for longer documents
    if (cleanedText.length > 50) {
      const preview = cleanedText.substring(0, 100).replace(/\s+/g, ' ').trim();
      description += `Preview: "${preview}${cleanedText.length > 100 ? '...' : ''}"`;
    } else {
      description += `Content: "${cleanedText}"`;
    }

    return description;
  }

  generateSmartTags(processedText: ProcessedText): string[] {
    const { cleanedText, structuredData, metadata } = processedText;
    const tags: Set<string> = new Set();

    // Add base tags
    tags.add(metadata.textType);
    tags.add(`confidence-${Math.floor(metadata.confidence * 10) / 10}`);
    
    // Add content-specific tags
    if (metadata.textType === 'receipt') {
      tags.add('financial');
      tags.add('expense');
      if (cleanedText.toLowerCase().includes('tax')) tags.add('tax');
      if (cleanedText.toLowerCase().includes('grocery') || cleanedText.toLowerCase().includes('food')) tags.add('grocery');
    }
    
    if (metadata.textType === 'business_card') {
      tags.add('contact');
      tags.add('networking');
      if (structuredData.emails.length > 0) tags.add('email');
      if (structuredData.phoneNumbers.length > 0) tags.add('phone');
    }
    
    if (metadata.textType === 'document') {
      tags.add('text');
      if (cleanedText.toLowerCase().includes('meeting')) tags.add('meeting');
      if (cleanedText.toLowerCase().includes('project')) tags.add('project');
      if (cleanedText.toLowerCase().includes('contract')) tags.add('contract');
      if (cleanedText.toLowerCase().includes('invoice')) tags.add('invoice');
    }

    // Add structured data tags
    if (structuredData.emails.length > 0) tags.add('has-email');
    if (structuredData.phoneNumbers.length > 0) tags.add('has-phone');
    if (structuredData.dates.length > 0) tags.add('has-date');
    if (structuredData.urls.length > 0) tags.add('has-url');

    // Add language tag
    tags.add(`lang-${metadata.language}`);
    
    // Add processing date
    tags.add(`processed-${new Date().toISOString().split('T')[0]}`);

    return Array.from(tags);
  }
}

export const textProcessingService = TextProcessingService.getInstance(); 