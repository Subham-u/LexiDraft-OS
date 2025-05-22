/**
 * Database connection configuration
 */
import { Pool, neonConfig, PoolClient } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '../../shared/schema';
import { createLogger } from '../utils/logger';
import 'dotenv/config';

// Configure Neon to use WebSockets with proper error handling
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true; // Enable secure WebSocket
neonConfig.pipelineTLS = true; // Enable TLS for pipeline
neonConfig.pipelineConnect = false; // Disable pipeline connect to avoid WebSocket issues

const logger = createLogger('database');

// Ensure database URL is provided and properly formatted
if (!process.env.DATABASE_URL) {
  logger.error('DATABASE_URL environment variable is missing');
  throw new Error('DATABASE_URL must be set. Database connection cannot be established.');
}

// Validate DATABASE_URL format
if (!process.env.DATABASE_URL.startsWith('postgresql://')) {
  logger.error('Invalid DATABASE_URL format. Must start with postgresql://');
  throw new Error('Invalid DATABASE_URL format. Must start with postgresql://');
}

// Create connection pool with enhanced configuration
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Enhanced connection pooling configuration
  max: 10, // Maximum number of clients
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 5000, // Increased timeout for connection
  ssl: {
    rejectUnauthorized: true // Ensure SSL verification
  }
});

// Test connection on startup with retry logic
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

async function testConnection(retryCount = 0): Promise<void> {
  try {
    const client = await pool.connect();
    logger.info('Successfully connected to database');
    client.release();
  } catch (err) {
    logger.error(`Failed to connect to database (attempt ${retryCount + 1}/${MAX_RETRIES})`, err);
    
    if (retryCount < MAX_RETRIES - 1) {
      logger.info(`Retrying connection in ${RETRY_DELAY}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return testConnection(retryCount + 1);
    }
    
    logger.error('Max retries reached. Could not establish database connection.');
    process.exit(1);
  }
}

// Initialize connection
testConnection();

// Create Drizzle ORM instance
export const db = drizzle(pool, { schema });

// Export a function to get a client for transaction support
export async function withTransaction<T>(callback: (tx: ReturnType<typeof drizzle<typeof schema>>) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const tx = drizzle(client as unknown as Pool, { schema });
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