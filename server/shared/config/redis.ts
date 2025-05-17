/**
 * Redis configuration for LexiDraft
 * Used for caching and session management
 */

// Environment variables
const REDIS_URL = process.env.REDIS_URL;

export const REDIS_CONFIG = {
  url: REDIS_URL,
  available: !!REDIS_URL,
  // Default configuration if not using URL
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
  password: process.env.REDIS_PASSWORD,
  // Connection options
  retryStrategy: (times: number) => Math.min(times * 50, 2000), // Retry with exponential backoff
  maxRetriesPerRequest: 3
};

// Session cache configuration
export const SESSION_CONFIG = {
  prefix: 'lexidraft:session:',
  ttl: 86400, // 24 hours in seconds
  rolling: true,
  resave: false,
  saveUninitialized: false
};

// Data cache configuration
export const CACHE_CONFIG = {
  prefix: 'lexidraft:cache:',
  defaultTTL: 300, // 5 minutes in seconds
  // TTL for specific data types
  ttl: {
    templates: 3600, // 1 hour
    lawyers: 1800, // 30 minutes
    contracts: 300, // 5 minutes
    users: 600 // 10 minutes
  }
};