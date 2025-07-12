import { Platform } from 'react-native';
import { captureMessage, addBreadcrumb, monitoringService } from './monitoring';

/**
 * Performance Monitoring Service
 * 
 * Tracks and analyzes app performance metrics including:
 * - Operation timing
 * - Memory usage
 * - Frame rate monitoring
 * - Network performance
 * - User interaction response times
 */

export interface PerformanceMetric {
  id: string;
  name: string;
  category: 'ocr' | 'ai' | 'upload' | 'search' | 'ui' | 'network' | 'database';
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  metadata?: Record<string, any>;
  tags?: Record<string, string>;
}

export interface PerformanceBenchmark {
  name: string;
  category: string;
  expectedDuration: number; // milliseconds
  warningThreshold: number; // milliseconds
  errorThreshold: number; // milliseconds
}

export interface PerformanceReport {
  totalOperations: number;
  averageDuration: number;
  successRate: number;
  slowestOperations: PerformanceMetric[];
  failedOperations: PerformanceMetric[];
  categoryBreakdown: Record<string, {
    count: number;
    averageDuration: number;
    successRate: number;
  }>;
  recommendations: string[];
}

export interface MemoryUsage {
  used: number;
  total: number;
  percentage: number;
  timestamp: number;
}

class PerformanceMonitoringService {
  private metrics: PerformanceMetric[] = [];
  private activeOperations: Map<string, PerformanceMetric> = new Map();
  private benchmarks: PerformanceBenchmark[] = [];
  private memoryUsageHistory: MemoryUsage[] = [];
  private isEnabled: boolean = true;
  private maxMetricsHistory: number = 1000;

  constructor() {
    this.initializeDefaultBenchmarks();
    this.startMemoryMonitoring();
    console.log('Performance monitoring service initialized');
  }

  /**
   * Initialize default performance benchmarks
   */
  private initializeDefaultBenchmarks(): void {
    this.benchmarks = [
      {
        name: 'ocr_processing',
        category: 'ocr',
        expectedDuration: 3000, // 3 seconds
        warningThreshold: 5000, // 5 seconds
        errorThreshold: 10000, // 10 seconds
      },
      {
        name: 'ai_metadata_generation',
        category: 'ai',
        expectedDuration: 2000, // 2 seconds
        warningThreshold: 5000, // 5 seconds
        errorThreshold: 10000, // 10 seconds
      },
      {
        name: 'file_upload',
        category: 'upload',
        expectedDuration: 2000, // 2 seconds
        warningThreshold: 5000, // 5 seconds
        errorThreshold: 15000, // 15 seconds
      },
      {
        name: 'search_query',
        category: 'search',
        expectedDuration: 500, // 500ms
        warningThreshold: 1000, // 1 second
        errorThreshold: 3000, // 3 seconds
      },
      {
        name: 'ui_interaction',
        category: 'ui',
        expectedDuration: 100, // 100ms
        warningThreshold: 200, // 200ms
        errorThreshold: 500, // 500ms
      },
      {
        name: 'database_query',
        category: 'database',
        expectedDuration: 100, // 100ms
        warningThreshold: 500, // 500ms
        errorThreshold: 1000, // 1 second
      },
    ];
  }

  /**
   * Start monitoring memory usage
   */
  private startMemoryMonitoring(): void {
    // Monitor memory usage every 30 seconds
    setInterval(() => {
      this.recordMemoryUsage();
    }, 30000);
  }

  /**
   * Record current memory usage
   */
  private recordMemoryUsage(): void {
    try {
      // Note: React Native doesn't provide direct memory access
      // This is a placeholder for platform-specific memory monitoring
      const memoryInfo = {
        used: 0, // Would be filled by platform-specific code
        total: 0, // Would be filled by platform-specific code
        percentage: 0,
        timestamp: Date.now(),
      };

      this.memoryUsageHistory.push(memoryInfo);

      // Keep only last 100 memory readings
      if (this.memoryUsageHistory.length > 100) {
        this.memoryUsageHistory.shift();
      }
    } catch (error) {
      // Silently fail if memory monitoring is not available
    }
  }

