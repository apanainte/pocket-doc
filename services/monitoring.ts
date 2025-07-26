import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';

/**
 * Monitoring Service
 * 
 * Provides comprehensive error tracking, crash reporting, and performance monitoring
 * using Sentry. This service helps identify and resolve issues in production.
 */

export interface MonitoringConfig {
  dsn?: string;
  environment?: string;
  enableAutoSessionTracking?: boolean;
  sessionTrackingIntervalMillis?: number;
  enableNativeCrashHandling?: boolean;
  enableAutoPerformanceTracking?: boolean;
}

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  success: boolean;
  metadata?: Record<string, any>;
}

export interface ErrorContext {
  user?: {
    id?: string;
    email?: string;
  };
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  level?: 'debug' | 'info' | 'warning' | 'error' | 'fatal';
}

class MonitoringService {
  private isInitialized = false;
  private performanceMetrics: PerformanceMetrics[] = [];

  /**
   * Initialize Sentry monitoring
   */
  public initialize(config?: MonitoringConfig): void {
    try {
      const defaultConfig: MonitoringConfig = {
        dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
        environment: __DEV__ ? 'development' : 'production',
        enableAutoSessionTracking: true,
        sessionTrackingIntervalMillis: 30000,
        enableNativeCrashHandling: true,
        enableAutoPerformanceTracking: true,
      };

      const finalConfig = { ...defaultConfig, ...config };

      if (!finalConfig.dsn || finalConfig.dsn === 'development-mode-disabled') {
        if (__DEV__) {
          console.log('Sentry monitoring disabled in development mode. Performance tracking will continue locally.');
        } else {
          console.warn('Sentry DSN not configured. Monitoring will be disabled.');
        }
        return;
      }

             Sentry.init({
         dsn: finalConfig.dsn,
         environment: finalConfig.environment,
         enableAutoSessionTracking: finalConfig.enableAutoSessionTracking,
         sessionTrackingIntervalMillis: finalConfig.sessionTrackingIntervalMillis,
         enableNativeCrashHandling: finalConfig.enableNativeCrashHandling,
         beforeSend: (event) => {
           // Filter out development errors in production
           if (__DEV__ && event.environment === 'production') {
             return null;
           }
           return event;
         },
         tracesSampleRate: __DEV__ ? 1.0 : 0.1, // 100% in dev, 10% in production
       });

      this.isInitialized = true;
      console.log('Monitoring service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize monitoring service:', error);
    }
  }

  /**
   * Set user context for error tracking
   */
  public setUser(user: { id?: string; email?: string; username?: string }): void {
    if (!this.isInitialized) return;

    Sentry.setUser(user);
  }

  /**
   * Set tags for error categorization
   */
  public setTags(tags: Record<string, string>): void {
    if (!this.isInitialized) return;

    Sentry.setTags(tags);
  }

  /**
   * Set extra context for debugging
   */
  public setExtra(key: string, value: any): void {
    if (!this.isInitialized) return;

    Sentry.setExtra(key, value);
  }

  /**
   * Capture an error with context
   */
  public captureError(error: Error, context?: ErrorContext): void {
    if (!this.isInitialized) {
      console.error('Monitoring not initialized:', error);
      return;
    }

    Sentry.withScope((scope) => {
      if (context?.user) {
        scope.setUser(context.user);
      }
      if (context?.tags) {
        scope.setTags(context.tags);
      }
      if (context?.extra) {
        scope.setExtras(context.extra);
      }
      if (context?.level) {
        scope.setLevel(context.level);
      }

      Sentry.captureException(error);
    });
  }

  /**
   * Capture a message with context
   */
  public captureMessage(message: string, level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info'): void {
    if (!this.isInitialized) {
      console.log('Monitoring not initialized:', message);
      return;
    }

    Sentry.captureMessage(message, level);
  }

  /**
   * Track performance metrics
   */
  public trackPerformance(metrics: PerformanceMetrics): void {
    if (!this.isInitialized) return;

    // Store metrics locally for analysis
    this.performanceMetrics.push({
      ...metrics,
      timestamp: Date.now(),
    } as any);

    // Send to Sentry as custom event
    Sentry.addBreadcrumb({
      category: 'performance',
      message: `${metrics.operation} took ${metrics.duration}ms`,
      level: metrics.success ? 'info' : 'warning',
      data: {
        operation: metrics.operation,
        duration: metrics.duration,
        success: metrics.success,
        ...metrics.metadata,
      },
    });

         // Send performance data as custom event
     Sentry.withScope((scope) => {
       scope.setTag('operation', metrics.operation);
       scope.setTag('success', metrics.success.toString());
       scope.setLevel('info');
       
       if (metrics.metadata) {
         Object.entries(metrics.metadata).forEach(([key, value]) => {
           scope.setExtra(key, value);
         });
       }
       
       Sentry.captureMessage(`Performance: ${metrics.operation} (${metrics.duration}ms)`, 'info');
     });
  }

