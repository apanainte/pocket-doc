import { useState, useEffect } from 'react';
import { Document } from '@/types/document';
import { databaseService } from '@/services/database';
import { fileStorageService } from '@/services/fileStorage';
import ValidationService from '@/services/validation';

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize services and load documents
  useEffect(() => {
    const initializeServices = async () => {
      try {
        setLoading(true);
        await databaseService.initialize();
        await fileStorageService.initialize();
        const loadedDocuments = await databaseService.getAllDocuments();
        setDocuments(loadedDocuments);
        setInitialized(true);
      } catch (err) {
        console.error('Failed to initialize services:', err);
        setError('Failed to initialize document storage');
      } finally {
        setLoading(false);
      }
    };

    initializeServices();
  }, []);

  const addDocument = async (document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>, sourceUri?: string) => {
    if (!initialized) {
      throw new Error('Document storage not initialized');
    }

    setLoading(true);
    setError(null);
    
    try {
      // Validate document data
      const validation = ValidationService.validateDocument(
        document.title,
        document.description,
        document.tags.join(', ')
      );

      const validationError = ValidationService.formatValidationError(validation);
      if (validationError) {
        throw new Error(validationError);
      }

      // Use sanitized values
      const sanitizedDocument = {
        ...document,
        title: validation.title.sanitized || document.title,
        description: validation.description.sanitized || document.description,
        tags: validation.tags.sanitized?.split(', ').map(tag => tag.trim()) || document.tags
      };

      // Store file if source URI is provided
      let finalDocument = sanitizedDocument;
      if (sourceUri) {
        // Generate a temporary ID for file storage
        const tempId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Validate file type
        const fileValidation = ValidationService.validateFileType(sourceUri, [document.type]);
        if (!fileValidation.isValid) {
          throw new Error(fileValidation.error);
        }

        // Store the file
        const fileResult = await fileStorageService.storeFile(sourceUri, tempId, document.type);
        
        finalDocument = {
          ...sanitizedDocument,
          uri: fileResult.storedUri,
          thumbnail: fileResult.thumbnailUri || sanitizedDocument.thumbnail,
          fileSize: fileResult.fileSize
        };
      }

      // Save to database
      const newDocument = await databaseService.addDocument(finalDocument);
      
      // Update local state
      setDocuments((prev: Document[]) => [newDocument, ...prev]);
      return newDocument;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add document';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateDocument = async (id: string, updates: Partial<Document>) => {
    if (!initialized) {
      throw new Error('Document storage not initialized');
    }

    setLoading(true);
    setError(null);
    
    try {
      // Validate updates if they contain user input
      if (updates.title || updates.description || updates.tags) {
        const currentDoc = documents.find(doc => doc.id === id);
        if (!currentDoc) {
          throw new Error('Document not found');
        }

        const validation = ValidationService.validateDocument(
          updates.title || currentDoc.title,
          updates.description || currentDoc.description,
          (updates.tags || currentDoc.tags).join(', ')
        );

        const validationError = ValidationService.formatValidationError(validation);
        if (validationError) {
          throw new Error(validationError);
        }

        // Use sanitized values
        updates = {
          ...updates,
          title: validation.title.sanitized || updates.title,
          description: validation.description.sanitized || updates.description,
          tags: validation.tags.sanitized?.split(', ').map(tag => tag.trim()) || updates.tags
        };
      }

      // Update in database
      await databaseService.updateDocument(id, updates);
      
      // Update local state
      setDocuments((prev: Document[]) => 
        prev.map((doc: Document) => 
          doc.id === id 
            ? { ...doc, ...updates, updatedAt: new Date() }
            : doc
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update document';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (id: string) => {
    if (!initialized) {
      throw new Error('Document storage not initialized');
    }

    setLoading(true);
    setError(null);
    
    try {
      // Find document to delete its files
      const documentToDelete = documents.find((doc: Document) => doc.id === id);
      
      // Delete from database first
      await databaseService.deleteDocument(id);
      
      // Delete files if document exists
      if (documentToDelete) {
        await fileStorageService.deleteDocumentFiles(documentToDelete);
      }
      
      // Update local state
      setDocuments((prev: Document[]) => prev.filter((doc: Document) => doc.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete document';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const searchDocuments = (query: string) => {
    if (!query.trim()) return documents;
    
    try {
      // Use database search for better performance and relevance ranking
      return databaseService.searchDocuments(query);
    } catch (err) {
      console.error('Database search failed, falling back to local search:', err);
      
      // Fallback to local search
      const lowercaseQuery = query.toLowerCase();
      return documents.filter((doc: Document) => 
        doc.title.toLowerCase().includes(lowercaseQuery) ||
        doc.description.toLowerCase().includes(lowercaseQuery) ||
        doc.tags.some((tag: string) => tag.toLowerCase().includes(lowercaseQuery))
      );
    }
  };

  return {
    documents,
    loading,
    error,
    addDocument,
    updateDocument,
    deleteDocument,
    searchDocuments
  };
}