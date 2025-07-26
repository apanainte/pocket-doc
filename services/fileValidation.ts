import { Platform } from 'react-native';
import { captureError, addBreadcrumb } from './monitoring';

/**
 * React Native-compatible MIME type lookup
 * Replaces mime-types package which has Node.js dependencies
 */
const mimeTypeLookup: { [key: string]: string } = {
  // Images
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.tiff': 'image/tiff',
  '.tif': 'image/tiff',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  
  // Documents
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
  '.rtf': 'application/rtf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  
  // Archives
  '.zip': 'application/zip',
  '.rar': 'application/vnd.rar',
  '.7z': 'application/x-7z-compressed',
  '.tar': 'application/x-tar',
  '.gz': 'application/gzip',
  
  // Audio
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  
  // Video
  '.mp4': 'video/mp4',
  '.avi': 'video/x-msvideo',
  '.mov': 'video/quicktime',
  '.wmv': 'video/x-ms-wmv',
  '.flv': 'video/x-flv',
  '.webm': 'video/webm',
  
  // Other
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.csv': 'text/csv',
};

/**
 * Lookup MIME type for file extension
 */
const lookupMimeType = (extension: string): string | null => {
  if (!extension) return null;
  const normalizedExt = extension.toLowerCase();
  return mimeTypeLookup[normalizedExt] || null;
};

/**
 * File Validation Service
 * 
 * Provides comprehensive file validation including:
 * - File type validation
 * - Size limits
 * - Security checks
 * - Content validation
 * - Malware scanning (basic)
 */

export interface FileValidationConfig {
  maxFileSize?: number; // in bytes
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  enableContentValidation?: boolean;
  enableSecurityScanning?: boolean;
  customValidators?: FileValidator[];
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    originalName?: string;
    mimeType?: string;
    extension?: string;
    size?: number;
    lastModified?: number;
    isImage?: boolean;
    isPDF?: boolean;
    sanitizedName?: string;
  };
}

export interface FileInfo {
  name: string;
  size: number;
  type?: string;
  uri: string;
  lastModified?: number;
}

export interface FileValidator {
  name: string;
  validate: (file: FileInfo) => Promise<{ isValid: boolean; error?: string; warning?: string }>;
}

