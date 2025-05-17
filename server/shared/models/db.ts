import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../../../shared/schema";
import { DB_CONFIG } from '../config';

// Configure WebSocket for Neon database
neonConfig.webSocketConstructor = ws;

// Create database connection pool
let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

/**
 * Initialize the database connection pool
 * @returns Whether the database was successfully initialized
 */
export function initializeDatabase(): boolean {
  try {
    if (!DB_CONFIG.url) {
      console.error("Database URL is not set. Database features will be unavailable.");
      return false;
    }
    
    pool = new Pool({ connectionString: DB_CONFIG.url });
    db = drizzle(pool, { schema });
    
    console.log("Database connection pool initialized successfully");
    return true;
  } catch (error) {
    console.error("Failed to initialize database:", error);
    return false;
  }
}

/**
 * Get the database instance
 * @returns The drizzle database instance
 * @throws Error if database is not initialized
 */
export function getDB() {
  if (!db) {
    throw new Error("Database is not initialized. Call initializeDatabase() first.");
  }
  return db;
}

/**
 * Close the database connection pool
 */
export async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
    console.log("Database connection pool closed");
  }
}

// Initialize the database on module import
initializeDatabase();

export { db };