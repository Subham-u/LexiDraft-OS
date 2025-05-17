/**
 * Database configuration for LexiDraft
 */

// Environment variables
const DATABASE_URL = process.env.DATABASE_URL;

export const DB_CONFIG = {
  url: DATABASE_URL,
  available: !!DATABASE_URL,
  poolMin: 2,
  poolMax: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
};

// Check database connection status
export function checkDatabaseStatus(): boolean {
  return !!DATABASE_URL;
}

// Database service information
export const getDatabaseInfo = () => ({
  available: DB_CONFIG.available,
  type: 'PostgreSQL',
  poolConfig: {
    min: DB_CONFIG.poolMin,
    max: DB_CONFIG.poolMax
  }
});