/**
 * Schema audit and versioning functionality
 * Tracks schema changes and maintains version history
 */
import { db, pool } from './index';
import { sql } from 'drizzle-orm';
import { createLogger } from '../utils/logger';

const logger = createLogger('schema-audit');

interface SchemaVersion {
  id: number;
  version: string;
  description: string;
  appliedBy: string;
  appliedAt: Date;
}

/**
 * Initialize the schema version table if it doesn't exist
 */
export async function initSchemaVersioning(): Promise<void> {
  logger.info('Initializing schema versioning');
  
  try {
    const client = await pool.connect();
    try {
      // Check if schema version table exists
      const { rows } = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'schema_versions'
        );
      `);
      
      const tableExists = rows[0].exists;
      
      if (!tableExists) {
        logger.info('Creating schema_versions table');
        
        // Create the schema_versions table
        await client.query(`
          CREATE TABLE schema_versions (
            id SERIAL PRIMARY KEY,
            version VARCHAR(50) NOT NULL,
            description TEXT NOT NULL,
            applied_by VARCHAR(100) NOT NULL,
            applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
          );
        `);
        
        // Insert initial version
        await client.query(`
          INSERT INTO schema_versions (version, description, applied_by)
          VALUES ('1.0.0', 'Initial schema creation', 'system');
        `);
        
        logger.info('Schema versioning initialized with version 1.0.0');
      } else {
        logger.info('Schema versioning is already initialized');
      }
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Error initializing schema versioning', error);
    throw error;
  }
}

/**
 * Get the current schema version
 */
export async function getCurrentSchemaVersion(): Promise<SchemaVersion | null> {
  logger.info('Getting current schema version');
  
  try {
    const client = await pool.connect();
    try {
      // Check if schema_versions table exists
      const { rows: tableCheck } = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'schema_versions'
        );
      `);
      
      const tableExists = tableCheck[0].exists;
      
      if (!tableExists) {
        logger.info('Schema versioning not initialized');
        return null;
      }
      
      // Get the latest schema version
      const { rows } = await client.query(`
        SELECT id, version, description, applied_by as "appliedBy", applied_at as "appliedAt"
        FROM schema_versions
        ORDER BY id DESC
        LIMIT 1;
      `);
      
      if (rows.length === 0) {
        return null;
      }
      
      return rows[0] as SchemaVersion;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Error getting current schema version', error);
    throw error;
  }
}

/**
 * Record a new schema version
 */
export async function recordSchemaVersion(version: string, description: string, appliedBy: string): Promise<SchemaVersion> {
  logger.info(`Recording new schema version: ${version}`);
  
  try {
    const client = await pool.connect();
    try {
      // Check if schema_versions table exists
      const { rows: tableCheck } = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'schema_versions'
        );
      `);
      
      const tableExists = tableCheck[0].exists;
      
      // Create the table if it doesn't exist
      if (!tableExists) {
        await initSchemaVersioning();
      }
      
      // Insert the new version
      const { rows } = await client.query(`
        INSERT INTO schema_versions (version, description, applied_by)
        VALUES ($1, $2, $3)
        RETURNING id, version, description, applied_by as "appliedBy", applied_at as "appliedAt";
      `, [version, description, appliedBy]);
      
      return rows[0] as SchemaVersion;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error(`Error recording schema version ${version}`, error);
    throw error;
  }
}

/**
 * Get all schema versions
 */
export async function getSchemaVersionHistory(): Promise<SchemaVersion[]> {
  logger.info('Getting schema version history');
  
  try {
    const client = await pool.connect();
    try {
      // Check if schema_versions table exists
      const { rows: tableCheck } = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'schema_versions'
        );
      `);
      
      const tableExists = tableCheck[0].exists;
      
      if (!tableExists) {
        logger.info('Schema versioning not initialized');
        return [];
      }
      
      // Get all schema versions
      const { rows } = await client.query(`
        SELECT id, version, description, applied_by as "appliedBy", applied_at as "appliedAt"
        FROM schema_versions
        ORDER BY id DESC;
      `);
      
      return rows as SchemaVersion[];
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Error getting schema version history', error);
    throw error;
  }
}