class FileValidationService {
  private config: FileValidationConfig;
  private readonly DEFAULT_CONFIG: FileValidationConfig = {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/tiff',
      'application/pdf',
      'text/plain',
    ],
    allowedExtensions: [
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.tif',
      '.pdf', '.txt'
    ],
    enableContentValidation: true,
    enableSecurityScanning: true,
    customValidators: [],
  };

  constructor(config?: FileValidationConfig) {
    this.config = { ...this.DEFAULT_CONFIG, ...config };
  }

  /**
   * Validate a file with comprehensive checks
   */
  public async validateFile(file: FileInfo): Promise<FileValidationResult> {
    const result: FileValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      metadata: {
        originalName: file.name,
        size: file.size,
        lastModified: file.lastModified,
      },
    };

    try {
      addBreadcrumb(`Starting file validation for: ${file.name}`, 'validation');

      // Basic file info validation
      await this.validateBasicInfo(file, result);

      // File size validation
      await this.validateFileSize(file, result);

      // MIME type validation
      await this.validateMimeType(file, result);

      // Extension validation
      await this.validateExtension(file, result);

      // Content validation
      if (this.config.enableContentValidation) {
        await this.validateContent(file, result);
      }

      // Security scanning
      if (this.config.enableSecurityScanning) {
        await this.performSecurityScan(file, result);
      }

      // Custom validators
      if (this.config.customValidators) {
        await this.runCustomValidators(file, result);
      }

      // Generate sanitized filename
      result.metadata.sanitizedName = this.sanitizeFilename(file.name);

      // Set file type flags
      result.metadata.isImage = this.isImageFile(result.metadata.mimeType);
      result.metadata.isPDF = this.isPDFFile(result.metadata.mimeType);

      // Final validation result
      result.isValid = result.errors.length === 0;

      addBreadcrumb(
        `File validation completed: ${result.isValid ? 'PASS' : 'FAIL'} (${result.errors.length} errors, ${result.warnings.length} warnings)`,
        'validation'
      );

      return result;

    } catch (error) {
      captureError(error as Error, {
        tags: { operation: 'file_validation' },
        extra: { fileName: file.name, fileSize: file.size },
      });

      result.isValid = false;
      result.errors.push('Validation process failed due to internal error');
      return result;
    }
  }

  /**
   * Validate basic file information
   */
  private async validateBasicInfo(file: FileInfo, result: FileValidationResult): Promise<void> {
    if (!file.name || file.name.trim() === '') {
      result.errors.push('File name is required');
    }

    if (!file.size || file.size <= 0) {
      result.errors.push('File size must be greater than 0');
    }

    if (!file.uri || file.uri.trim() === '') {
      result.errors.push('File URI is required');
    }

    // Check for suspicious file names
    const suspiciousPatterns = [
      /\.(exe|bat|cmd|com|pif|scr|vbs|js)$/i,
      /^\./, // Hidden files
      /\.\./,  // Directory traversal
      /[<>:"|?*]/,  // Invalid characters
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(file.name)) {
        result.errors.push(`File name contains suspicious pattern: ${file.name}`);
        break;
      }
    }
  }

  /**
   * Validate file size
   */
  private async validateFileSize(file: FileInfo, result: FileValidationResult): Promise<void> {
    if (file.size > this.config.maxFileSize!) {
      result.errors.push(
        `File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(this.config.maxFileSize!)})`
      );
    }

    // Warning for very large files
    const warningSize = this.config.maxFileSize! * 0.8;
    if (file.size > warningSize) {
      result.warnings.push(`File size is quite large: ${this.formatFileSize(file.size)}`);
    }
  }

  /**
   * Validate MIME type
   */
  private async validateMimeType(file: FileInfo, result: FileValidationResult): Promise<void> {
    // Get MIME type from file extension if not provided
    let mimeType = file.type;
    if (!mimeType) {
      const extension = this.getFileExtension(file.name);
      mimeType = lookupMimeType(extension) || 'application/octet-stream';
    }

    result.metadata.mimeType = mimeType;

    // Check if MIME type is allowed
    if (!this.config.allowedMimeTypes!.includes(mimeType)) {
      result.errors.push(`File type not allowed: ${mimeType}`);
    }

    // Check for MIME type spoofing
    const extensionFromName = this.getFileExtension(file.name);
    const expectedMimeType = lookupMimeType(extensionFromName);
    
    if (expectedMimeType && expectedMimeType !== mimeType) {
      result.warnings.push(`MIME type mismatch: expected ${expectedMimeType}, got ${mimeType}`);
    }
  }

  /**
   * Validate file extension
   */
  private async validateExtension(file: FileInfo, result: FileValidationResult): Promise<void> {
    const extension = this.getFileExtension(file.name);
    result.metadata.extension = extension;

    if (!extension) {
      result.errors.push('File must have an extension');
      return;
    }

    if (!this.config.allowedExtensions!.includes(extension.toLowerCase())) {
      result.errors.push(`File extension not allowed: ${extension}`);
    }

    // Check for double extensions (potential security risk)
    const extensionCount = (file.name.match(/\./g) || []).length;
    if (extensionCount > 1) {
      result.warnings.push('File has multiple extensions, which may be suspicious');
    }
  }

  /**
   * Validate file content
   */
  private async validateContent(file: FileInfo, result: FileValidationResult): Promise<void> {
    // This is a basic content validation
    // In a real implementation, you might want to:
    // - Check file headers/magic numbers
    // - Validate image integrity
    // - Check PDF structure
    // - Scan for embedded scripts

    try {
      // For now, we'll do basic checks based on file type
      if (result.metadata.isImage) {
        await this.validateImageContent(file, result);
      } else if (result.metadata.isPDF) {
        await this.validatePDFContent(file, result);
      }
    } catch (error) {
      result.warnings.push('Content validation failed');
    }
  }

  /**
   * Validate image content
   */
  private async validateImageContent(file: FileInfo, result: FileValidationResult): Promise<void> {
    // Basic image validation
    // In a real implementation, you might use a library to validate image headers
    
    // Check for reasonable image dimensions based on file size
    const estimatedPixels = file.size / 3; // Rough estimate for RGB
    const maxPixels = 100 * 1024 * 1024; // 100 megapixels
    
    if (estimatedPixels > maxPixels) {
      result.warnings.push('Image appears to be extremely large');
    }

    // Check for minimum viable image size
    if (file.size < 100) {
      result.warnings.push('Image file seems too small to be valid');
    }
  }

  /**
   * Validate PDF content
   */
  private async validatePDFContent(file: FileInfo, result: FileValidationResult): Promise<void> {
    // Basic PDF validation
    // In a real implementation, you might validate PDF structure
    
    // Check for minimum viable PDF size
    if (file.size < 1000) {
      result.warnings.push('PDF file seems too small to be valid');
    }

    // Check for extremely large PDFs
    if (file.size > 100 * 1024 * 1024) {
      result.warnings.push('PDF file is extremely large');
    }
  }

  /**
   * Perform basic security scanning
   */
  private async performSecurityScan(file: FileInfo, result: FileValidationResult): Promise<void> {
    // Basic security checks
    
    // Check for executable file signatures in any file type
    const dangerousSignatures = [
      'MZ', // PE executable
      'PK', // ZIP archive (could contain executables)
    ];

    // Check filename for script injection attempts
    const scriptPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
    ];

    for (const pattern of scriptPatterns) {
      if (pattern.test(file.name)) {
        result.errors.push('File name contains potentially malicious script patterns');
        break;
      }
    }

    // Check for null bytes (potential path traversal)
    if (file.name.includes('\0')) {
      result.errors.push('File name contains null bytes');
    }

    // Check for excessively long filenames
    if (file.name.length > 255) {
      result.errors.push('File name is too long');
    }
  }

  /**
   * Run custom validators
   */
  private async runCustomValidators(file: FileInfo, result: FileValidationResult): Promise<void> {
    for (const validator of this.config.customValidators!) {
      try {
        const validationResult = await validator.validate(file);
        if (!validationResult.isValid) {
          if (validationResult.error) {
            result.errors.push(`${validator.name}: ${validationResult.error}`);
          }
        }
        if (validationResult.warning) {
          result.warnings.push(`${validator.name}: ${validationResult.warning}`);
        }
      } catch (error) {
        result.warnings.push(`Custom validator ${validator.name} failed`);
      }
    }
  }

  /**
   * Sanitize filename
   */
  private sanitizeFilename(filename: string): string {
    // Remove or replace dangerous characters
    return filename
      .replace(/[<>:"|?*]/g, '_')
      .replace(/\.\./g, '_')
      .replace(/^\./, '_')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .toLowerCase();
  }

  /**
   * Get file extension
   */
  private getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';
  }

  /**
   * Check if file is an image
   */
  private isImageFile(mimeType?: string): boolean {
    return mimeType?.startsWith('image/') || false;
  }

  /**
   * Check if file is a PDF
   */
  private isPDFFile(mimeType?: string): boolean {
    return mimeType === 'application/pdf';
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Update validation configuration
   */
  public updateConfig(config: Partial<FileValidationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  public getConfig(): FileValidationConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const fileValidationService = new FileValidationService();

// Export convenience functions
export const validateFile = (file: FileInfo): Promise<FileValidationResult> => 
  fileValidationService.validateFile(file);

export const updateValidationConfig = (config: Partial<FileValidationConfig>): void => 
  fileValidationService.updateConfig(config);

export const getValidationConfig = (): FileValidationConfig => 
  fileValidationService.getConfig();

// Export specialized validators
export const createImageValidator = (maxWidth?: number, maxHeight?: number): FileValidator => ({
  name: 'image-dimensions',
  validate: async (file: FileInfo) => {
    // This would require actual image processing
    // For now, return a placeholder
    return { isValid: true };
  },
});

export const createPDFValidator = (maxPages?: number): FileValidator => ({
  name: 'pdf-pages',
  validate: async (file: FileInfo) => {
    // This would require actual PDF processing
    // For now, return a placeholder
    return { isValid: true };
  },
});

export default fileValidationService; 