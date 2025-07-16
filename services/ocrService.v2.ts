/**
 * Enhanced OCR Service - Cloud-First with Local Fallback
 * 
 * This is the new OCR service that prioritizes cloud providers for superior
 * accuracy and enhanced metadata generation, with local providers as fallback.
 * 
 * Key improvements:
 * - Cloud-first approach with OpenAI GPT-4o-mini
 * - Enhanced metadata generation with precise tagging
 * - Modular provider system for easy extensibility
 * - Intelligent fallback mechanisms
 * - Better error handling and retry logic
 * - Automatic configuration from environment variables
 */

import { OCRProcessingOptions, OCRError, CloudOCRResult } from '@/types/document';
import { cloudOCRManager } from './cloud/CloudOCRManager';
import { OCRService as LegacyOCRService } from './ocrService';
import { getAutoCloudOCRConfig, logConfiguration, validateCloudOCRConfig } from './config/envConfig';

/**
 * Enhanced OCR Service Configuration
 */
interface EnhancedOCRConfig {
  // Cloud OCR settings
  useCloudOCR: boolean;
  primaryProvider: 'openai' | 'google-cloud' | 'azure' | 'deepseek';
  enableLocalFallback: boolean;
  
  // API configurations
  openaiApiKey?: string;
  googleCloudApiKey?: string;
  azureApiKey?: string;
  deepseekApiKey?: string;
  
  // Processing options
  enhancedMetadata: boolean;
  enableRetries: boolean;
  maxRetries: number;
  timeout: number;
  
  // Quality settings
  confidenceThreshold: number;
  enableQualityAnalysis: boolean;
}

/**
 * Enhanced OCR Result with cloud capabilities
 */
export interface EnhancedOCRResult extends CloudOCRResult {
  source: 'cloud' | 'local';
  fallbackUsed: boolean;
  processingMode: 'enhanced' | 'standard' | 'fallback';
  qualityScore?: number;
  recommendations?: string[];
}

export class EnhancedOCRService {
  private static instance: EnhancedOCRService;
  private legacyService: LegacyOCRService;
  private config: EnhancedOCRConfig;
  private isInitialized = false;

  private constructor() {
    this.legacyService = LegacyOCRService.getInstance();
    
    // Default configuration
    this.config = {
      useCloudOCR: true,
      primaryProvider: 'openai',
      enableLocalFallback: true,
      enhancedMetadata: true,
      enableRetries: true,
      maxRetries: 3,
      timeout: 30000,
      confidenceThreshold: 0.7,
      enableQualityAnalysis: true
    };
  }

  /**
   * Get singleton instance
   */
  static getInstance(): EnhancedOCRService {
    if (!EnhancedOCRService.instance) {
      EnhancedOCRService.instance = new EnhancedOCRService();
    }
    return EnhancedOCRService.instance;
  }

  /**
   * Initialize the enhanced OCR service with automatic environment configuration
   */
  async initialize(config: Partial<EnhancedOCRConfig> = {}): Promise<void> {
    console.log('🚀 EnhancedOCRService: Initializing cloud-first OCR...');
    
    // Use auto-configuration from environment if no config provided
    if (Object.keys(config).length === 0) {
      const autoConfig = getAutoCloudOCRConfig();
      console.log('📋 Using automatic configuration from environment');
      config = autoConfig;
    }
    
    // Merge with default config
    this.config = { ...this.config, ...config };
    
    // Log configuration for debugging
    if (this.config.openaiApiKey) {
      logConfiguration();
    } else {
      console.warn('⚠️ No OpenAI API key found in environment or configuration');
    }
    
    // Validate configuration
    const validation = validateCloudOCRConfig();
    if (!validation.isValid) {
      console.warn('⚠️ EnhancedOCRService: Configuration validation failed:');
      validation.errors.forEach(error => console.warn(`  ❌ ${error}`));
    }
    if (validation.warnings.length > 0) {
      validation.warnings.forEach(warning => console.warn(`  ⚠️ ${warning}`));
    }

    // Initialize cloud OCR manager if enabled
    if (this.config.useCloudOCR && this.config.openaiApiKey) {
      try {
        await this.initializeCloudOCR();
        console.log('✅ EnhancedOCRService: Cloud OCR initialized successfully');
      } catch (error) {
        console.error('❌ EnhancedOCRService: Cloud OCR initialization failed:', error);
        if (!this.config.enableLocalFallback) {
          throw error;
        }
        console.log('🔄 EnhancedOCRService: Will use local fallback only');
      }
    } else {
      console.log('🔄 EnhancedOCRService: Cloud OCR disabled, using local OCR only');
    }

    // Initialize legacy local service as fallback
    if (this.config.enableLocalFallback) {
      try {
        await this.legacyService.initialize();
        console.log('✅ EnhancedOCRService: Local OCR fallback ready');
      } catch (error) {
        console.warn('⚠️ EnhancedOCRService: Local OCR initialization failed:', error);
      }
    }

    this.isInitialized = true;
    console.log('✅ EnhancedOCRService: Initialization completed');
    
    // Log service status
    await this.logServiceStatus();
  }

