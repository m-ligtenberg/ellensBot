import * as sqlite3 from 'sqlite3';
import { promisify } from 'util';

interface SQLiteQueryResult {
  rows: any[];
  rowCount: number;
  command?: string;
  oid?: number;
  fields?: any[];
}

export class SQLiteDatabase {
  private static instance: SQLiteDatabase;
  private db: sqlite3.Database;
  private ready: boolean = false;

  private constructor() {
    const dbPath = process.env.DATABASE_URL?.replace('sqlite:', '') || './ellens_dev.db';
    
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.warn('⚠️ SQLite connection failed - using in-memory fallback:', err);
        this.db = new sqlite3.Database(':memory:');
      } else {
        console.log('✅ SQLite database connected successfully');
      }
      this.ready = true;
      this.initializeTables();
    });
  }

  public static getInstance(): SQLiteDatabase {
    if (!SQLiteDatabase.instance) {
      SQLiteDatabase.instance = new SQLiteDatabase();
    }
    return SQLiteDatabase.instance;
  }

  private async initializeTables(): Promise<void> {
    try {
      // Basic tables for fallback functionality
      await this.query(`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          conversation_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_active DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await this.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          session_id TEXT,
          sender TEXT,
          content TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (session_id) REFERENCES sessions (id)
        )
      `);

      console.log('✅ SQLite tables initialized');
    } catch (error) {
      console.error('❌ Failed to initialize SQLite tables:', error);
    }
  }

  public async query(sql: string, params: any[] = []): Promise<SQLiteQueryResult> {
    return new Promise((resolve, reject) => {
      if (!this.ready) {
        return reject(new Error('Database not ready'));
      }

      const start = Date.now();

      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        this.db.all(sql, params, (err, rows) => {
          const duration = Date.now() - start;
          if (duration > 1000) {
            console.log('🐌 Slow query detected:', { sql, duration, rows: rows?.length });
          }

          if (err) {
            console.error('❌ SQLite query error:', err);
            reject(err);
          } else {
            resolve({ rows: rows || [], rowCount: rows?.length || 0 });
          }
        });
      } else {
        this.db.run(sql, params, function(err) {
          const duration = Date.now() - start;
          if (duration > 1000) {
            console.log('🐌 Slow query detected:', { sql, duration, changes: this.changes });
          }

          if (err) {
            console.error('❌ SQLite query error:', err);
            reject(err);
          } else {
            resolve({ rows: [], rowCount: this.changes || 0 });
          }
        });
      }
    });
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1 as health');
      return result.rows.length > 0;
    } catch (error) {
      return false;
    }
  }

  public async close(): Promise<void> {
    return new Promise((resolve) => {
      this.db.close(() => {
        console.log('🔌 SQLite database connection closed');
        resolve();
      });
    });
  }
}

export const sqliteDb = SQLiteDatabase.getInstance();