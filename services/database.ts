import * as SQLite from 'expo-sqlite';
import { Document } from '@/types/document';

export class DocumentService {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  async initDB(): Promise<void> {
    return this.initialize();
  }

  async initialize(): Promise<void> {
    // If already initialized, return immediately
    if (this.isInitialized) {
      return;
    }
    
    // If initialization is in progress, return the existing promise
    if (this.initPromise) {
      return this.initPromise;
    }

    // Start initialization
    this.initPromise = this._initialize();
    return this.initPromise;
  }

  private async _initialize(): Promise<void> {
    try {
      console.log('Initializing database...');
      this.db = await SQLite.openDatabaseAsync('documents.db');
      await this.createTables();
      this.isInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      this.initPromise = null; // Reset so we can try again
      throw new Error('Database initialization failed');
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const createDocumentsTable = `
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        tags TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('image', 'pdf')),
        uri TEXT NOT NULL,
        thumbnail TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        fileSize INTEGER
      );
    `;

    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_documents_title ON documents(title);
      CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
      CREATE INDEX IF NOT EXISTS idx_documents_created ON documents(createdAt);
    `;

    await this.db.execAsync(createDocumentsTable);
    await this.db.execAsync(createIndexes);
  }

  async addDocument(document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>): Promise<Document> {
    if (!this.db) throw new Error('Database not initialized');

    const newDocument: Document = {
      ...document,
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const query = `
      INSERT INTO documents (id, title, description, tags, type, uri, thumbnail, createdAt, updatedAt, fileSize)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      newDocument.id,
      newDocument.title,
      newDocument.description,
      JSON.stringify(newDocument.tags),
      newDocument.type,
      newDocument.uri,
      newDocument.thumbnail || null,
      newDocument.createdAt.toISOString(),
      newDocument.updatedAt.toISOString(),
      newDocument.fileSize || null
    ];

    try {
      await this.db.runAsync(query, values);
      return newDocument;
    } catch (error) {
      console.error('Failed to add document:', error);
      throw new Error('Failed to save document to database');
    }
  }

  async updateDocument(id: string, updates: Partial<Document>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const updateFields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt' && value !== undefined) {
        updateFields.push(`${key} = ?`);
        if (key === 'tags') {
          values.push(JSON.stringify(value));
        } else if (key === 'updatedAt' || value instanceof Date) {
          values.push(value instanceof Date ? value.toISOString() : value);
        } else {
          values.push(value);
        }
      }
    });

    if (updateFields.length === 0) return;

    // Always update the updatedAt timestamp
    updateFields.push('updatedAt = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const query = `UPDATE documents SET ${updateFields.join(', ')} WHERE id = ?`;

    try {
      await this.db.runAsync(query, values);
    } catch (error) {
      console.error('Failed to update document:', error);
      throw new Error('Failed to update document in database');
    }
  }

  async deleteDocument(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync('DELETE FROM documents WHERE id = ?', [id]);
    } catch (error) {
      console.error('Failed to delete document:', error);
      throw new Error('Failed to delete document from database');
    }
  }

  async getAllDocuments(): Promise<Document[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getAllAsync('SELECT * FROM documents ORDER BY createdAt DESC');
      return result.map(this.mapRowToDocument);
    } catch (error) {
      console.error('Failed to get documents:', error);
      throw new Error('Failed to retrieve documents from database');
    }
  }

  async searchDocuments(query: string): Promise<Document[]> {
    if (!this.db) throw new Error('Database not initialized');

    const searchQuery = `%${query.toLowerCase()}%`;
    const sql = `
      SELECT * FROM documents 
      WHERE LOWER(title) LIKE ? 
         OR LOWER(description) LIKE ? 
         OR LOWER(tags) LIKE ?
      ORDER BY 
        CASE 
          WHEN LOWER(title) LIKE ? THEN 1
          WHEN LOWER(description) LIKE ? THEN 2
          ELSE 3
        END,
        createdAt DESC
    `;

    try {
      const result = await this.db.getAllAsync(sql, [
        searchQuery, searchQuery, searchQuery, searchQuery, searchQuery
      ]);
      return result.map(this.mapRowToDocument);
    } catch (error) {
      console.error('Failed to search documents:', error);
      throw new Error('Failed to search documents in database');
    }
  }

  private mapRowToDocument(row: any): Document {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      tags: JSON.parse(row.tags),
      type: row.type,
      uri: row.uri,
      thumbnail: row.thumbnail,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      fileSize: row.fileSize
    };
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }
}

// Singleton instance
export const databaseService = new DocumentService(); 