  /**
   * Initialize cloud OCR with current configuration
   */
  private async initializeCloudOCR(): Promise<void> {
    const cloudConfig = {
      primaryProvider: this.config.primaryProvider,
      fallbackProviders: [], // Add other providers as they become available
      enableFallback: false, // We handle fallback to local ourselves
      enableUsageTracking: true,
      providers: {} as any
    };

    // Configure OpenAI provider
    if (this.config.openaiApiKey) {
      cloudConfig.providers.openai = {
        provider: 'openai' as const,
        apiKey: this.config.openaiApiKey,
        model: 'gpt-4o-mini',
        timeout: this.config.timeout,
        maxRetries: this.config.maxRetries,
        enableEnhancedMetadata: this.config.enhancedMetadata
      };
    }

    // Add other providers as they're implemented
    // if (this.config.googleCloudApiKey) { ... }
    // if (this.config.azureApiKey) { ... }

    await cloudOCRManager.initialize(cloudConfig);
  }

  /**
   * Enhanced text recognition with cloud-first approach
   */
  async recognizeText(
    imageUri: string,
    options: OCRProcessingOptions = {}
  ): Promise<EnhancedOCRResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    console.log('🔍 EnhancedOCRService: Starting enhanced text recognition...');
    console.log(`📸 Image: ${imageUri.substring(0, 50)}...`);

    let fallbackUsed = false;
    let source: 'cloud' | 'local' = 'cloud';
    let processingMode: 'enhanced' | 'standard' | 'fallback' = 'enhanced';

    // Apply default options
    const enhancedOptions: OCRProcessingOptions = {
      language: 'en',
      recognitionLevel: 'accurate',
      minimumConfidence: this.config.confidenceThreshold,
      imagePreprocessing: {
        autoRotate: true,
        enhanceContrast: true,
        denoiseImage: false
      },
      ...options
    };

    try {
      // Try cloud OCR first
      if (this.config.useCloudOCR && this.config.openaiApiKey) {
        console.log('☁️ EnhancedOCRService: Attempting cloud OCR processing...');
        
        const cloudResult = await cloudOCRManager.processImage(imageUri, enhancedOptions);
        const processingTime = Date.now() - startTime;
        
        // Validate cloud result quality
        if (this.isHighQualityResult(cloudResult)) {
          console.log(`✅ EnhancedOCRService: Cloud OCR completed successfully in ${processingTime}ms`);
          console.log(`📊 Result: ${cloudResult.text.length} chars, confidence: ${cloudResult.confidence.toFixed(3)}`);
          console.log(`🎯 Provider: ${cloudResult.provider}, Model: ${cloudResult.model}`);
          
          return this.enhanceResult(cloudResult, source, fallbackUsed, processingMode);
        } else {
          console.warn('⚠️ EnhancedOCRService: Cloud result quality insufficient, trying fallback');
          throw new OCRError({
            code: 'PROCESSING_FAILED',
            message: 'Cloud OCR result quality below threshold'
          });
        }
      }
    } catch (error) {
      console.warn('⚠️ EnhancedOCRService: Cloud OCR failed:', error);
      
      if (!this.config.enableLocalFallback) {
        throw error;
      }
      
      fallbackUsed = true;
      source = 'local';
      processingMode = 'fallback';
    }