  /**
   * Start tracking a performance operation
   */
  public startOperation(
    name: string,
    category: PerformanceMetric['category'],
    metadata?: Record<string, any>
  ): string {
    if (!this.isEnabled) return '';

    const id = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const metric: PerformanceMetric = {
      id,
      name,
      category,
      startTime: Date.now(),
      success: false, // Will be updated when operation completes
      metadata,
      tags: {
        platform: Platform.OS,
        version: Platform.Version.toString(),
      },
    };

    this.activeOperations.set(id, metric);
    
    // Always log operation start
    console.log(`Performance: Started operation ${name} (${id})`);
    
    // Try to add breadcrumb if monitoring available
    try {
      addBreadcrumb(`Started operation: ${name}`, 'performance');
    } catch (error) {
      // Silently fail if monitoring not available
    }
    
    return id;
  }

  /**
   * Complete a performance operation
   */
  public completeOperation(
    id: string,
    success: boolean = true,
    additionalMetadata?: Record<string, any>
  ): void {
    if (!this.isEnabled || !id) return;

    const metric = this.activeOperations.get(id);
    if (!metric) {
      console.warn(`Performance metric not found: ${id}`);
      return;
    }

    const endTime = Date.now();
    const duration = endTime - metric.startTime;

    // Update metric
    metric.endTime = endTime;
    metric.duration = duration;
    metric.success = success;
    
    if (additionalMetadata) {
      metric.metadata = { ...metric.metadata, ...additionalMetadata };
    }

    // Remove from active operations
    this.activeOperations.delete(id);

    // Add to metrics history
    this.metrics.push(metric);

    // Maintain metrics history limit
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics.shift();
    }

    // Check against benchmarks
    this.checkBenchmarks(metric);

    // Send to monitoring service if available
    try {
      monitoringService.trackPerformance({
        operation: metric.name,
        duration,
        success,
        metadata: metric.metadata,
      });
    } catch (error) {
      // Silently fail if monitoring not available
    }

    // Always log performance completion
    console.log(
      `Performance: ${metric.name} completed in ${duration}ms (${success ? 'success' : 'failed'})`
    );

