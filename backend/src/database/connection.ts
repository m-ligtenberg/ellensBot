import { Pool, PoolClient, QueryResult } from 'pg';
import { sqliteDb } from './sqliteConnection';

export class Database {
  private static instance: Database;
  private pool?: Pool;
  private usingSQLite: boolean;

  private constructor() {
    const databaseUrl = process.env.DATABASE_URL || '';
    this.usingSQLite = databaseUrl.startsWith('sqlite:');

    if (!this.usingSQLite) {
      this.pool = new Pool({
        connectionString: databaseUrl,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: 10, // Reduced from 20 for better resource management
        min: 2,  // Maintain minimum connections
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000, // Increased from 2000ms for better reliability
        // acquireTimeoutMillis not supported in this version
        allowExitOnIdle: true          // Allow pool to close when idle
      });

      // Set up connection pool event handlers
      this.pool.on('error', (err) => {
        console.error('❌ PostgreSQL pool error:', err);
      });

      this.pool.on('connect', () => {
        console.log('🔗 New PostgreSQL client connected');
      });

      this.pool.on('remove', () => {
        console.log('🔌 PostgreSQL client removed from pool');
      });
    }

    // Test connection
    this.testConnection();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private async testConnection(): Promise<void> {
    try {
      if (this.usingSQLite) {
        const healthy = await sqliteDb.healthCheck();
        if (healthy) {
          console.log('✅ SQLite database connected successfully');
        } else {
          console.warn('⚠️ SQLite connection failed - using in-memory fallback');
        }
      } else {
        const client = await this.pool!.connect();
        await client.query('SELECT NOW()');
        client.release();
        console.log('✅ PostgreSQL database connected successfully');
      }
    } catch (error) {
      console.warn('⚠️ Database connection failed - using in-memory fallback:', error);
    }
  }

  public async query(text: string, params?: any[]): Promise<QueryResult> {
    try {
      if (this.usingSQLite) {
        const result = await sqliteDb.query(text, params);
        return {
          rows: result.rows,
          rowCount: result.rowCount,
          command: result.command || '',
          oid: result.oid || 0,
          fields: result.fields || []
        } as QueryResult;
      } else {
        const start = Date.now();
        const result = await this.pool!.query(text, params);
        const duration = Date.now() - start;
        
        if (duration > 1000) {
          console.log('🐌 Slow query detected:', { text, duration, rows: result.rowCount });
        }
        
        return result;
      }
    } catch (error) {
      console.error('❌ Database query error:', error);
      throw error;
    }
  }

  public async getClient(): Promise<PoolClient> {
    if (this.usingSQLite) {
      throw new Error('Transactions not supported with SQLite adapter');
    }
    return this.pool!.connect();
  }

  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    if (this.usingSQLite) {
      throw new Error('Transactions not supported with SQLite adapter');
    }
    
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  public async close(): Promise<void> {
    if (this.usingSQLite) {
      await sqliteDb.close();
    } else {
      await this.pool!.end();
    }
    console.log('🔌 Database connection closed');
  }

  // Health check method
  public async healthCheck(): Promise<boolean> {
    try {
      if (this.usingSQLite) {
        return await sqliteDb.healthCheck();
      } else {
        const result = await this.query('SELECT 1 as health');
        return result.rows.length > 0;
      }
    } catch (error) {
      return false;
    }
  }

  // Get connection pool stats (PostgreSQL only)
  public getPoolStats(): object {
    if (this.usingSQLite) {
      return { type: 'sqlite', status: 'active' };
    }
    
    return {
      type: 'postgresql',
      totalCount: this.pool!.totalCount,
      idleCount: this.pool!.idleCount,
      waitingCount: this.pool!.waitingCount
    };
  }

  // Execute multiple queries in sequence with better error handling
  public async batch(queries: Array<{ text: string; params?: any[] }>): Promise<QueryResult[]> {
    const results: QueryResult[] = [];
    
    for (const query of queries) {
      try {
        const result = await this.query(query.text, query.params);
        results.push(result);
      } catch (error) {
        console.error('❌ Batch query failed:', { query: query.text, error });
        throw error;
      }
    }
    
    return results;
  }
}

// Export singleton instance
export const db = Database.getInstance();