    // Fallback to local OCR
    if (this.config.enableLocalFallback) {
      try {
        console.log('🔄 EnhancedOCRService: Using local OCR fallback...');
        
        const localResult = await this.legacyService.recognizeText(imageUri, enhancedOptions);
        const processingTime = Date.now() - startTime;
        
        console.log(`✅ EnhancedOCRService: Local OCR completed in ${processingTime}ms`);
        console.log(`📊 Fallback result: ${localResult.text.length} chars, confidence: ${localResult.confidence.toFixed(3)}`);
        
        // Convert legacy result to enhanced format
        const enhancedResult: CloudOCRResult = {
          ...localResult,
          provider: 'local',
          model: 'mlkit/visionkit'
        };
        
        return this.enhanceResult(enhancedResult, source, fallbackUsed, processingMode);
      } catch (localError) {
        console.error('❌ EnhancedOCRService: Local OCR fallback also failed:', localError);
        throw new OCRError({
          code: 'PROCESSING_FAILED',
          message: 'Both cloud and local OCR failed',
          originalError: localError as Error
        });
      }
    }

    throw new OCRError({
      code: 'PROCESSING_FAILED',
      message: 'No OCR providers available'
    });
  }

  /**
   * Check if OCR result meets quality standards
   */
  private isHighQualityResult(result: CloudOCRResult): boolean {
    // Basic quality checks
    if (!result.text || result.text.trim().length === 0) {
      return false;
    }

    if (result.confidence < this.config.confidenceThreshold) {
      return false;
    }

    // Additional quality checks for enhanced metadata
    if (this.config.enhancedMetadata && result.enhancedMetadata) {
      const metadata = result.enhancedMetadata;
      
      // Check if we have meaningful metadata
      if (!metadata.title || metadata.title.trim().length === 0) {
        return false;
      }
      
      if (!metadata.tags || metadata.tags.length === 0) {
        return false;
      }
    }

    return true;
  }

  /**
   * Enhance result with additional analysis and metadata
   */
  private enhanceResult(
    result: CloudOCRResult,
    source: 'cloud' | 'local',
    fallbackUsed: boolean,
    processingMode: 'enhanced' | 'standard' | 'fallback'
  ): EnhancedOCRResult {
    let qualityScore = result.confidence;
    const recommendations: string[] = [];

    // Calculate quality score based on multiple factors
    if (result.text.length > 100) qualityScore += 0.1;
    if (result.blocks.length > 1) qualityScore += 0.05;
    if (source === 'cloud') qualityScore += 0.1;
    if (result.enhancedMetadata) qualityScore += 0.15;

    // Generate recommendations
    if (result.confidence < 0.8) {
      recommendations.push('Consider retaking the photo with better lighting');
    }
    if (result.text.length < 20) {
      recommendations.push('Document appears to contain minimal text');
    }
    if (fallbackUsed) {
      recommendations.push('Used local OCR fallback - cloud OCR may be temporarily unavailable');
    }
    if (source === 'cloud' && result.enhancedMetadata) {
      recommendations.push('Enhanced metadata generated using AI analysis');
    }

    return {
      ...result,
      source,
      fallbackUsed,
      processingMode,
      qualityScore: Math.min(qualityScore, 1.0),
      recommendations
    };
  }

  /**
   * Test the enhanced OCR service with comprehensive diagnostics
   */
  async testService(imageUri?: string): Promise<{
    success: boolean;
    cloudOCR: { available: boolean; error?: string };
    localOCR: { available: boolean; error?: string };
    testResult?: EnhancedOCRResult;
    recommendations: string[];
  }> {
    console.log('🧪 EnhancedOCRService: Running comprehensive service test...');
    
    const results: {
      success: boolean;
      cloudOCR: { available: boolean; error?: string };
      localOCR: { available: boolean; error?: string };
      testResult?: EnhancedOCRResult;
      recommendations: string[];
    } = {
      success: false,
      cloudOCR: { available: false },
      localOCR: { available: false },
      recommendations: []
    };

    // Test cloud OCR availability
    try {
      if (this.config.useCloudOCR) {
        const connections = await cloudOCRManager.testAllConnections();
        results.cloudOCR.available = Object.values(connections).some(Boolean);
        
        if (results.cloudOCR.available) {
          console.log('✅ Cloud OCR: Available');
        } else {
          console.log('❌ Cloud OCR: Not available');
          results.recommendations.push('Configure cloud OCR API keys for enhanced accuracy');
        }
      }
    } catch (error) {
      results.cloudOCR.error = error instanceof Error ? error.message : 'Unknown error';
      console.log('❌ Cloud OCR: Error -', results.cloudOCR.error);
    }

    // Test local OCR availability
    try {
      if (this.config.enableLocalFallback) {
        results.localOCR.available = await this.legacyService.isSupported();
        
        if (results.localOCR.available) {
          console.log('✅ Local OCR: Available');
        } else {
          console.log('❌ Local OCR: Not available');
          results.recommendations.push('Local OCR fallback not available on this platform');
        }
      }
    } catch (error) {
      results.localOCR.error = error instanceof Error ? error.message : 'Unknown error';
      console.log('❌ Local OCR: Error -', results.localOCR.error);
    }

    // Test with actual image if provided
    if (imageUri && (results.cloudOCR.available || results.localOCR.available)) {
      try {
        console.log('🖼️ Testing with provided image...');
        const testResult = await this.recognizeText(imageUri, {
          minimumConfidence: 0.3 // Lower threshold for testing
        });
        
        results.testResult = testResult;
        results.success = true;
        
        console.log(`✅ Image test successful: ${testResult.text.length} chars extracted`);
        console.log(`📊 Quality score: ${testResult.qualityScore?.toFixed(3)}`);
        console.log(`🔧 Processing mode: ${testResult.processingMode}`);
        
        if (testResult.recommendations) {
          results.recommendations.push(...testResult.recommendations);
        }
      } catch (error) {
        console.error('❌ Image test failed:', error);
        results.recommendations.push('Image processing test failed - check image format and accessibility');
      }
    }

    // General service recommendations
    if (!results.cloudOCR.available && !results.localOCR.available) {
      results.recommendations.push('No OCR providers available - check configuration and network connectivity');
    } else if (!results.cloudOCR.available) {
      results.recommendations.push('Consider configuring cloud OCR for better accuracy and enhanced metadata');
    }

    results.success = results.cloudOCR.available || results.localOCR.available;
    
    console.log('🧪 EnhancedOCRService: Test completed');
    return results;
  }

  /**
   * Get current service configuration
   */
  getConfig(): EnhancedOCRConfig {
    return { ...this.config };
  }

  /**
   * Update service configuration
   */
  async updateConfig(newConfig: Partial<EnhancedOCRConfig>): Promise<void> {
    console.log('🔧 EnhancedOCRService: Updating configuration...');
    
    this.config = { ...this.config, ...newConfig };
    
    // Reinitialize if cloud settings changed
    if (newConfig.openaiApiKey || newConfig.primaryProvider || newConfig.useCloudOCR !== undefined) {
      await this.initialize(this.config);
    }
    
    console.log('✅ EnhancedOCRService: Configuration updated');
  }

  /**
   * Log current service status
   */
  private async logServiceStatus(): Promise<void> {
    console.log('📊 EnhancedOCRService: Service Status Report');
    console.log('==========================================');
    console.log(`Cloud OCR: ${this.config.useCloudOCR ? 'Enabled' : 'Disabled'}`);
    console.log(`Primary Provider: ${this.config.primaryProvider}`);
    console.log(`Local Fallback: ${this.config.enableLocalFallback ? 'Enabled' : 'Disabled'}`);
    console.log(`Enhanced Metadata: ${this.config.enhancedMetadata ? 'Enabled' : 'Disabled'}`);
    console.log(`Confidence Threshold: ${this.config.confidenceThreshold}`);
    console.log(`OpenAI API Key: ${this.config.openaiApiKey ? '✅ Configured' : '❌ Missing'}`);
    
    if (this.config.useCloudOCR && this.config.openaiApiKey) {
      try {
        const providerStatus = await cloudOCRManager.getProviderStatus();
        console.log('\nCloud Providers:');
        providerStatus.forEach(status => {
          console.log(`  ${status.provider}: ${status.available ? '✅' : '❌'} ${status.configured ? '(configured)' : '(not configured)'}`);
        });
      } catch (error) {
        console.log('\nCloud Providers: ❌ (Not initialized)');
      }
    }
    
    console.log('==========================================');
  }

  /**
   * Enable debug mode for detailed logging
   */
  enableDebugMode(): void {
    this.legacyService.enableDebugMode();
    console.log('🐛 EnhancedOCRService: Debug mode enabled');
  }

  /**
   * Disable debug mode
   */
  disableDebugMode(): void {
    this.legacyService.disableDebugMode();
    console.log('🐛 EnhancedOCRService: Debug mode disabled');
  }
}

// Export singleton instance
export const enhancedOCRService = EnhancedOCRService.getInstance();