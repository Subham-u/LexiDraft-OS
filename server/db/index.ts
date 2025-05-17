/**
 * Database connection configuration
 */
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '../../shared/schema';
import { createLogger } from '../utils/logger';

// Configure Neon to use WebSockets
neonConfig.webSocketConstructor = ws;

const logger = createLogger('database');

// Ensure database URL is provided
if (!process.env.DATABASE_URL) {
  logger.error('DATABASE_URL environment variable is missing');
  throw new Error('DATABASE_URL must be set. Database connection cannot be established.');
}

// Create connection pool
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Configure connection pooling
  max: 10, // Maximum number of clients
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait for connection
});

// Test connection on startup
(async () => {
  try {
    const client = await pool.connect();
    logger.info('Successfully connected to database');
    client.release();
  } catch (err) {
    logger.error('Failed to connect to database', err);
    process.exit(1); // Exit if we can't connect to the database
  }
})();

// Create Drizzle ORM instance
export const db = drizzle(pool, { schema });

// Export a function to get a client for transaction support
export async function withTransaction<T>(callback: (tx: typeof db) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const tx = drizzle(client, { schema });
    const result = await callback(tx);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}