    // Try to add breadcrumb if monitoring available
    try {
      addBreadcrumb(
        `Completed operation: ${metric.name} (${duration}ms, ${success ? 'success' : 'failed'})`,
        'performance'
      );
    } catch (error) {
      // Silently fail if monitoring not available
    }
  }

  /**
   * Check metric against benchmarks and log warnings/errors
   */
  private checkBenchmarks(metric: PerformanceMetric): void {
    const benchmark = this.benchmarks.find(b => b.name === metric.name);
    if (!benchmark || !metric.duration) return;

    if (metric.duration > benchmark.errorThreshold) {
      console.error(
        `Performance critical: ${metric.name} took ${metric.duration}ms (threshold: ${benchmark.errorThreshold}ms)`
      );
      // Try to send to monitoring service if available
      try {
        captureMessage(
          `Performance critical: ${metric.name} took ${metric.duration}ms (threshold: ${benchmark.errorThreshold}ms)`,
          'error'
        );
      } catch (error) {
        // Silently fail if monitoring not available
      }
    } else if (metric.duration > benchmark.warningThreshold) {
      console.warn(
        `Performance warning: ${metric.name} took ${metric.duration}ms (threshold: ${benchmark.warningThreshold}ms)`
      );
      // Try to send to monitoring service if available
      try {
        captureMessage(
          `Performance warning: ${metric.name} took ${metric.duration}ms (threshold: ${benchmark.warningThreshold}ms)`,
          'warning'
        );
      } catch (error) {
        // Silently fail if monitoring not available
      }
    }
  }

  /**
   * Track OCR processing performance
   */
  public trackOCRProcessing(fileSize: number, fileType: string): string {
    return this.startOperation('ocr_processing', 'ocr', {
      fileSize,
      fileType,
    });
  }

  /**
   * Track AI metadata generation performance
   */
  public trackAIMetadataGeneration(textLength: number, model?: string): string {
    return this.startOperation('ai_metadata_generation', 'ai', {
      textLength,
      model,
    });
  }

  /**
   * Track file upload performance
   */
  public trackFileUpload(fileSize: number, fileType: string): string {
    return this.startOperation('file_upload', 'upload', {
      fileSize,
      fileType,
    });
  }

  /**
   * Track search query performance
   */
  public trackSearchQuery(queryLength: number, filterCount?: number): string {
    return this.startOperation('search_query', 'search', {
      queryLength,
      filterCount,
    });
  }

  /**
   * Track UI interaction performance
   */
  public trackUIInteraction(interactionType: string, componentName?: string): string {
    return this.startOperation('ui_interaction', 'ui', {
      interactionType,
      componentName,
    });
  }

  /**
   * Track database query performance
   */
  public trackDatabaseQuery(queryType: string, recordCount?: number): string {
    return this.startOperation('database_query', 'database', {
      queryType,
      recordCount,
    });
  }

  /**
   * Get performance report
   */
  public getPerformanceReport(timeRange?: { start: number; end: number }): PerformanceReport {
    let metricsToAnalyze = this.metrics;

    // Filter by time range if provided
    if (timeRange) {
      metricsToAnalyze = this.metrics.filter(
        m => m.startTime >= timeRange.start && m.startTime <= timeRange.end
      );
    }

    const totalOperations = metricsToAnalyze.length;
    const successfulOperations = metricsToAnalyze.filter(m => m.success);
    const failedOperations = metricsToAnalyze.filter(m => !m.success);

    const totalDuration = metricsToAnalyze.reduce((sum, m) => sum + (m.duration || 0), 0);
    const averageDuration = totalOperations > 0 ? totalDuration / totalOperations : 0;
    const successRate = totalOperations > 0 ? (successfulOperations.length / totalOperations) * 100 : 0;

    // Get slowest operations
    const slowestOperations = metricsToAnalyze
      .filter(m => m.duration)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 10);

    // Category breakdown
    const categoryBreakdown: Record<string, any> = {};
    metricsToAnalyze.forEach(metric => {
      if (!categoryBreakdown[metric.category]) {
        categoryBreakdown[metric.category] = {
          count: 0,
          totalDuration: 0,
          successCount: 0,
        };
      }
      
      categoryBreakdown[metric.category].count++;
      categoryBreakdown[metric.category].totalDuration += metric.duration || 0;
      if (metric.success) {
        categoryBreakdown[metric.category].successCount++;
      }
    });

    // Calculate averages and success rates for categories
    Object.keys(categoryBreakdown).forEach(category => {
      const data = categoryBreakdown[category];
      data.averageDuration = data.count > 0 ? data.totalDuration / data.count : 0;
      data.successRate = data.count > 0 ? (data.successCount / data.count) * 100 : 0;
      delete data.totalDuration;
      delete data.successCount;
    });

    // Generate recommendations
    const recommendations = this.generateRecommendations(metricsToAnalyze);

    return {
      totalOperations,
      averageDuration,
      successRate,
      slowestOperations,
      failedOperations,
      categoryBreakdown,
      recommendations,
    };
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(metrics: PerformanceMetric[]): string[] {
    const recommendations: string[] = [];

    // Check for slow operations
    const slowOperations = metrics.filter(m => {
      const benchmark = this.benchmarks.find(b => b.name === m.name);
      return benchmark && m.duration && m.duration > benchmark.warningThreshold;
    });

    if (slowOperations.length > metrics.length * 0.1) {
      recommendations.push('Consider optimizing slow operations - more than 10% of operations are exceeding performance thresholds');
    }

    // Check for high failure rates
    const failureRate = metrics.filter(m => !m.success).length / metrics.length;
    if (failureRate > 0.05) {
      recommendations.push('High failure rate detected - investigate error handling and retry mechanisms');
    }

    // Check for memory usage trends
    if (this.memoryUsageHistory.length > 10) {
      const recentUsage = this.memoryUsageHistory.slice(-10);
      const trend = recentUsage[recentUsage.length - 1].percentage - recentUsage[0].percentage;
      if (trend > 10) {
        recommendations.push('Memory usage is trending upward - check for memory leaks');
      }
    }

    // Category-specific recommendations
    const categoryStats = this.getCategoryStats(metrics);
    Object.entries(categoryStats).forEach(([category, stats]) => {
      if (stats.averageDuration > 5000) {
        recommendations.push(`${category} operations are taking longer than expected - consider optimization`);
      }
      if (stats.successRate < 95) {
        recommendations.push(`${category} operations have low success rate - investigate error causes`);
      }
    });

    return recommendations;
  }

  /**
   * Get category statistics
   */
  private getCategoryStats(metrics: PerformanceMetric[]): Record<string, { averageDuration: number; successRate: number }> {
    const stats: Record<string, { totalDuration: number; count: number; successCount: number }> = {};

    metrics.forEach(metric => {
      if (!stats[metric.category]) {
        stats[metric.category] = { totalDuration: 0, count: 0, successCount: 0 };
      }
      stats[metric.category].totalDuration += metric.duration || 0;
      stats[metric.category].count++;
      if (metric.success) {
        stats[metric.category].successCount++;
      }
    });

    const result: Record<string, { averageDuration: number; successRate: number }> = {};
    Object.entries(stats).forEach(([category, data]) => {
      result[category] = {
        averageDuration: data.count > 0 ? data.totalDuration / data.count : 0,
        successRate: data.count > 0 ? (data.successCount / data.count) * 100 : 0,
      };
    });

    return result;
  }

  /**
   * Get memory usage history
   */
  public getMemoryUsageHistory(): MemoryUsage[] {
    return [...this.memoryUsageHistory];
  }

  /**
   * Clear performance metrics
   */
  public clearMetrics(): void {
    this.metrics = [];
    this.activeOperations.clear();
    this.memoryUsageHistory = [];
  }

  /**
   * Enable/disable performance monitoring
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Check if performance monitoring is enabled
   */
  public isMonitoringEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Add custom benchmark
   */
  public addBenchmark(benchmark: PerformanceBenchmark): void {
    const existingIndex = this.benchmarks.findIndex(b => b.name === benchmark.name);
    if (existingIndex >= 0) {
      this.benchmarks[existingIndex] = benchmark;
    } else {
      this.benchmarks.push(benchmark);
    }
  }

  /**
   * Get all benchmarks
   */
  public getBenchmarks(): PerformanceBenchmark[] {
    return [...this.benchmarks];
  }

  /**
   * Get recent metrics
   */
  public getRecentMetrics(limit: number = 50): PerformanceMetric[] {
    return this.metrics.slice(-limit);
  }
}

