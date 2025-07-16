/**
 * Cloud OCR Manager - Orchestrates multiple OCR providers
 * 
 * This manager handles provider selection, fallback mechanisms, and provides
 * a unified interface for cloud OCR operations. It supports easy switching
 * between providers and automatic fallback for reliability.
 */

import { OCRProviderInterface, CloudOCRConfig, CloudOCRResult, OCRProcessingOptions, OCRError, OCRProviderType } from '@/types/document';
import { OpenAIOCRProvider } from './OpenAIOCRProvider';
// Import other providers as they're implemented
// import { GoogleCloudOCRProvider } from './GoogleCloudOCRProvider';
// import { DeepSeekOCRProvider } from './DeepSeekOCRProvider';

interface ProviderStatus {
  provider: OCRProviderType;
  configured: boolean;
  available: boolean;
  lastError?: string;
  lastSuccess?: Date;
}

interface OCRManagerConfig {
  primaryProvider: OCRProviderType;
  fallbackProviders: OCRProviderType[];
  enableFallback: boolean;
  enableUsageTracking: boolean;
  providers: Record<OCRProviderType, CloudOCRConfig>;
}

export class CloudOCRManager {
  private static instance: CloudOCRManager;
  private providers = new Map<OCRProviderType, OCRProviderInterface>();
  private config?: OCRManagerConfig;
  private isInitialized = false;

  private constructor() {
    // Register available providers
    this.registerProvider(new OpenAIOCRProvider());
    // this.registerProvider(new GoogleCloudOCRProvider());
    // this.registerProvider(new DeepSeekOCRProvider());
  }

  /**
   * Get singleton instance
   */
  static getInstance(): CloudOCRManager {
    if (!CloudOCRManager.instance) {
      CloudOCRManager.instance = new CloudOCRManager();
    }
    return CloudOCRManager.instance;
  }

  /**
   * Register a new OCR provider
   */
  private registerProvider(provider: OCRProviderInterface): void {
    this.providers.set(provider.name, provider);
    console.log(`📝 CloudOCRManager: Registered provider: ${provider.name}`);
  }

  /**
   * Initialize the manager with configuration
   */
  async initialize(config: OCRManagerConfig): Promise<void> {
    console.log('🚀 CloudOCRManager: Initializing with config...');
    this.config = config;

    // Initialize all configured providers
    const initPromises = Object.entries(config.providers).map(async ([providerName, providerConfig]) => {
      const provider = this.providers.get(providerName as OCRProviderType);
      if (provider) {
        try {
          await provider.initialize(providerConfig);
          console.log(`✅ CloudOCRManager: ${providerName} initialized successfully`);
        } catch (error) {
          console.error(`❌ CloudOCRManager: Failed to initialize ${providerName}:`, error);
          // Continue with other providers
        }
      } else {
        console.warn(`⚠️ CloudOCRManager: Provider ${providerName} not found`);
      }
    });

    await Promise.allSettled(initPromises);

    // Verify at least the primary provider is available
    const primaryProvider = this.providers.get(config.primaryProvider);
    if (!primaryProvider || !primaryProvider.isConfigured()) {
      throw new OCRError({
        code: 'PROVIDER_ERROR',
        message: `Primary provider ${config.primaryProvider} is not available`
      });
    }

    this.isInitialized = true;
    console.log('✅ CloudOCRManager: Initialization completed');
    
    // Log provider status
    await this.logProviderStatus();
  }

  /**
   * Process image using the best available provider
   */
  async processImage(imageUri: string, options: OCRProcessingOptions = {}): Promise<CloudOCRResult> {
    if (!this.isInitialized || !this.config) {
      throw new OCRError({
        code: 'PROVIDER_ERROR',
        message: 'CloudOCRManager not initialized'
      });
    }

    const startTime = Date.now();
    console.log('🔍 CloudOCRManager: Starting image processing...');

    // Try primary provider first
    try {
      const result = await this.processWithProvider(this.config.primaryProvider, imageUri, options);
      const totalTime = Date.now() - startTime;
      
      console.log(`✅ CloudOCRManager: Processing completed with ${result.provider} in ${totalTime}ms`);
      return result;
    } catch (error) {
      console.warn(`⚠️ CloudOCRManager: Primary provider ${this.config.primaryProvider} failed:`, error);
      
      // Try fallback providers if enabled
      if (this.config.enableFallback && this.config.fallbackProviders.length > 0) {
        for (const fallbackProvider of this.config.fallbackProviders) {
          try {
            console.log(`🔄 CloudOCRManager: Trying fallback provider: ${fallbackProvider}`);
            const result = await this.processWithProvider(fallbackProvider, imageUri, options);
            const totalTime = Date.now() - startTime;
            
            console.log(`✅ CloudOCRManager: Fallback processing completed with ${result.provider} in ${totalTime}ms`);
            return result;
          } catch (fallbackError) {
            console.warn(`⚠️ CloudOCRManager: Fallback provider ${fallbackProvider} failed:`, fallbackError);
            continue;
          }
        }
      }
      
      // All providers failed
      throw new OCRError({
        code: 'PROCESSING_FAILED',
        message: 'All OCR providers failed to process the image',
        originalError: error as Error
      });
    }
  }

