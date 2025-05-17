/**
 * Apply database migrations
 * 
 * This script applies all pending migrations to the database.
 * Run with: node scripts/apply-migrations.js
 */
require('dotenv').config();
const { migrate } = require('drizzle-orm/postgres-js/migrator');
const { Client } = require('pg');
const path = require('path');
const fs = require('fs');

// Ensure DATABASE_URL environment variable is set
if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Make sure migrations directory exists
const migrationsDir = path.join(process.cwd(), 'migrations');
if (!fs.existsSync(migrationsDir)) {
  console.error('ERROR: Migrations directory does not exist. Run generate-migrations.js first.');
  process.exit(1);
}

async function applyMigrations() {
  console.log('Connecting to database...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Check if drizzle migrations table exists
    const { rows } = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '__drizzle_migrations'
      );
    `);
    
    const migrationsTableExists = rows[0].exists;
    
    if (!migrationsTableExists) {
      console.log('Migrations table does not exist, will be created during migration');
    } else {
      console.log('Migrations table already exists');
      
      // Show migration history
      const { rows: migrations } = await client.query(`
        SELECT id, hash, created_at
        FROM __drizzle_migrations
        ORDER BY created_at DESC;
      `);
      
      console.log('Migration history:');
      migrations.forEach(m => {
        console.log(`- ${m.id} (${new Date(m.created_at).toISOString()})`);
      });
    }
    
    console.log('Applying migrations...');
    
    // Instead of the actual migrate function (which requires drizzle-orm setup),
    // Here's how to execute SQL migration files manually:
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to ensure proper order
    
    if (migrationFiles.length === 0) {
      console.log('No migration files found.');
      return;
    }
    
    console.log(`Found ${migrationFiles.length} migration files`);
    
    // Use a transaction for all migrations
    await client.query('BEGIN');
    
    try {
      // Create migrations table if it doesn't exist
      if (!migrationsTableExists) {
        await client.query(`
          CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
            id SERIAL PRIMARY KEY,
            hash text NOT NULL,
            created_at timestamp with time zone DEFAULT now()
          );
        `);
      }
      
      // Check which migrations have already been applied
      const { rows: appliedMigrations } = await client.query(
        'SELECT hash FROM "__drizzle_migrations"'
      );
      const appliedHashes = appliedMigrations.map(m => m.hash);
      
      // Apply each migration file that hasn't been applied yet
      for (const file of migrationFiles) {
        const filePath = path.join(migrationsDir, file);
        const hash = file.split('_')[0]; // Migration hash is usually the first part of the filename
        
        if (appliedHashes.includes(hash)) {
          console.log(`Migration ${file} already applied, skipping`);
          continue;
        }
        
        console.log(`Applying migration: ${file}`);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        await client.query(sql);
        
        // Record the migration
        await client.query(
          'INSERT INTO "__drizzle_migrations" (hash) VALUES ($1)',
          [hash]
        );
        
        console.log(`Migration ${file} applied successfully`);
      }
      
      await client.query('COMMIT');
      console.log('All migrations applied successfully');
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error applying migrations:', error);
      throw error;
    }
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigrations();