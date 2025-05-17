/**
 * Database migrations utility
 */
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { db, pool } from './index';
import { createLogger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

const logger = createLogger('migrations');

/**
 * Apply all pending migrations from the migrations folder
 */
export async function applyMigrations() {
  logger.info('Starting database migrations');
  
  try {
    // Check if migrations directory exists
    const migrationsDir = path.join(process.cwd(), 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      logger.warn('Migrations directory not found, creating it');
      fs.mkdirSync(migrationsDir, { recursive: true });
    }
    
    // Run migrations
    await migrate(db, { migrationsFolder: 'migrations' });
    
    logger.info('Database migrations completed successfully');
  } catch (error) {
    logger.error('Error applying migrations', error);
    throw error;
  }
}

/**
 * Create migrations table and run initial migration if needed
 */
export async function initializeMigrations() {
  logger.info('Initializing migrations system');
  
  try {
    // Check if migrations have been applied
    const client = await pool.connect();
    try {
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
        logger.info('Migrations table does not exist, will be created during first migration');
      } else {
        logger.info('Migrations table already exists');
      }
      
      // Apply any pending migrations
      await applyMigrations();
      
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Error initializing migrations', error);
    throw error;
  }
}

/**
 * Get migration status (for admin dashboard)
 */
export async function getMigrationStatus() {
  logger.info('Getting migration status');
  
  try {
    const client = await pool.connect();
    try {
      // Check if drizzle migrations table exists
      const { rows: tableCheck } = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '__drizzle_migrations'
        );
      `);
      
      const migrationsTableExists = tableCheck[0].exists;
      
      if (!migrationsTableExists) {
        return { initialized: false, migrations: [] };
      }
      
      // Get list of applied migrations
      const { rows: migrations } = await client.query(`
        SELECT id, hash, created_at
        FROM __drizzle_migrations
        ORDER BY created_at DESC;
      `);
      
      return { 
        initialized: true, 
        migrations: migrations.map(m => ({
          id: m.id,
          hash: m.hash,
          createdAt: m.created_at
        }))
      };
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Error getting migration status', error);
    throw error;
  }
}