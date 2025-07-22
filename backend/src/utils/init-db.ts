#!/usr/bin/env node

import { migrator } from '../database/migrator';
import { db } from '../database/connection';

async function initializeDatabase() {
  console.log('🚀 Initializing Young Ellens Database...');
  
  try {
    // Test database connection
    const isHealthy = await db.healthCheck();
    if (!isHealthy) {
      console.log('⚠️ Database connection failed - continuing with in-memory fallback');
      return;
    }

    // Run migrations
    await migrator.runMigrations();
    
    // Log current migration status
    const appliedMigrations = await migrator.getAppliedMigrations();
    console.log(`✅ Database initialized with ${appliedMigrations.length} migrations applied`);
    console.log('Applied migrations:', appliedMigrations);

    console.log('🎉 Database initialization completed successfully!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.log('⚠️ Application will continue with in-memory fallback');
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { initializeDatabase };