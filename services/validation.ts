export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitized?: string;
}

export interface DocumentValidation {
  title: ValidationResult;
  description: ValidationResult;
  tags: ValidationResult;
}

export class ValidationService {
  // Constants for validation limits
  private static readonly TITLE_MIN_LENGTH = 1;
  private static readonly TITLE_MAX_LENGTH = 100;
  private static readonly DESCRIPTION_MAX_LENGTH = 500;
  private static readonly TAG_MIN_LENGTH = 1;
  private static readonly TAG_MAX_LENGTH = 30;
  private static readonly MAX_TAGS = 10;
  private static readonly MAX_FILE_SIZE_MB = 10;

  // Dangerous patterns to prevent XSS and injection attacks
  private static readonly DANGEROUS_PATTERNS = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload/gi,
    /onerror/gi,
    /onclick/gi,
    /onmouseover/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>.*?<\/embed>/gi,
    /data:text\/html/gi,
  ];

  static validateTitle(title: string): ValidationResult {
    if (!title || typeof title !== 'string') {
      return { isValid: false, error: 'Title is required' };
    }

    const trimmed = title.trim();
    
    if (trimmed.length < this.TITLE_MIN_LENGTH) {
      return { isValid: false, error: 'Title cannot be empty' };
    }

    if (trimmed.length > this.TITLE_MAX_LENGTH) {
      return { 
        isValid: false, 
        error: `Title must be ${this.TITLE_MAX_LENGTH} characters or less` 
      };
    }

    // Check for dangerous patterns
    const dangerousPattern = this.DANGEROUS_PATTERNS.find(pattern => pattern.test(trimmed));
    if (dangerousPattern) {
      return { isValid: false, error: 'Title contains invalid characters' };
    }

    // Sanitize by removing any HTML tags and special characters
    const sanitized = this.sanitizeText(trimmed);

    return { isValid: true, sanitized };
  }

  static validateDescription(description: string): ValidationResult {
    if (!description || typeof description !== 'string') {
      return { isValid: false, error: 'Description is required' };
    }

    const trimmed = description.trim();
    
    if (trimmed.length === 0) {
      return { isValid: false, error: 'Description cannot be empty' };
    }

    if (trimmed.length > this.DESCRIPTION_MAX_LENGTH) {
      return { 
        isValid: false, 
        error: `Description must be ${this.DESCRIPTION_MAX_LENGTH} characters or less` 
      };
    }

    // Check for dangerous patterns
    const dangerousPattern = this.DANGEROUS_PATTERNS.find(pattern => pattern.test(trimmed));
    if (dangerousPattern) {
      return { isValid: false, error: 'Description contains invalid characters' };
    }

    const sanitized = this.sanitizeText(trimmed);

    return { isValid: true, sanitized };
  }

  static validateTags(tagsInput: string): ValidationResult {
    if (!tagsInput || typeof tagsInput !== 'string') {
      return { isValid: false, error: 'Tags are required' };
    }

    const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    
    if (tags.length === 0) {
      return { isValid: false, error: 'At least one tag is required' };
    }

    if (tags.length > this.MAX_TAGS) {
      return { 
        isValid: false, 
        error: `Maximum ${this.MAX_TAGS} tags allowed` 
      };
    }

    // Validate each tag
    for (const tag of tags) {
      if (tag.length < this.TAG_MIN_LENGTH) {
        return { isValid: false, error: 'Tags cannot be empty' };
      }

      if (tag.length > this.TAG_MAX_LENGTH) {
        return { 
          isValid: false, 
          error: `Each tag must be ${this.TAG_MAX_LENGTH} characters or less` 
        };
      }

      // Check for dangerous patterns in tags
      const dangerousPattern = this.DANGEROUS_PATTERNS.find(pattern => pattern.test(tag));
      if (dangerousPattern) {
        return { isValid: false, error: 'Tags contain invalid characters' };
      }

      // Tags should only contain alphanumeric characters, spaces, hyphens, and underscores
      if (!/^[a-zA-Z0-9\s\-_]+$/.test(tag)) {
        return { 
          isValid: false, 
          error: 'Tags can only contain letters, numbers, spaces, hyphens, and underscores' 
        };
      }
    }

    // Sanitize and normalize tags
    const sanitizedTags = tags.map(tag => this.sanitizeText(tag).toLowerCase());
    
    // Remove duplicates
    const uniqueTags = Array.from(new Set(sanitizedTags));

    return { isValid: true, sanitized: uniqueTags.join(', ') };
  }

  static validateDocument(title: string, description: string, tags: string): DocumentValidation {
    return {
      title: this.validateTitle(title),
      description: this.validateDescription(description),
      tags: this.validateTags(tags)
    };
  }

  static validateFileType(uri: string, allowedTypes: ('image' | 'pdf')[]): ValidationResult {
    if (!uri || typeof uri !== 'string') {
      return { isValid: false, error: 'File URI is required' };
    }

    const extension = uri.split('.').pop()?.toLowerCase();
    
    if (!extension) {
      return { isValid: false, error: 'File must have an extension' };
    }

    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    const pdfExtensions = ['pdf'];

    let isValidType = false;
    
    if (allowedTypes.includes('image') && imageExtensions.includes(extension)) {
      isValidType = true;
    }
    
    if (allowedTypes.includes('pdf') && pdfExtensions.includes(extension)) {
      isValidType = true;
    }

    if (!isValidType) {
      const allowedExtensions = [];
      if (allowedTypes.includes('image')) allowedExtensions.push(...imageExtensions);
      if (allowedTypes.includes('pdf')) allowedExtensions.push(...pdfExtensions);
      
      return { 
        isValid: false, 
        error: `File type not supported. Allowed types: ${allowedExtensions.join(', ')}` 
      };
    }

    return { isValid: true };
  }

  static async validateFileSize(uri: string, maxSizeMB: number = this.MAX_FILE_SIZE_MB): Promise<ValidationResult> {
    try {
      // This will be implemented with the FileSystem API
      // For now, return valid for any file
      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Failed to validate file size' };
    }
  }

  private static sanitizeText(text: string): string {
    // Remove HTML tags
    let sanitized = text.replace(/<[^>]*>/g, '');
    
    // Remove dangerous patterns
    this.DANGEROUS_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    // Trim whitespace
    sanitized = sanitized.trim();

    // Replace multiple consecutive spaces with single space
    sanitized = sanitized.replace(/\s+/g, ' ');

    return sanitized;
  }

  static getValidationLimits() {
    return {
      titleMinLength: this.TITLE_MIN_LENGTH,
      titleMaxLength: this.TITLE_MAX_LENGTH,
      descriptionMaxLength: this.DESCRIPTION_MAX_LENGTH,
      tagMinLength: this.TAG_MIN_LENGTH,
      tagMaxLength: this.TAG_MAX_LENGTH,
      maxTags: this.MAX_TAGS,
      maxFileSizeMB: this.MAX_FILE_SIZE_MB
    };
  }

  static formatValidationError(validation: DocumentValidation): string | null {
    const errors = [];
    
    if (!validation.title.isValid) errors.push(validation.title.error);
    if (!validation.description.isValid) errors.push(validation.description.error);
    if (!validation.tags.isValid) errors.push(validation.tags.error);

    return errors.length > 0 ? errors.join('\n') : null;
  }
}

export default ValidationService; 