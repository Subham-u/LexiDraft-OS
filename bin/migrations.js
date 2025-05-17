#!/usr/bin/env node
/**
 * Database Migration Utility Script
 * A simple CLI tool to manage database migrations for LexiDraft
 * 
 * Usage:
 *   node bin/migrations.js generate   - Generate migration files from schema changes
 *   node bin/migrations.js apply      - Apply pending migrations
 *   node bin/migrations.js status     - Show migration status
 *   node bin/migrations.js help       - Show this help message
 */

require('dotenv').config();
const { exec } = require('child_process');
const { Client } = require('pg');
const path = require('path');
const fs = require('fs');

// Ensure DATABASE_URL environment variable is set
if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Parse command-line arguments
const command = process.argv[2] || 'help';

// Show help message
function showHelp() {
  console.log(`
LexiDraft Database Migration Utility

Usage:
  node bin/migrations.js generate   - Generate migration files from schema changes
  node bin/migrations.js apply      - Apply pending migrations
  node bin/migrations.js status     - Show migration status
  node bin/migrations.js help       - Show this help message
  `);
}

// Generate migration files
function generateMigrations() {
  console.log('Generating migrations...');
  
  // Make sure migrations directory exists
  const migrationsDir = path.join(process.cwd(), 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.log('Creating migrations directory');
    fs.mkdirSync(migrationsDir, { recursive: true });
  }
  
  // Run drizzle-kit generate command
  const command = 'npx drizzle-kit generate:pg';
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error generating migrations: ${error.message}`);
      return;
    }
    
    if (stderr) {
      console.error(`Errors: ${stderr}`);
      return;
    }
    
    console.log('Migration files generated successfully:');
    console.log(stdout);
    
    // List all migration files
    const files = fs.readdirSync(migrationsDir);
    if (files.length === 0) {
      console.log('No migration files found. This likely means no schema changes were detected.');
    } else {
      console.log('Migration files:');
      files.forEach(file => {
        console.log(`- ${file}`);
      });
    }
  });
}

// Apply pending migrations
async function applyMigrations() {
  console.log('Connecting to database...');
  
  const migrationsDir = path.join(process.cwd(), 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.error('ERROR: Migrations directory does not exist. Run generate first.');
    process.exit(1);
  }
  
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
    
    // Sort migration files
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

// Show migration status
async function showMigrationStatus() {
  console.log('Checking migration status...');
  
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
      console.log('No migrations have been applied yet');
      return;
    }
    
    // Show migration history
    const { rows: migrations } = await client.query(`
      SELECT id, hash, created_at
      FROM __drizzle_migrations
      ORDER BY created_at DESC;
    `);
    
    if (migrations.length === 0) {
      console.log('No migrations have been applied yet');
      return;
    }
    
    console.log('Applied migrations:');
    migrations.forEach(m => {
      console.log(`- ${m.hash} (applied on ${new Date(m.created_at).toISOString()})`);
    });
    
    // List pending migrations
    const migrationsDir = path.join(process.cwd(), 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations directory found');
      return;
    }
    
    const appliedHashes = migrations.map(m => m.hash);
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'));
    
    const pendingMigrations = migrationFiles.filter(file => {
      const hash = file.split('_')[0];
      return !appliedHashes.includes(hash);
    });
    
    if (pendingMigrations.length === 0) {
      console.log('No pending migrations');
    } else {
      console.log('\nPending migrations:');
      pendingMigrations.forEach(file => {
        console.log(`- ${file}`);
      });
    }
    
  } catch (error) {
    console.error('Error checking migration status:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Execute the appropriate command
switch (command) {
  case 'generate':
    generateMigrations();
    break;
  case 'apply':
    applyMigrations();
    break;
  case 'status':
    showMigrationStatus();
    break;
  case 'help':
  default:
    showHelp();
    break;
}