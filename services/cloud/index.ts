/**
 * Cloud OCR Services - Main Export File
 * 
 * This file exports all cloud OCR providers and utilities for easy importing
 * throughout the application.
 */

// Base provider and interfaces
export { BaseOCRProvider } from './BaseOCRProvider';
export type { OCRProviderInterface, CloudOCRConfig, CloudOCRResult } from '@/types/document';

// Specific providers
export { OpenAIOCRProvider } from './OpenAIOCRProvider';
// Export other providers as they're implemented:
// export { GoogleCloudOCRProvider } from './GoogleCloudOCRProvider';
// export { AzureOCRProvider } from './AzureOCRProvider';
// export { DeepSeekOCRProvider } from './DeepSeekOCRProvider';

// Manager
export { CloudOCRManager, cloudOCRManager } from './CloudOCRManager';

// Enhanced services
export { EnhancedOCRService, enhancedOCRService } from '../ocrService.v2';
export type { EnhancedOCRResult } from '../ocrService.v2';

// Enhanced metadata service
export { 
  generateEnhancedMetadata, 
  testEnhancedMetadataGeneration 
} from '../aiMetadata.v2';
export type { EnhancedMetadataResponse } from '../aiMetadata.v2';

/**
 * Configuration helper to get cloud OCR settings from app.json
 */
export function getCloudOCRConfig(): {
  enableCloudOCR: boolean;
  primaryProvider: string;
  enableLocalFallback: boolean;
  enhancedMetadata: boolean;
  confidenceThreshold: number;
  maxRetries: number;
  timeout: number;
  enableQualityAnalysis: boolean;
} {
  // In a real React Native app, you'd use expo-constants
  // For now, return default configuration
  return {
    enableCloudOCR: true,
    primaryProvider: 'openai',
    enableLocalFallback: true,
    enhancedMetadata: true,
    confidenceThreshold: 0.7,
    maxRetries: 3,
    timeout: 30000,
    enableQualityAnalysis: true
  };
}

/**
 * Quick setup function for cloud OCR
 */
export async function setupCloudOCR(config: {
  openaiApiKey?: string;
  primaryProvider?: 'openai' | 'google-cloud' | 'azure' | 'deepseek';
  enableLocalFallback?: boolean;
}): Promise<void> {
  const { enhancedOCRService } = await import('../ocrService.v2');
  
  await enhancedOCRService.initialize({
    useCloudOCR: true,
    primaryProvider: config.primaryProvider || 'openai',
    enableLocalFallback: config.enableLocalFallback ?? true,
    openaiApiKey: config.openaiApiKey,
    enhancedMetadata: true,
    enableRetries: true,
    maxRetries: 3,
    timeout: 30000,
    confidenceThreshold: 0.7,
    enableQualityAnalysis: true
  });
}

/**
 * Test cloud OCR functionality
 */
export async function testCloudOCRSetup(config: {
  openaiApiKey?: string;
  testImageUri?: string;
}): Promise<{
  success: boolean;
  results: any;
  recommendations: string[];
}> {
  try {
    const { enhancedOCRService } = await import('../ocrService.v2');
    
    // Initialize service
    await enhancedOCRService.initialize({
      useCloudOCR: true,
      primaryProvider: 'openai',
      enableLocalFallback: true,
      openaiApiKey: config.openaiApiKey,
      enhancedMetadata: true
    });
    
    // Test the service
    const testResults = await enhancedOCRService.testService(config.testImageUri);
    
    const recommendations: string[] = [];
    
    if (!testResults.cloudOCR.available) {
      recommendations.push('Configure OpenAI API key for cloud OCR');
    }
    
    if (!testResults.localOCR.available) {
      recommendations.push('Local OCR fallback not available');
    }
    
    if (testResults.testResult) {
      recommendations.push('Test processing completed successfully');
    }
    
    return {
      success: testResults.success,
      results: testResults,
      recommendations
    };
  } catch (error) {
    return {
      success: false,
      results: { error: error instanceof Error ? error.message : 'Unknown error' },
      recommendations: [
        'Check service configuration',
        'Verify API keys are valid',
        'Ensure network connectivity'
      ]
    };
  }
}