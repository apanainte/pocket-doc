import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Document } from '@/types/document';

export class FileStorageService {
  private documentsDirectory: string;

  constructor() {
    this.documentsDirectory = `${FileSystem.documentDirectory}documents/`;
  }

  async initialize(): Promise<void> {
    try {
      // Create documents directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(this.documentsDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.documentsDirectory, { intermediates: true });
      }
    } catch (error) {
      console.error('Failed to initialize file storage:', error);
      throw new Error('File storage initialization failed');
    }
  }

  async storeFile(sourceUri: string, documentId: string, fileType: 'image' | 'pdf'): Promise<{
    storedUri: string;
    thumbnailUri?: string;
    fileSize: number;
  }> {
    try {
      // Generate unique filename with proper extension
      const extension = fileType === 'pdf' ? 'pdf' : this.getImageExtension(sourceUri);
      const fileName = `${documentId}.${extension}`;
      const destinationUri = `${this.documentsDirectory}${fileName}`;

      // Validate file exists and get info
      const fileInfo = await FileSystem.getInfoAsync(sourceUri);
      if (!fileInfo.exists) {
        throw new Error('Source file does not exist');
      }

      // Copy file to documents directory
      await FileSystem.copyAsync({
        from: sourceUri,
        to: destinationUri
      });

      // Get final file info
      const storedFileInfo = await FileSystem.getInfoAsync(destinationUri);
      const fileSize = (storedFileInfo.exists && 'size' in storedFileInfo) ? storedFileInfo.size || 0 : 0;

      // Create thumbnail for images
      let thumbnailUri: string | undefined;
      if (fileType === 'image') {
        thumbnailUri = await this.createThumbnail(destinationUri, documentId);
      }

      return {
        storedUri: destinationUri,
        thumbnailUri,
        fileSize
      };
    } catch (error) {
      console.error('Failed to store file:', error);
      throw new Error(`Failed to store ${fileType} file`);
    }
  }

  private async createThumbnail(imageUri: string, documentId: string): Promise<string> {
    try {
      // Create thumbnails directory if it doesn't exist
      const thumbnailsDir = `${this.documentsDirectory}thumbnails/`;
      const dirInfo = await FileSystem.getInfoAsync(thumbnailsDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(thumbnailsDir, { intermediates: true });
      }

      // Generate thumbnail using expo-image-manipulator
      const thumbnailFileName = `${documentId}_thumb.jpg`;
      const thumbnailUri = `${thumbnailsDir}${thumbnailFileName}`;
      
      // Resize image to create thumbnail (300x300 max, maintaining aspect ratio)
      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 300, height: 300 } }],
        { 
          compress: 0.8, 
          format: ImageManipulator.SaveFormat.JPEG,
          base64: false 
        }
      );

      // Move the manipulated image to our thumbnails directory
      await FileSystem.moveAsync({
        from: manipResult.uri,
        to: thumbnailUri
      });

      return thumbnailUri;
    } catch (error) {
      console.error('Failed to create thumbnail:', error);
      // Return original image if thumbnail creation fails
      return imageUri;
    }
  }

  private getImageExtension(uri: string): string {
    const extension = uri.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension || '')) {
      return extension || 'jpg';
    }
    return 'jpg'; // Default to jpg
  }

  async deleteFile(uri: string): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(uri);
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
      // Don't throw error for file deletion failures
    }
  }

  async deleteDocumentFiles(document: Document): Promise<void> {
    try {
      // Delete main file
      if (document.uri.startsWith(this.documentsDirectory)) {
        await this.deleteFile(document.uri);
      }

      // Delete thumbnail if it exists
      if (document.thumbnail && document.thumbnail.startsWith(this.documentsDirectory)) {
        await this.deleteFile(document.thumbnail);
      }
    } catch (error) {
      console.error('Failed to delete document files:', error);
    }
  }

  // Check if a thumbnail file exists and is accessible
  async validateThumbnailPath(thumbnailPath: string): Promise<boolean> {
    try {
      if (!thumbnailPath) return false;
      const fileInfo = await FileSystem.getInfoAsync(thumbnailPath);
      return fileInfo.exists;
    } catch (error) {
      return false;
    }
  }

  // Get the expected thumbnail path for a document ID
  getExpectedThumbnailPath(documentId: string): string {
    return `${this.documentsDirectory}thumbnails/${documentId}_thumb.jpg`;
  }

  // Regenerate thumbnail from main document file
  async regenerateThumbnail(documentUri: string, documentId: string): Promise<string | null> {
    try {
      // Check if main document file exists
      const mainFileExists = await FileSystem.getInfoAsync(documentUri);
      if (!mainFileExists.exists) {
        console.warn('Cannot regenerate thumbnail: main file does not exist:', documentUri);
        return null;
      }

      // Only regenerate for image types
      if (!documentUri.toLowerCase().match(/\.(jpg|jpeg|png)$/)) {
        return null;
      }

      console.log('Regenerating thumbnail for:', documentId);
      return await this.createThumbnail(documentUri, documentId);
    } catch (error) {
      console.error('Failed to regenerate thumbnail:', error);
      return null;
    }
  }

  // Get current directories for diagnostics
  getCurrentDocumentsDirectory(): string {
    return this.documentsDirectory;
  }

  getCurrentThumbnailsDirectory(): string {
    return `${this.documentsDirectory}thumbnails/`;
  }

  async validateFileSize(uri: string, maxSizeMB: number = 10): Promise<boolean> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists || !fileInfo.size) {
        return false;
      }

      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      return fileInfo.size <= maxSizeBytes;
    } catch (error) {
      console.error('Failed to validate file size:', error);
      return false;
    }
  }

  async getStorageInfo(): Promise<{
    totalSpace?: number;
    freeSpace?: number;
    usedSpace: number;
  }> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.documentsDirectory);
      let usedSpace = 0;

      if (dirInfo.exists) {
        // Calculate used space by documents
        const files = await FileSystem.readDirectoryAsync(this.documentsDirectory);
        for (const file of files) {
          const filePath = `${this.documentsDirectory}${file}`;
          const fileInfo = await FileSystem.getInfoAsync(filePath);
          if (fileInfo.exists && 'size' in fileInfo && fileInfo.size) {
            usedSpace += fileInfo.size;
          }
        }
      }

      return {
        totalSpace: undefined, // Not available in Expo FileSystem
        freeSpace: undefined,  // Not available in Expo FileSystem
        usedSpace
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return { usedSpace: 0 };
    }
  }
}

// Singleton instance
export const fileStorageService = new FileStorageService(); 