  /**
   * Process image with a specific provider
   */
  private async processWithProvider(
    providerType: OCRProviderType, 
    imageUri: string, 
    options: OCRProcessingOptions
  ): Promise<CloudOCRResult> {
    const provider = this.providers.get(providerType);
    if (!provider) {
      throw new OCRError({
        code: 'PROVIDER_ERROR',
        message: `Provider ${providerType} not found`
      });
    }

    if (!provider.isConfigured()) {
      throw new OCRError({
        code: 'PROVIDER_ERROR',
        message: `Provider ${providerType} not configured`
      });
    }

    return await provider.processImage(imageUri, options);
  }

  /**
   * Test connection for all providers
   */
  async testAllConnections(): Promise<Record<OCRProviderType, boolean>> {
    const results: Partial<Record<OCRProviderType, boolean>> = {};
    
    for (const [providerType, provider] of this.providers) {
      if (provider.isConfigured()) {
        try {
          results[providerType] = await provider.testConnection();
        } catch (error) {
          console.error(`Connection test failed for ${providerType}:`, error);
          results[providerType] = false;
        }
      } else {
        results[providerType] = false;
      }
    }
    
    return results as Record<OCRProviderType, boolean>;
  }

  /**
   * Get status of all providers
   */
  async getProviderStatus(): Promise<ProviderStatus[]> {
    const statuses: ProviderStatus[] = [];
    
    for (const [providerType, provider] of this.providers) {
      const configured = provider.isConfigured();
      let available = false;
      let lastError: string | undefined;
      
      if (configured) {
        try {
          available = await provider.testConnection();
        } catch (error) {
          lastError = error instanceof Error ? error.message : 'Unknown error';
        }
      }
      
      statuses.push({
        provider: providerType,
        configured,
        available,
        lastError,
        lastSuccess: available ? new Date() : undefined
      });
    }
    
    return statuses;
  }

  /**
   * Get configuration for a specific provider
   */
  getProviderConfig(providerType: OCRProviderType): CloudOCRConfig | undefined {
    return this.config?.providers[providerType];
  }

  /**
   * Update configuration for a specific provider
   */
  async updateProviderConfig(providerType: OCRProviderType, config: CloudOCRConfig): Promise<void> {
    if (!this.config) {
      throw new OCRError({
        code: 'PROVIDER_ERROR',
        message: 'Manager not initialized'
      });
    }

    this.config.providers[providerType] = config;
    
    const provider = this.providers.get(providerType);
    if (provider) {
      await provider.initialize(config);
      console.log(`✅ CloudOCRManager: Updated configuration for ${providerType}`);
    }
  }

  /**
   * Switch primary provider
   */
  async switchPrimaryProvider(providerType: OCRProviderType): Promise<void> {
    if (!this.config) {
      throw new OCRError({
        code: 'PROVIDER_ERROR',
        message: 'Manager not initialized'
      });
    }

    const provider = this.providers.get(providerType);
    if (!provider || !provider.isConfigured()) {
      throw new OCRError({
        code: 'PROVIDER_ERROR',
        message: `Provider ${providerType} is not available`
      });
    }

    // Test connection before switching
    const isConnected = await provider.testConnection();
    if (!isConnected) {
      throw new OCRError({
        code: 'PROVIDER_ERROR',
        message: `Cannot switch to ${providerType}: connection test failed`
      });
    }

    this.config.primaryProvider = providerType;
    console.log(`🔄 CloudOCRManager: Switched primary provider to ${providerType}`);
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): OCRProviderType[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get current configuration
   */
  getConfig(): OCRManagerConfig | undefined {
    return this.config;
  }

  /**
   * Log current provider status
   */
  private async logProviderStatus(): Promise<void> {
    console.log('📊 CloudOCRManager: Provider Status Report');
    console.log('=====================================');
    
    for (const [providerType, provider] of this.providers) {
      const configured = provider.isConfigured();
      const info = provider.getInfo();
      
      console.log(`${providerType.toUpperCase()}:`);
      console.log(`  Configured: ${configured ? '✅' : '❌'}`);
      console.log(`  Formats: ${info.formats.join(', ')}`);
      console.log(`  Max Size: ${info.maxSize}`);
      
      if (configured) {
        try {
          const connected = await provider.testConnection();
          console.log(`  Connection: ${connected ? '✅' : '❌'}`);
        } catch (error) {
          console.log(`  Connection: ❌ (${error instanceof Error ? error.message : 'Unknown error'})`);
        }
      }
      console.log('');
    }
    
    if (this.config) {
      console.log(`Primary Provider: ${this.config.primaryProvider}`);
      console.log(`Fallback Enabled: ${this.config.enableFallback}`);
      console.log(`Fallback Providers: ${this.config.fallbackProviders.join(', ')}`);
    }
    console.log('=====================================');
  }

  /**
   * Reset and cleanup
   */
  reset(): void {
    this.isInitialized = false;
    this.config = undefined;
    console.log('🔄 CloudOCRManager: Reset completed');
  }
}

// Export singleton instance
export const cloudOCRManager = CloudOCRManager.getInstance();