// Export singleton instance
export const performanceMonitoringService = new PerformanceMonitoringService();

// Export convenience functions
export const startOperation = (name: string, category: PerformanceMetric['category'], metadata?: Record<string, any>): string =>
  performanceMonitoringService.startOperation(name, category, metadata);

export const completeOperation = (id: string, success?: boolean, metadata?: Record<string, any>): void =>
  performanceMonitoringService.completeOperation(id, success, metadata);

export const trackOCRProcessing = (fileSize: number, fileType: string): string =>
  performanceMonitoringService.trackOCRProcessing(fileSize, fileType);

export const trackAIMetadataGeneration = (textLength: number, model?: string): string =>
  performanceMonitoringService.trackAIMetadataGeneration(textLength, model);

export const trackFileUpload = (fileSize: number, fileType: string): string =>
  performanceMonitoringService.trackFileUpload(fileSize, fileType);

export const trackSearchQuery = (queryLength: number, filterCount?: number): string =>
  performanceMonitoringService.trackSearchQuery(queryLength, filterCount);

export const trackUIInteraction = (interactionType: string, componentName?: string): string =>
  performanceMonitoringService.trackUIInteraction(interactionType, componentName);

export const trackDatabaseQuery = (queryType: string, recordCount?: number): string =>
  performanceMonitoringService.trackDatabaseQuery(queryType, recordCount);

export const getPerformanceReport = (timeRange?: { start: number; end: number }): PerformanceReport =>
  performanceMonitoringService.getPerformanceReport(timeRange);

export const clearMetrics = (): void => performanceMonitoringService.clearMetrics();

export default performanceMonitoringService; 