/**
 * Database configuration for LexiDraft
 */

// Export database configuration
export const DATABASE_CONFIG = {
  url: process.env.DATABASE_URL,
  maxConnections: process.env.DB_MAX_CONNECTIONS ? parseInt(process.env.DB_MAX_CONNECTIONS) : 10,
  idleTimeout: process.env.DB_IDLE_TIMEOUT ? parseInt(process.env.DB_IDLE_TIMEOUT) : 30000
};