     /**
    * Start a performance measurement
    */
   public startPerformanceMeasurement(name: string, operation: string = 'operation'): { 
     finish: (success?: boolean, metadata?: Record<string, any>) => void 
   } {
     const startTime = Date.now();
     
     return {
       finish: (success: boolean = true, metadata?: Record<string, any>) => {
         const duration = Date.now() - startTime;
         this.trackPerformance({
           operation: `${operation}_${name}`,
           duration,
           success,
           metadata,
         });
       },
     };
   }

  /**
   * Add breadcrumb for debugging
   */
  public addBreadcrumb(message: string, category: string = 'default', level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info'): void {
    if (!this.isInitialized) return;

    Sentry.addBreadcrumb({
      message,
      category,
      level,
      timestamp: Date.now() / 1000,
    });
  }

  /**
   * Get performance metrics summary
   */
  public getPerformanceMetrics(): PerformanceMetrics[] {
    return [...this.performanceMetrics];
  }

  /**
   * Clear stored performance metrics
   */
  public clearPerformanceMetrics(): void {
    this.performanceMetrics = [];
  }

  /**
   * Track OCR processing performance
   */
  public trackOCRPerformance(duration: number, success: boolean, fileSize?: number, fileType?: string): void {
    this.trackPerformance({
      operation: 'ocr_processing',
      duration,
      success,
      metadata: {
        fileSize,
        fileType,
        platform: Platform.OS,
      },
    });
  }

  /**
   * Track AI metadata generation performance
   */
  public trackAIMetadataPerformance(duration: number, success: boolean, textLength?: number): void {
    this.trackPerformance({
      operation: 'ai_metadata_generation',
      duration,
      success,
      metadata: {
        textLength,
        platform: Platform.OS,
      },
    });
  }

  /**
   * Track search performance
   */
  public trackSearchPerformance(duration: number, success: boolean, queryLength?: number, resultCount?: number): void {
    this.trackPerformance({
      operation: 'search_query',
      duration,
      success,
      metadata: {
        queryLength,
        resultCount,
        platform: Platform.OS,
      },
    });
  }

  /**
   * Track file upload performance
   */
  public trackUploadPerformance(duration: number, success: boolean, fileSize?: number, fileType?: string): void {
    this.trackPerformance({
      operation: 'file_upload',
      duration,
      success,
      metadata: {
        fileSize,
        fileType,
        platform: Platform.OS,
      },
    });
  }
}

// Export singleton instance
export const monitoringService = new MonitoringService();

// Export convenience functions
export const initializeMonitoring = (config?: MonitoringConfig) => monitoringService.initialize(config);
export const captureError = (error: Error, context?: ErrorContext) => monitoringService.captureError(error, context);
export const captureMessage = (message: string, level?: 'debug' | 'info' | 'warning' | 'error' | 'fatal') => monitoringService.captureMessage(message, level);
export const trackPerformance = (metrics: PerformanceMetrics) => monitoringService.trackPerformance(metrics);
export const addBreadcrumb = (message: string, category?: string, level?: 'debug' | 'info' | 'warning' | 'error' | 'fatal') => monitoringService.addBreadcrumb(message, category, level);

// Export specialized tracking functions
export const trackOCRPerformance = (duration: number, success: boolean, fileSize?: number, fileType?: string) => 
  monitoringService.trackOCRPerformance(duration, success, fileSize, fileType);

export const trackAIMetadataPerformance = (duration: number, success: boolean, textLength?: number) => 
  monitoringService.trackAIMetadataPerformance(duration, success, textLength);

export const trackSearchPerformance = (duration: number, success: boolean, queryLength?: number, resultCount?: number) => 
  monitoringService.trackSearchPerformance(duration, success, queryLength, resultCount);

export const trackUploadPerformance = (duration: number, success: boolean, fileSize?: number, fileType?: string) => 
  monitoringService.trackUploadPerformance(duration, success, fileSize, fileType);

export default monitoringService; 