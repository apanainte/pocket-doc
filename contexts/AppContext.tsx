import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Document } from '@/types/document';
import { databaseService } from '@/services/database'; // Use singleton instead of new instance
import { AuthService } from '@/services/auth';
import { Alert } from 'react-native';

interface AppState {
  documents: Document[];
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface AppContextType extends AppState {
  // Document operations
  addDocument: (document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateDocument: (id: string, updates: Partial<Document>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  searchDocuments: (query: string) => Document[];
  filterDocuments: (tags: string[]) => Document[];
  
  // Authentication
  authenticate: () => Promise<boolean>;
  logout: () => Promise<void>;
  
  // Error handling
  clearError: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    documents: [],
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  const authService = new AuthService(); // Only auth service needs new instance

  // Initialize app
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // Database should already be initialized by root layout, but ensure it's ready
      await databaseService.initialize();
      
      // Check authentication status
      const isAuthenticated = await authService.isAuthenticated();
      
      if (isAuthenticated) {
        // Load documents if authenticated
        const documents = await databaseService.getAllDocuments();
        setState(prev => ({
          ...prev,
          documents,
          isAuthenticated: true,
          isLoading: false,
        }));
      } else {
        setState(prev => ({
          ...prev,
          isAuthenticated: false,
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error('App initialization error:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to initialize app',
        isLoading: false,
      }));
    }
  };

  const addDocument = async (document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const newDocument = await databaseService.addDocument(document);
      setState(prev => ({
        ...prev,
        documents: [newDocument, ...prev.documents],
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to add document',
        isLoading: false,
      }));
      throw error;
    }
  };

  const updateDocument = async (id: string, updates: Partial<Document>) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      await databaseService.updateDocument(id, updates);
      
      // Refresh the document from database to get updated data
      const allDocuments = await databaseService.getAllDocuments();
      setState(prev => ({
        ...prev,
        documents: allDocuments,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update document',
        isLoading: false,
      }));
      throw error;
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      await databaseService.deleteDocument(id);
      setState(prev => ({
        ...prev,
        documents: prev.documents.filter(doc => doc.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete document',
        isLoading: false,
      }));
      throw error;
    }
  };

  const searchDocuments = (query: string): Document[] => {
    if (!query.trim()) return state.documents;
    
    const searchTerm = query.toLowerCase();
    return state.documents.filter(doc =>
      doc.title.toLowerCase().includes(searchTerm) ||
      doc.description.toLowerCase().includes(searchTerm) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
      (doc.extractedText && doc.extractedText.toLowerCase().includes(searchTerm))
    );
  };

  const filterDocuments = (tags: string[]): Document[] => {
    if (tags.length === 0) return state.documents;
    
    return state.documents.filter(doc =>
      tags.some(tag => doc.tags.includes(tag))
    );
  };

  const authenticate = async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const success = await authService.authenticate();
      console.log('Authentication result:', success);
      
      if (success) {
        // Small delay to ensure state updates properly
        await new Promise(resolve => setTimeout(resolve, 100));
        try {
          const documents = await databaseService.getAllDocuments();
          setState(prev => ({
            ...prev,
            isAuthenticated: true,
            documents: documents || [],
            isLoading: false,
            error: null,
          }));
        } catch (dbError) {
          console.error('Database error during authentication:', dbError);
          setState(prev => ({
            ...prev,
            isAuthenticated: true,
            documents: [],
            isLoading: false,
            error: null,
          }));
        }
      } else {
        setState(prev => ({
          ...prev,
          isAuthenticated: false,
          isLoading: false,
        }));
      }
      
      return success;
    } catch (error) {
      console.error('Authentication error in context:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Authentication failed',
        isAuthenticated: false,
        isLoading: false,
      }));
      return false;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        documents: [],
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Logout failed',
      }));
    }
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  const contextValue: AppContextType = {
    ...state,
    addDocument,
    updateDocument,
    deleteDocument,
    searchDocuments,
    filterDocuments,
    authenticate,
    logout,
    clearError,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}; 