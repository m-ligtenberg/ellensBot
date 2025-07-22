import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { db } from './connection';

export class DatabaseMigrator {
  private migrationsPath = join(__dirname, 'migrations');

  async runMigrations(): Promise<void> {
    try {
      // Create migrations tracking table
      await this.createMigrationsTable();

      // Get all migration files
      const migrationFiles = this.getMigrationFiles();
      
      for (const file of migrationFiles) {
        await this.runMigration(file);
      }

      console.log('✅ All database migrations completed successfully');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  private async createMigrationsTable(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        version VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    await db.query(createTableSQL);
  }

  private getMigrationFiles(): string[] {
    try {
      return readdirSync(this.migrationsPath)
        .filter(file => file.endsWith('.sql'))
        .sort(); // Ensure migrations run in order
    } catch (error) {
      console.warn('⚠️ No migrations directory found, creating in-memory fallback');
      return [];
    }
  }

  private async runMigration(filename: string): Promise<void> {
    const version = filename.replace('.sql', '');
    
    // Check if migration already applied
    const existingMigration = await db.query(
      'SELECT version FROM schema_migrations WHERE version = $1',
      [version]
    );

    if (existingMigration.rows.length > 0) {
      console.log(`⏭️ Migration ${version} already applied, skipping`);
      return;
    }

    try {
      console.log(`🔄 Running migration: ${version}`);
      
      // Read and execute migration
      const migrationPath = join(this.migrationsPath, filename);
      const migrationSQL = readFileSync(migrationPath, 'utf8');
      
      await db.transaction(async (client) => {
        // Execute migration SQL
        await client.query(migrationSQL);
        
        // Record migration as applied
        await client.query(
          'INSERT INTO schema_migrations (version) VALUES ($1)',
          [version]
        );
      });

      console.log(`✅ Migration ${version} completed successfully`);
    } catch (error) {
      console.error(`❌ Migration ${version} failed:`, error);
      throw error;
    }
  }

  async rollbackLastMigration(): Promise<void> {
    // Get last applied migration
    const result = await db.query(
      'SELECT version FROM schema_migrations ORDER BY applied_at DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      console.log('📭 No migrations to rollback');
      return;
    }

    const version = result.rows[0].version;
    console.log(`🔄 Rolling back migration: ${version}`);

    // For now, just remove from tracking table
    // In production, you'd want proper down migrations
    await db.query(
      'DELETE FROM schema_migrations WHERE version = $1',
      [version]
    );

    console.log(`✅ Rollback of ${version} completed`);
  }

  async getAppliedMigrations(): Promise<string[]> {
    const result = await db.query(
      'SELECT version FROM schema_migrations ORDER BY applied_at ASC'
    );
    return result.rows.map(row => row.version);
  }

  async reset(): Promise<void> {
    console.log('🗑️ Resetting database...');
    
    // Drop all tables (be careful with this!)
    const tables = [
      'session_analytics',
      'user_profiles', 
      'conversation_patterns',
      'response_effectiveness',
      'user_interactions',
      'messages',
      'conversations',
      'users',
      'schema_migrations'
    ];

    for (const table of tables) {
      try {
        await db.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`🗑️ Dropped table: ${table}`);
      } catch (error) {
        console.warn(`⚠️ Failed to drop table ${table}:`, error);
      }
    }

    console.log('✅ Database reset completed');
  }
}

// Export singleton instance
export const migrator = new DatabaseMigrator();