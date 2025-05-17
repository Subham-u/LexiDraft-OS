/**
 * Apply the new tables migration
 * 
 * This script applies the migration to add payment, subscription, analysis, notification
 * and chat tables to the database.
 * Run with: node scripts/apply-new-tables-migration.js
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import ws from 'ws';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Required for Neon serverless
neonConfig.webSocketConstructor = ws;

async function applyMigration() {
  console.log('Starting migration process...');
  
  if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool);
    
    console.log('Connected to database, applying migration...');
    
    // Apply the migration
    await migrate(db, { 
      migrationsFolder: path.join(__dirname, '../migrations'),
      migrationsTable: 'migrations'
    });
    
    console.log('Migration completed successfully');
    
    // Close the database connection
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  }
}

// Run the migration
applyMigration();