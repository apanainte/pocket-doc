import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { Document, Category } from '@/types/document';

// Migration logging interface
interface MigrationLog {
  migrationId: string;
  timestamp: string;
  fromVersion: number;
  toVersion: number;
  step: string;
  success: boolean;
  error?: string;
}

export class DocumentService {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private initializationAttempts = 0;
  private readonly maxRetries = 3;
  private readonly currentSchemaVersion = 4; // Increment when schema changes
  private readonly dbName = 'documents.db';
  private readonly migrationLogs: MigrationLog[] = [];

  // Get database path for diagnostic information
  private getDatabasePath(): string {
    // Return the default expo-sqlite path for diagnostics
    // Note: This is for information only, not used for opening the database
    const documentDirectory = FileSystem.documentDirectory;
    if (!documentDirectory) {
      return 'unknown_path';
    }
    return `${documentDirectory}SQLite/${this.dbName}`;
  }

  // Generate unique migration ID for tracking
  private generateMigrationId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `migration_${timestamp}_${random}`;
  }

  // Enhanced logging with timestamps and migration tracking
  private logMigration(log: Omit<MigrationLog, 'timestamp'>): void {
    const logEntry: MigrationLog = {
      ...log,
      timestamp: new Date().toISOString()
    };
    
    this.migrationLogs.push(logEntry);
    
    const logLevel = log.success ? 'INFO' : 'ERROR';
    const message = `[${logLevel}] Migration ${log.migrationId} (v${log.fromVersion}→v${log.toVersion}): ${log.step}`;
    
    if (log.success) {
      console.log(message);
    } else {
      console.error(message, log.error || '');
    }
  }

  // Get migration logs for debugging
  public getMigrationLogs(): MigrationLog[] {
    return [...this.migrationLogs];
  }

  // Export migration logs for debugging and user support
  public exportMigrationLogs(): string {
    const logs = this.getMigrationLogs();
    
    const logReport = {
      timestamp: new Date().toISOString(),
      platform: 'react-native',
      appVersion: '1.1.0',
      currentSchemaVersion: this.currentSchemaVersion,
      totalMigrations: logs.length,
      logs: logs.map(log => ({
        id: log.migrationId,
        timestamp: log.timestamp,
        version: `${log.fromVersion} → ${log.toVersion}`,
        step: log.step,
        status: log.success ? 'SUCCESS' : 'FAILED',
        error: log.error || null
      }))
    };

    return JSON.stringify(logReport, null, 2);
  }

  // Clear old migration logs to prevent memory buildup
  private clearOldMigrationLogs(): void {
    const maxLogs = 50; // Keep last 50 migration log entries
    if (this.migrationLogs.length > maxLogs) {
      this.migrationLogs.splice(0, this.migrationLogs.length - maxLogs);
    }
  }

  // Export diagnostic information
  public async getDiagnosticInfo(): Promise<{
    databasePath: string;
    databaseExists: boolean;
    currentSchemaVersion: number;
    migrationLogs: MigrationLog[];
    platform: string;
  }> {
    // Get actual database path from opened database if available
    let dbPath = 'unknown_path';
    let dbExists = false;
    
    if (this.db && this.db.databasePath) {
      dbPath = this.db.databasePath;
      dbExists = true; // If we have a connection, database exists
    } else {
      // Fallback to computed path for diagnostic purposes
      const computedPath = this.getDatabasePath();
      if (computedPath !== 'unknown_path') {
        dbPath = computedPath;
        try {
          dbExists = await FileSystem.getInfoAsync(dbPath).then(info => info.exists);
        } catch (error) {
          dbExists = false;
        }
      }
    }
    
    return {
      databasePath: dbPath,
      databaseExists: dbExists,
      currentSchemaVersion: this.currentSchemaVersion,
      migrationLogs: this.getMigrationLogs(),
      platform: 'react-native'
    };
  }

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

      // CRITICAL FIX: Use expo-sqlite default database location for reliability
      // Previous implementation computed explicit paths but didn't use them!
      // This caused database location inconsistencies and potential data loss
      // Now using expo-sqlite default behavior which handles paths automatically
      console.log(`Opening database with name: ${this.dbName}`);
      console.log(`Database will be stored in expo-sqlite default directory`);
      
      // Open database using expo-sqlite default location
      this.db = await SQLite.openDatabaseAsync(this.dbName);
      
      // Log actual database path for debugging
      if (this.db.databasePath) {
        console.log(`Database opened at: ${this.db.databasePath}`);
      }
      
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

    const migrationId = this.generateMigrationId();
    let currentVersion = 0;

    try {
      // Create user_version table if it doesn't exist (for schema versioning)
      this.logMigration({
        migrationId,
        fromVersion: 0,
        toVersion: this.currentSchemaVersion,
        step: 'Creating schema_info table',
        success: true
      });

      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS schema_info (
          version INTEGER PRIMARY KEY
        );
      `);

      // Get current schema version
      const result = await this.db.getAllAsync('SELECT version FROM schema_info LIMIT 1');
      currentVersion = result.length > 0 ? (result[0] as any).version : 0;

      this.logMigration({
        migrationId,
        fromVersion: currentVersion,
        toVersion: this.currentSchemaVersion,
        step: `Detected current schema version: ${currentVersion}`,
        success: true
      });

      console.log(`Current database schema version: ${currentVersion}, Target version: ${this.currentSchemaVersion}`);

      // Perform migrations if needed
      if (currentVersion < this.currentSchemaVersion) {
        this.logMigration({
          migrationId,
          fromVersion: currentVersion,
          toVersion: this.currentSchemaVersion,
          step: 'Starting database migration process',
          success: true
        });

        await this.performMigrations(currentVersion, migrationId);
        
        // Update schema version
        if (currentVersion === 0) {
          await this.db.runAsync('INSERT INTO schema_info (version) VALUES (?)', [this.currentSchemaVersion]);
        } else {
          await this.db.runAsync('UPDATE schema_info SET version = ?', [this.currentSchemaVersion]);
        }

        this.logMigration({
          migrationId,
          fromVersion: currentVersion,
          toVersion: this.currentSchemaVersion,
          step: 'Schema version updated successfully',
          success: true
        });

        // Post-migration validation
        await this.validateMigration(migrationId, currentVersion, this.currentSchemaVersion);

        this.logMigration({
          migrationId,
          fromVersion: currentVersion,
          toVersion: this.currentSchemaVersion,
          step: 'Migration completed successfully',
          success: true
        });
      } else {
        this.logMigration({
          migrationId,
          fromVersion: currentVersion,
          toVersion: this.currentSchemaVersion,
          step: 'No migration needed - schema is up to date',
          success: true
        });
      }
    } catch (error) {
      this.logMigration({
        migrationId,
        fromVersion: currentVersion,
        toVersion: this.currentSchemaVersion,
        step: 'Migration failed',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });

      console.error('Migration failed:', error);
      console.error('Migration logs:', this.getMigrationLogs());
      throw new Error(`Database migration failed (ID: ${migrationId}): ${error}`);
    }
  }

  private async performMigrations(fromVersion: number, migrationId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    console.log(`Performing database migration from version ${fromVersion} to ${this.currentSchemaVersion}`);

    if (fromVersion < 1) {
      // Migration from version 0 to 1: Create initial table
      this.logMigration({
        migrationId,
        fromVersion,
        toVersion: 1,
        step: 'Creating initial documents table',
        success: true
      });

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

      // Verify table creation
      const tableExists = await this.verifyTableExists('documents');
      if (!tableExists) {
        throw new Error('Failed to create documents table');
      }

      this.logMigration({
        migrationId,
        fromVersion,
        toVersion: 1,
        step: 'Documents table created and verified',
        success: true
      });
    }

    if (fromVersion < 2) {
      // Migration from version 1 to 2: Add OCR-related columns
      this.logMigration({
        migrationId,
        fromVersion: Math.max(fromVersion, 1),
        toVersion: 2,
        step: 'Adding OCR columns to documents table',
        success: true
      });
      
      // Check if table exists and get its structure
      const tableInfo = await this.db.getAllAsync("PRAGMA table_info(documents)");
      const existingColumns = tableInfo.map((col: any) => col.name);
      
      // Add missing columns one by one with verification
      const columnsToAdd = [
        { name: 'extractedText', type: 'TEXT' },
        { name: 'ocrConfidence', type: 'REAL' },
        { name: 'processingTime', type: 'INTEGER' }
      ];

      for (const column of columnsToAdd) {
        if (!existingColumns.includes(column.name)) {
          await this.db.execAsync(`ALTER TABLE documents ADD COLUMN ${column.name} ${column.type}`);
          
          // Verify column was added
          const updatedTableInfo = await this.db.getAllAsync("PRAGMA table_info(documents)");
          const updatedColumns = updatedTableInfo.map((col: any) => col.name);
          
          if (!updatedColumns.includes(column.name)) {
            throw new Error(`Failed to add column ${column.name}`);
          }

          this.logMigration({
            migrationId,
            fromVersion: Math.max(fromVersion, 1),
            toVersion: 2,
            step: `Added column ${column.name}`,
            success: true
          });
        }
      }
    }

    if (fromVersion < 3) {
      // Migration from version 2 to 3: Add categories support
      this.logMigration({
        migrationId,
        fromVersion: Math.max(fromVersion, 2),
        toVersion: 3,
        step: 'Adding categories table and categoryId column',
        success: true
      });
      
      // Create categories table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          color TEXT NOT NULL,
          icon TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `);

      // Verify categories table creation
      const categoriesTableExists = await this.verifyTableExists('categories');
      if (!categoriesTableExists) {
        throw new Error('Failed to create categories table');
      }

      this.logMigration({
        migrationId,
        fromVersion: Math.max(fromVersion, 2),
        toVersion: 3,
        step: 'Categories table created and verified',
        success: true
      });

      // Add categoryId column to documents table if it doesn't exist
      const tableInfo = await this.db.getAllAsync("PRAGMA table_info(documents)");
      const existingColumns = tableInfo.map((col: any) => col.name);
      
      if (!existingColumns.includes('categoryId')) {
        await this.db.execAsync('ALTER TABLE documents ADD COLUMN categoryId TEXT');
        await this.db.execAsync('CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(categoryId)');

        // Verify column and index were added
        const updatedTableInfo = await this.db.getAllAsync("PRAGMA table_info(documents)");
        const updatedColumns = updatedTableInfo.map((col: any) => col.name);
        
        if (!updatedColumns.includes('categoryId')) {
          throw new Error('Failed to add categoryId column');
        }

        this.logMigration({
          migrationId,
          fromVersion: Math.max(fromVersion, 2),
          toVersion: 3,
          step: 'CategoryId column and index added',
          success: true
        });
      }

      // Insert default categories
      await this.insertDefaultCategories();

      this.logMigration({
        migrationId,
        fromVersion: Math.max(fromVersion, 2),
        toVersion: 3,
        step: 'Default categories inserted',
        success: true
      });
    }

    if (fromVersion < 4) {
      // Migration from version 3 to 4: Align schema to PRD (pages, fts_pages, ocr_jobs, attributes, attribute_definitions)
      this.logMigration({
        migrationId,
        fromVersion: Math.max(fromVersion, 3),
        toVersion: 4,
        step: 'Creating PRD tables: pages, fts_pages, ocr_jobs, attributes, attribute_definitions',
        success: true
      });

      // Create pages table (use page_index instead of reserved keyword 'index')
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS pages (
          id TEXT PRIMARY KEY,
          document_id TEXT NOT NULL,
          page_index INTEGER NOT NULL,
          thumb_uri TEXT,
          status TEXT NOT NULL CHECK (status IN ('PENDING','PROCESSING','DONE','FAILED')),
          ocr_lang TEXT,
          text_encrypted BLOB,
          FOREIGN KEY(document_id) REFERENCES documents(id)
        );
      `);

      // Create attributes tables
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS attribute_definitions (
          key TEXT PRIMARY KEY,
          label TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('string','date','number')),
          pattern TEXT,
          example TEXT
        );
      `);

      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS attributes (
          id TEXT PRIMARY KEY,
          document_id TEXT NOT NULL,
          attribute_key TEXT NOT NULL,
          value TEXT,
          confidence REAL,
          FOREIGN KEY(document_id) REFERENCES documents(id),
          FOREIGN KEY(attribute_key) REFERENCES attribute_definitions(key)
        );
      `);

      // Create OCR jobs table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS ocr_jobs (
          id TEXT PRIMARY KEY,
          document_id TEXT NOT NULL,
          page_id TEXT,
          state TEXT NOT NULL,
          attempts INTEGER DEFAULT 0,
          last_error TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY(document_id) REFERENCES documents(id),
          FOREIGN KEY(page_id) REFERENCES pages(id)
        );
      `);

      // Extend documents with PRD fields if missing
      const documentsInfo = await this.db.getAllAsync("PRAGMA table_info(documents)");
      const docCols = documentsInfo.map((c: any) => c.name);
      const addCol = async (name: string, type: string) => {
        if (!docCols.includes(name)) {
          await this.db.execAsync(`ALTER TABLE documents ADD COLUMN ${name} ${type}`);
        }
      };
      await addCol('pageCount', 'INTEGER');
      await addCol('favorite', 'INTEGER');
      await addCol('sizeBytes', 'INTEGER');
      await addCol('status', "TEXT");
      await addCol('file_uri_encrypted', 'TEXT');

      // Create fts_pages virtual table
      await this.db.execAsync(`
        CREATE VIRTUAL TABLE IF NOT EXISTS fts_pages USING fts5(
          page_id, content
        );
      `);

      // Helpful indexes
      await this.db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_pages_document ON pages(document_id);
        CREATE INDEX IF NOT EXISTS idx_attributes_document ON attributes(document_id);
        CREATE INDEX IF NOT EXISTS idx_ocr_jobs_state ON ocr_jobs(state);
      `);

      this.logMigration({
        migrationId,
        fromVersion: Math.max(fromVersion, 3),
        toVersion: 4,
        step: 'PRD tables created and documents extended',
        success: true
      });
    }
  }

  // Verify that a table exists in the database
  private async verifyTableExists(tableName: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getAllAsync(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        [tableName]
      );
      return result.length > 0;
    } catch (error) {
      console.error(`Failed to verify table ${tableName} exists:`, error);
      return false;
    }
  }

  // Comprehensive post-migration validation
  private async validateMigration(migrationId: string, fromVersion: number, toVersion: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Validate schema version was updated correctly
      const versionResult = await this.db.getAllAsync('SELECT version FROM schema_info LIMIT 1');
      const actualVersion = versionResult.length > 0 ? (versionResult[0] as any).version : 0;
      
      if (actualVersion !== toVersion) {
        throw new Error(`Schema version mismatch: expected ${toVersion}, got ${actualVersion}`);
      }

      this.logMigration({
        migrationId,
        fromVersion,
        toVersion,
        step: 'Schema version validation passed',
        success: true
      });

      // Validate required tables exist
      const requiredTables = ['documents'];
      if (toVersion >= 3) requiredTables.push('categories');
      if (toVersion >= 4) requiredTables.push('pages', 'fts_pages', 'ocr_jobs', 'attributes', 'attribute_definitions');

      for (const tableName of requiredTables) {
        const tableExists = await this.verifyTableExists(tableName);
        if (!tableExists) {
          throw new Error(`Required table ${tableName} does not exist after migration`);
        }

        this.logMigration({
          migrationId,
          fromVersion,
          toVersion,
          step: `Table ${tableName} validation passed`,
          success: true
        });
      }

      // Validate documents table structure
      const documentsTableInfo = await this.db.getAllAsync("PRAGMA table_info(documents)");
      const documentColumns = documentsTableInfo.map((col: any) => col.name);

      const requiredDocumentColumns = ['id', 'title', 'description', 'tags', 'type', 'uri', 'createdAt', 'updatedAt'];
      if (toVersion >= 2) {
        requiredDocumentColumns.push('extractedText', 'ocrConfidence', 'processingTime');
      }
      if (toVersion >= 3) {
        requiredDocumentColumns.push('categoryId');
      }
      if (toVersion >= 4) {
        requiredDocumentColumns.push('pageCount', 'favorite', 'sizeBytes', 'status', 'file_uri_encrypted');
      }

      for (const columnName of requiredDocumentColumns) {
        if (!documentColumns.includes(columnName)) {
          throw new Error(`Required column ${columnName} missing from documents table`);
        }
      }

      this.logMigration({
        migrationId,
        fromVersion,
        toVersion,
        step: 'Documents table structure validation passed',
        success: true
      });

      // If categories table should exist, validate its structure
      if (toVersion >= 3) {
      // If PRD tables should exist, validate minimal structure
      if (toVersion >= 4) {
        const pagesInfo = await this.db.getAllAsync("PRAGMA table_info(pages)");
        const pagesCols = pagesInfo.map((c: any) => c.name);
        for (const name of ['id','document_id','page_index','status']) {
          if (!pagesCols.includes(name)) throw new Error(`Required column ${name} missing from pages table`);
        }

        const attrsInfo = await this.db.getAllAsync("PRAGMA table_info(attributes)");
        const attrsCols = attrsInfo.map((c: any) => c.name);
        for (const name of ['id','document_id','attribute_key','value']) {
          if (!attrsCols.includes(name)) throw new Error(`Required column ${name} missing from attributes table`);
        }

        const jobsInfo = await this.db.getAllAsync("PRAGMA table_info(ocr_jobs)");
        const jobsCols = jobsInfo.map((c: any) => c.name);
        for (const name of ['id','document_id','state','attempts','created_at','updated_at']) {
          if (!jobsCols.includes(name)) throw new Error(`Required column ${name} missing from ocr_jobs table`);
        }

        // Validate fts_pages exists
        const ftsPagesExists = await this.verifyTableExists('fts_pages');
        if (!ftsPagesExists) throw new Error('fts_pages virtual table missing');
      }
        const categoriesTableInfo = await this.db.getAllAsync("PRAGMA table_info(categories)");
        const categoryColumns = categoriesTableInfo.map((col: any) => col.name);
        const requiredCategoryColumns = ['id', 'name', 'color', 'icon', 'createdAt', 'updatedAt'];

        for (const columnName of requiredCategoryColumns) {
          if (!categoryColumns.includes(columnName)) {
            throw new Error(`Required column ${columnName} missing from categories table`);
          }
        }

        // Verify default categories were inserted
        const categoryCount = await this.db.getAllAsync('SELECT COUNT(*) as count FROM categories');
        const count = (categoryCount[0] as any)?.count || 0;
        
        if (count === 0) {
          throw new Error('No default categories found after migration');
        }

        this.logMigration({
          migrationId,
          fromVersion,
          toVersion,
          step: `Categories table structure validation passed (${count} categories found)`,
          success: true
        });
      }

      // Validate indexes exist
      const indexes = await this.db.getAllAsync("SELECT name FROM sqlite_master WHERE type='index'");
      const indexNames = indexes.map((idx: any) => idx.name);

      if (toVersion >= 3 && !indexNames.some(name => name.includes('documents_category'))) {
        console.warn('Category index may be missing, but continuing migration');
      }

      this.logMigration({
        migrationId,
        fromVersion,
        toVersion,
        step: 'Migration validation completed successfully',
        success: true
      });

    } catch (error) {
      this.logMigration({
        migrationId,
        fromVersion,
        toVersion,
        step: 'Migration validation failed',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private async insertDefaultCategories(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const defaultCategories = [
      { id: 'cat_receipts', name: 'Receipts', color: '#10B981', icon: 'receipt' },
      { id: 'cat_invoices', name: 'Invoices', color: '#3B82F6', icon: 'file-text' },
      { id: 'cat_personal', name: 'Personal', color: '#8B5CF6', icon: 'user' },
      { id: 'cat_business', name: 'Business', color: '#F59E0B', icon: 'briefcase' },
      { id: 'cat_taxes', name: 'Taxes', color: '#EF4444', icon: 'calculator' },
      { id: 'cat_medical', name: 'Medical', color: '#EC4899', icon: 'heart' },
      { id: 'cat_travel', name: 'Travel', color: '#06B6D4', icon: 'plane' },
      { id: 'cat_other', name: 'Other', color: '#6B7280', icon: 'folder' },
    ];

    const now = new Date().toISOString();

    for (const category of defaultCategories) {
      try {
        await this.db.runAsync(
          'INSERT OR IGNORE INTO categories (id, name, color, icon, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
          [category.id, category.name, category.color, category.icon, now, now]
        );
      } catch (error) {
        console.warn(`Failed to insert default category ${category.name}:`, error);
      }
    }

    console.log('Default categories inserted successfully');
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

  // ===== CATEGORY OPERATIONS =====

  async getAllCategories(): Promise<Category[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getAllAsync('SELECT * FROM categories ORDER BY name ASC');
      return result.map(this.mapRowToCategory);
    } catch (error) {
      console.error('Failed to get categories:', error);
      throw new Error('Failed to retrieve categories from database');
    }
  }

  async getCategoryById(id: string): Promise<Category | null> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getAllAsync('SELECT * FROM categories WHERE id = ? LIMIT 1', [id]);
      if (result.length === 0) {
        return null;
      }
      return this.mapRowToCategory(result[0]);
    } catch (error) {
      console.error('Failed to get category:', error);
      throw new Error('Failed to retrieve category from database');
    }
  }

  async addCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const newCategory: Category = {
      ...category,
      id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const query = `
      INSERT INTO categories (id, name, color, icon, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
      newCategory.id,
      newCategory.name,
      newCategory.color,
      newCategory.icon,
      newCategory.createdAt.toISOString(),
      newCategory.updatedAt.toISOString()
    ];

    try {
      await this.db.runAsync(query, values);
      return newCategory;
    } catch (error) {
      console.error('Failed to add category:', error);
      throw new Error('Failed to save category to database');
    }
  }

  async updateCategory(id: string, updates: Partial<Omit<Category, 'id' | 'createdAt'>>): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const updateFields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      updateFields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.color !== undefined) {
      updateFields.push('color = ?');
      values.push(updates.color);
    }
    if (updates.icon !== undefined) {
      updateFields.push('icon = ?');
      values.push(updates.icon);
    }

    if (updateFields.length === 0) {
      return; // Nothing to update
    }

    updateFields.push('updatedAt = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const query = `UPDATE categories SET ${updateFields.join(', ')} WHERE id = ?`;

    try {
      await this.db.runAsync(query, values);
    } catch (error) {
      console.error('Failed to update category:', error);
      throw new Error('Failed to update category in database');
    }
  }

  async deleteCategory(id: string): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    try {
      // First, remove categoryId from all documents that use this category
      await this.db.runAsync('UPDATE documents SET categoryId = NULL WHERE categoryId = ?', [id]);
      
      // Then delete the category
      await this.db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
    } catch (error) {
      console.error('Failed to delete category:', error);
      throw new Error('Failed to delete category from database');
    }
  }

  async getDocumentsByCategory(categoryId: string): Promise<Document[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getAllAsync(
        'SELECT * FROM documents WHERE categoryId = ? ORDER BY createdAt DESC',
        [categoryId]
      );
      return result.map(this.mapRowToDocument);
    } catch (error) {
      console.error('Failed to get documents by category:', error);
      throw new Error('Failed to retrieve documents from database');
    }
  }

  async getCategoryStats(): Promise<Record<string, number>> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getAllAsync(`
        SELECT categoryId, COUNT(*) as count 
        FROM documents 
        WHERE categoryId IS NOT NULL 
        GROUP BY categoryId
      `);
      
      const stats: Record<string, number> = {};
      result.forEach((row: any) => {
        stats[row.categoryId] = row.count;
      });
      
      return stats;
    } catch (error) {
      console.error('Failed to get category stats:', error);
      return {};
    }
  }

  private mapRowToCategory(row: any): Category {
    return {
      id: row.id,
      name: row.name,
      color: row.color,
      icon: row.icon,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };
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
      INSERT INTO documents (id, title, description, tags, type, uri, thumbnail, createdAt, updatedAt, fileSize, extractedText, ocrConfidence, processingTime, categoryId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      newDocument.ocrData?.processingTime || null,
      newDocument.categoryId || null
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
      categoryId: row.categoryId,
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

  // Enhanced error recovery and rollback capabilities
  async attemptDatabaseRecovery(migrationId: string, error: Error): Promise<boolean> {
    if (!this.db) return false;

    try {
      this.logMigration({
        migrationId,
        fromVersion: 0,
        toVersion: this.currentSchemaVersion,
        step: 'Attempting database recovery',
        success: true
      });

      // Try to detect if this is a schema-related issue
      const tablesExist = await this.verifyBasicTablesExist();
      
      if (!tablesExist.documents) {
        this.logMigration({
          migrationId,
          fromVersion: 0,
          toVersion: this.currentSchemaVersion,
          step: 'Documents table missing - attempting recreation',
          success: true
        });

        // Try to recreate the basic documents table
        await this.createBasicDocumentsTable();
        
        // Reset schema version to 1 and try migration again
        await this.db.runAsync('DELETE FROM schema_info');
        await this.db.runAsync('INSERT INTO schema_info (version) VALUES (?)', [1]);
        
        this.logMigration({
          migrationId,
          fromVersion: 0,
          toVersion: this.currentSchemaVersion,
          step: 'Basic recovery completed - table recreated',
          success: true
        });

        return true;
      }

      return false;
    } catch (recoveryError) {
      this.logMigration({
        migrationId,
        fromVersion: 0,
        toVersion: this.currentSchemaVersion,
        step: 'Database recovery failed',
        success: false,
        error: recoveryError instanceof Error ? recoveryError.message : String(recoveryError)
      });

      return false;
    }
  }

  // Check which basic tables exist
  private async verifyBasicTablesExist(): Promise<{ documents: boolean; categories: boolean; schemaInfo: boolean }> {
    if (!this.db) throw new Error('Database not initialized');

    return {
      documents: await this.verifyTableExists('documents'),
      categories: await this.verifyTableExists('categories'),
      schemaInfo: await this.verifyTableExists('schema_info')
    };
  }

  // Create basic documents table for recovery scenarios
  private async createBasicDocumentsTable(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

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
        fileSize INTEGER,
        extractedText TEXT,
        ocrConfidence REAL,
        processingTime INTEGER,
        categoryId TEXT
      );
    `);
  }

  // Enhanced database integrity check
  async performIntegrityCheck(): Promise<{
    isHealthy: boolean;
    issues: string[];
    diagnostics: any;
  }> {
    const issues: string[] = [];
    
    try {
      await this.ensureInitialized();
      
      const diagnostics = await this.getDiagnosticInfo();
      
      // Check if database file exists
      if (!diagnostics.databaseExists) {
        issues.push('Database file does not exist');
      }

      // Check if required tables exist
      const tablesExist = await this.verifyBasicTablesExist();
      
      if (!tablesExist.documents) {
        issues.push('Documents table missing');
      }
      
      if (!tablesExist.schemaInfo) {
        issues.push('Schema info table missing');
      }

      // Check schema version consistency
      if (tablesExist.schemaInfo) {
        const versionResult = await this.db?.getAllAsync('SELECT version FROM schema_info LIMIT 1');
        const currentVersion = versionResult?.length ? (versionResult[0] as any).version : 0;
        
        if (currentVersion > this.currentSchemaVersion) {
          issues.push(`Schema version too high: ${currentVersion} > ${this.currentSchemaVersion}`);
        }
      }

      // Check if we can perform basic operations
      try {
        if (tablesExist.documents) {
          await this.db?.getAllAsync('SELECT COUNT(*) FROM documents LIMIT 1');
        }
      } catch (error) {
        issues.push('Cannot perform basic queries on documents table');
      }

      return {
        isHealthy: issues.length === 0,
        issues,
        diagnostics
      };

    } catch (error) {
      return {
        isHealthy: false,
        issues: [`Integrity check failed: ${error}`],
        diagnostics: null
      };
    }
  }

  // File path recovery and validation
  async fixAllFilePaths(): Promise<{
    documentsChecked: number;
    documentsFixed: number;
    thumbnailsFixed: number;
    documentsWithIssues: string[];
  }> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    console.log('🔧 Starting comprehensive file path recovery...');
    
    const stats = {
      documentsChecked: 0,
      documentsFixed: 0,
      thumbnailsFixed: 0,
      documentsWithIssues: [] as string[]
    };

    try {
      // Get all documents
      const documents = await this.db.getAllAsync('SELECT id, uri, thumbnail, type, title FROM documents');
      console.log(`Found ${documents.length} documents to check`);

      const { fileStorageService } = await import('./fileStorage');
      const currentDocsDir = fileStorageService.getCurrentDocumentsDirectory();
      
      console.log('Current documents directory:', currentDocsDir);

      for (const doc of documents) {
        stats.documentsChecked++;
        const docData = doc as any;
        let needsUpdate = false;
        let newUri = docData.uri;
        let newThumbnail = docData.thumbnail;

        console.log(`Checking document ${docData.id}: ${docData.title}`);

                 // Check main document file
         if (docData.uri) {
           const FileSystem = await import('expo-file-system');
           const mainFileExists = await FileSystem.getInfoAsync(docData.uri);
          if (!mainFileExists.exists) {
            console.log(`Main file missing: ${docData.uri}`);
            
            // Try to find the file in the current documents directory
            const fileName = docData.uri.split('/').pop();
            if (fileName) {
              const expectedPath = `${currentDocsDir}${fileName}`;
              const expectedFileExists = await FileSystem.getInfoAsync(expectedPath);
              
              if (expectedFileExists.exists) {
                console.log(`Found main file at new location: ${expectedPath}`);
                newUri = expectedPath;
                needsUpdate = true;
                stats.documentsFixed++;
              } else {
                console.warn(`Main file not found at expected location: ${expectedPath}`);
                stats.documentsWithIssues.push(`${docData.title} (${docData.id})`);
              }
            }
          }
        }

        // Check thumbnail
        if (docData.thumbnail) {
          const thumbnailExists = await FileSystem.getInfoAsync(docData.thumbnail);
          if (!thumbnailExists.exists) {
            console.log(`Thumbnail missing: ${docData.thumbnail}`);
            
            // Try expected thumbnail path
            const expectedThumbnailPath = fileStorageService.getExpectedThumbnailPath(docData.id);
            const expectedThumbExists = await FileSystem.getInfoAsync(expectedThumbnailPath);
            
            if (expectedThumbExists.exists) {
              console.log(`Found thumbnail at expected location: ${expectedThumbnailPath}`);
              newThumbnail = expectedThumbnailPath;
              needsUpdate = true;
              stats.thumbnailsFixed++;
            } else {
              // Try to regenerate thumbnail if it's an image
              if (docData.type === 'image' && newUri) {
                const regeneratedThumbnail = await fileStorageService.regenerateThumbnail(newUri, docData.id);
                if (regeneratedThumbnail) {
                  console.log(`Regenerated thumbnail: ${regeneratedThumbnail}`);
                  newThumbnail = regeneratedThumbnail;
                  needsUpdate = true;
                  stats.thumbnailsFixed++;
                } else {
                  // Clear invalid thumbnail
                  newThumbnail = null;
                  needsUpdate = true;
                }
              } else {
                // Clear invalid thumbnail for PDFs
                newThumbnail = null;
                needsUpdate = true;
              }
            }
          }
        }

        // Update database if needed
        if (needsUpdate) {
          await this.db.runAsync(
            'UPDATE documents SET uri = ?, thumbnail = ?, updatedAt = ? WHERE id = ?',
            [newUri, newThumbnail, new Date().toISOString(), docData.id]
          );
          console.log(`Updated paths for document ${docData.id}`);
        }
      }

      console.log('🎯 File path recovery completed:', stats);
      
      if (stats.documentsWithIssues.length > 0) {
        console.warn('Documents with unresolved issues:', stats.documentsWithIssues);
      }

      return stats;

    } catch (error) {
      console.error('File path recovery failed:', error);
      throw error;
    }
  }

  // Debug method to reset database (only for development)
  async resetDatabase(): Promise<void> {
    if (this.db) {
      try {
        await this.db.execAsync('DROP TABLE IF EXISTS documents');
        await this.db.execAsync('DROP TABLE IF EXISTS documents_fts');
        await this.db.execAsync('DROP TABLE IF EXISTS categories');
        await this.db.execAsync('DROP TABLE IF EXISTS schema_info');
        console.log('Database reset successfully');
        this.isInitialized = false;
        await this.initialize();
      } catch (error) {
        console.error('Failed to reset database:', error);
      }
    }
  }

  async getStorageStats(): Promise<{
    documentCount: number;
    totalFileSize: number;
    averageFileSize: number;
    documentsWithOCR: number;
    ocrSuccessRate: number;
  }> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Get document count
      const countResult = await this.db.getAllAsync('SELECT COUNT(*) as count FROM documents');
      const documentCount = (countResult[0] as any)?.count || 0;

      if (documentCount === 0) {
        return {
          documentCount: 0,
          totalFileSize: 0,
          averageFileSize: 0,
          documentsWithOCR: 0,
          ocrSuccessRate: 0,
        };
      }

      // Get total file size
      const sizeResult = await this.db.getAllAsync('SELECT SUM(fileSize) as totalSize FROM documents WHERE fileSize IS NOT NULL');
      const totalFileSize = (sizeResult[0] as any)?.totalSize || 0;

      // Get OCR statistics
      const ocrResult = await this.db.getAllAsync('SELECT COUNT(*) as ocrCount FROM documents WHERE extractedText IS NOT NULL AND extractedText != ""');
      const documentsWithOCR = (ocrResult[0] as any)?.ocrCount || 0;

      const averageFileSize = documentCount > 0 ? totalFileSize / documentCount : 0;
      const ocrSuccessRate = documentCount > 0 ? (documentsWithOCR / documentCount) * 100 : 0;

      return {
        documentCount,
        totalFileSize,
        averageFileSize,
        documentsWithOCR,
        ocrSuccessRate,
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      throw new Error('Failed to calculate storage statistics');
    }
  }

  async cleanupStorage(): Promise<{
    success: boolean;
    deletedFiles: number;
    reclaimedSpace: number;
  }> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    try {
      // For now, we'll just clean up any orphaned records or temp data
      // In a real implementation, this would clean cache files, thumbnails, etc.
      
      // Clean up documents without valid URIs
      const invalidDocs = await this.db.getAllAsync('SELECT id, fileSize FROM documents WHERE uri IS NULL OR uri = ""');
      let deletedFiles = 0;
      let reclaimedSpace = 0;

      for (const doc of invalidDocs) {
        await this.db.runAsync('DELETE FROM documents WHERE id = ?', [(doc as any).id]);
        deletedFiles++;
        reclaimedSpace += (doc as any).fileSize || 0;
      }

      return {
        success: true,
        deletedFiles,
        reclaimedSpace,
      };
    } catch (error) {
      console.error('Storage cleanup failed:', error);
      return {
        success: false,
        deletedFiles: 0,
        reclaimedSpace: 0,
      };
    }
  }
}

// Singleton instance
export const databaseService = new DocumentService(); 