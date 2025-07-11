import * as SQLite from 'expo-sqlite';
import { Document } from '@/types/document';

export class DocumentService {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private initializationAttempts = 0;
  private readonly maxRetries = 3;
  private readonly currentSchemaVersion = 2; // Increment when schema changes

  async initDB(): Promise<void> {
    return this.initialize();
  }

  async initialize(): Promise<void> {
    // If already initialized, return immediately
    if (this.isInitialized && this.db) {
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
      this.initializationAttempts++;
      console.log(`Initializing database (attempt ${this.initializationAttempts})...`);
      
      // Close existing connection if any
      if (this.db) {
        await this.db.closeAsync();
        this.db = null;
      }
      
      this.db = await SQLite.openDatabaseAsync('documents.db');
      
      // Check if we need to migrate
      await this.migrateDatabase();
      
      // Create/update tables
      await this.createTables();
      this.isInitialized = true;
      this.initPromise = null; // Reset for future calls
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      this.db = null;
      this.isInitialized = false;
      this.initPromise = null; // Reset so we can try again
      
      // Retry logic
      if (this.initializationAttempts < this.maxRetries) {
        console.log(`Retrying database initialization in 1 second...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this._initialize();
      }
      
      throw new Error(`Database initialization failed after ${this.maxRetries} attempts: ${error}`);
    }
  }

  private async migrateDatabase(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Create user_version table if it doesn't exist (for schema versioning)
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS schema_info (
          version INTEGER PRIMARY KEY
        );
      `);

      // Get current schema version
      const result = await this.db.getAllAsync('SELECT version FROM schema_info LIMIT 1');
      const currentVersion = result.length > 0 ? (result[0] as any).version : 0;

      console.log(`Current database schema version: ${currentVersion}, Target version: ${this.currentSchemaVersion}`);

      // Perform migrations if needed
      if (currentVersion < this.currentSchemaVersion) {
        await this.performMigrations(currentVersion);
        
        // Update schema version
        if (currentVersion === 0) {
          await this.db.runAsync('INSERT INTO schema_info (version) VALUES (?)', [this.currentSchemaVersion]);
        } else {
          await this.db.runAsync('UPDATE schema_info SET version = ?', [this.currentSchemaVersion]);
        }
      }
    } catch (error) {
      console.error('Migration failed:', error);
      throw new Error('Database migration failed');
    }
  }

  private async performMigrations(fromVersion: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    console.log(`Performing database migration from version ${fromVersion} to ${this.currentSchemaVersion}`);

    if (fromVersion < 1) {
      // Migration from version 0 to 1: Create initial table
      console.log('Creating initial documents table...');
      await this.db.execAsync(`
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
      `);
    }

    if (fromVersion < 2) {
      // Migration from version 1 to 2: Add OCR-related columns
      console.log('Adding OCR columns to documents table...');
      
      // Check if table exists and get its structure
      const tableInfo = await this.db.getAllAsync("PRAGMA table_info(documents)");
      const existingColumns = tableInfo.map((col: any) => col.name);
      
      // Add missing columns one by one
      if (!existingColumns.includes('extractedText')) {
        await this.db.execAsync('ALTER TABLE documents ADD COLUMN extractedText TEXT');
      }
      if (!existingColumns.includes('ocrConfidence')) {
        await this.db.execAsync('ALTER TABLE documents ADD COLUMN ocrConfidence REAL');
      }
      if (!existingColumns.includes('processingTime')) {
        await this.db.execAsync('ALTER TABLE documents ADD COLUMN processingTime INTEGER');
      }
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized || !this.db) {
      await this.initialize();
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Create indexes
      const createIndexes = `
        CREATE INDEX IF NOT EXISTS idx_documents_title ON documents(title);
        CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
        CREATE INDEX IF NOT EXISTS idx_documents_created ON documents(createdAt);
        CREATE INDEX IF NOT EXISTS idx_documents_extracted_text ON documents(extractedText);
        CREATE INDEX IF NOT EXISTS idx_documents_ocr_confidence ON documents(ocrConfidence);
      `;

      // Create FTS table
      const createFtsTable = `
        CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
          title, description, tags, extractedText,
          content='documents',
          content_rowid='rowid'
        );
      `;

      // Create FTS triggers
      const createFtsTriggers = `
        CREATE TRIGGER IF NOT EXISTS documents_fts_insert AFTER INSERT ON documents BEGIN
          INSERT INTO documents_fts(rowid, title, description, tags, extractedText) 
          VALUES (new.rowid, new.title, new.description, new.tags, new.extractedText);
        END;

        CREATE TRIGGER IF NOT EXISTS documents_fts_delete AFTER DELETE ON documents BEGIN
          DELETE FROM documents_fts WHERE rowid = old.rowid;
        END;

        CREATE TRIGGER IF NOT EXISTS documents_fts_update AFTER UPDATE ON documents BEGIN
          DELETE FROM documents_fts WHERE rowid = old.rowid;
          INSERT INTO documents_fts(rowid, title, description, tags, extractedText) 
          VALUES (new.rowid, new.title, new.description, new.tags, new.extractedText);
        END;
      `;

      await this.db.execAsync(createIndexes);
      await this.db.execAsync(createFtsTable);
      await this.db.execAsync(createFtsTriggers);
      
      console.log('Database tables and indexes created successfully');
    } catch (error) {
      console.error('Failed to create database tables:', error);
      throw new Error('Database table creation failed');
    }
  }

  async addDocument(document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>): Promise<Document> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const newDocument: Document = {
      ...document,
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const query = `
      INSERT INTO documents (id, title, description, tags, type, uri, thumbnail, createdAt, updatedAt, fileSize, extractedText, ocrConfidence, processingTime)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      newDocument.fileSize || null,
      newDocument.extractedText || null,
      newDocument.ocrData?.confidence || null,
      newDocument.ocrData?.processingTime || null
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
    await this.ensureInitialized();
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
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync('DELETE FROM documents WHERE id = ?', [id]);
    } catch (error) {
      console.error('Failed to delete document:', error);
      throw new Error('Failed to delete document from database');
    }
  }

  async getAllDocuments(): Promise<Document[]> {
    await this.ensureInitialized();
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
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    // First try FTS search for better performance with OCR text
    try {
      const ftsQuery = query.replace(/[^\w\s]/g, '').trim();
      if (ftsQuery) {
        const ftsResult = await this.db.getAllAsync(`
          SELECT d.* FROM documents d
          JOIN documents_fts fts ON d.rowid = fts.rowid
          WHERE documents_fts MATCH ?
          ORDER BY rank
        `, [`"${ftsQuery}"`]);
        
        if (ftsResult.length > 0) {
          return ftsResult.map(this.mapRowToDocument);
        }
      }
    } catch (error) {
      console.warn('FTS search failed, falling back to LIKE search:', error);
    }

    // Fallback to LIKE search including OCR text
    const searchQuery = `%${query.toLowerCase()}%`;
    const sql = `
      SELECT * FROM documents 
      WHERE LOWER(title) LIKE ? 
         OR LOWER(description) LIKE ? 
         OR LOWER(tags) LIKE ?
         OR LOWER(extractedText) LIKE ?
      ORDER BY 
        CASE 
          WHEN LOWER(title) LIKE ? THEN 1
          WHEN LOWER(description) LIKE ? THEN 2
          WHEN LOWER(extractedText) LIKE ? THEN 3
          ELSE 4
        END,
        ocrConfidence DESC,
        createdAt DESC
    `;

    try {
      const result = await this.db.getAllAsync(sql, [
        searchQuery, searchQuery, searchQuery, searchQuery, 
        searchQuery, searchQuery, searchQuery
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
      fileSize: row.fileSize,
      extractedText: row.extractedText,
      ocrData: row.ocrConfidence ? {
        text: row.extractedText || '',
        confidence: row.ocrConfidence,
        blocks: [],
        processingTime: row.processingTime || 0,
        imageSize: { width: 0, height: 0 }
      } : undefined
    };
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.isInitialized = false;
    }
  }

  // Debug method to reset database (only for development)
  async resetDatabase(): Promise<void> {
    if (this.db) {
      try {
        await this.db.execAsync('DROP TABLE IF EXISTS documents');
        await this.db.execAsync('DROP TABLE IF EXISTS documents_fts');
        await this.db.execAsync('DROP TABLE IF EXISTS schema_info');
        console.log('Database reset successfully');
        this.isInitialized = false;
        await this.initialize();
      } catch (error) {
        console.error('Failed to reset database:', error);
      }
    }
  }
}

// Singleton instance
export const databaseService = new DocumentService(); 