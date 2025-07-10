import { useState, useEffect } from 'react';
import { Document } from '@/types/document';

// Mock data for demonstration
const mockDocuments: Document[] = [
  {
    id: '1',
    title: 'Business Contract',
    description: 'Service agreement between companies with terms and conditions',
    tags: ['contract', 'business', 'legal', 'agreement'],
    type: 'pdf',
    uri: 'https://images.pexels.com/photos/4386370/pexels-photo-4386370.jpeg?auto=compress&cs=tinysrgb&w=400',
    thumbnail: 'https://images.pexels.com/photos/4386370/pexels-photo-4386370.jpeg?auto=compress&cs=tinysrgb&w=400',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    fileSize: 245760
  },
  {
    id: '2',
    title: 'Recipe Collection',
    description: 'Collection of family recipes with ingredients and instructions',
    tags: ['recipe', 'cooking', 'family', 'food'],
    type: 'image',
    uri: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400',
    thumbnail: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    fileSize: 187520
  },
  {
    id: '3',
    title: 'Travel Itinerary',
    description: 'Complete travel plan with hotels, flights, and activities',
    tags: ['travel', 'vacation', 'itinerary', 'planning'],
    type: 'pdf',
    uri: 'https://images.pexels.com/photos/1008155/pexels-photo-1008155.jpeg?auto=compress&cs=tinysrgb&w=400',
    thumbnail: 'https://images.pexels.com/photos/1008155/pexels-photo-1008155.jpeg?auto=compress&cs=tinysrgb&w=400',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
    fileSize: 156890
  }
];

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addDocument = async (document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newDocument: Document = {
        ...document,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setDocuments(prev => [newDocument, ...prev]);
      return newDocument;
    } catch (err) {
      setError('Failed to add document');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateDocument = async (id: string, updates: Partial<Document>) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === id 
            ? { ...doc, ...updates, updatedAt: new Date() }
            : doc
        )
      );
    } catch (err) {
      setError('Failed to update document');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setDocuments(prev => prev.filter(doc => doc.id !== id));
    } catch (err) {
      setError('Failed to delete document');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const searchDocuments = (query: string) => {
    if (!query.trim()) return documents;
    
    const lowercaseQuery = query.toLowerCase();
    return documents.filter(doc => 
      doc.title.toLowerCase().includes(lowercaseQuery) ||
      doc.description.toLowerCase().includes(lowercaseQuery) ||
      doc.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
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