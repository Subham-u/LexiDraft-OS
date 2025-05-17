/**
 * Shared configuration for LexiDraft
 * Main config file that exports all configuration settings
 */

// Server configuration
export const SERVER_CONFIG = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 5000,
  host: process.env.HOST || '0.0.0.0',
  env: process.env.NODE_ENV || 'development',
  apiPrefix: '/api',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5000'
};

// Database configuration 
export const DATABASE_CONFIG = {
  url: process.env.DATABASE_URL,
  maxConnections: process.env.DB_MAX_CONNECTIONS ? parseInt(process.env.DB_MAX_CONNECTIONS) : 10,
  idleTimeout: process.env.DB_IDLE_TIMEOUT ? parseInt(process.env.DB_IDLE_TIMEOUT) : 30000
};

// Security configuration
export const SECURITY_CONFIG = {
  jwtSecret: process.env.JWT_SECRET || 'lexidraft-dev-jwt-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  bcryptSaltRounds: 10
};

// Email configuration
export const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || 'noreply@lexidraft.app',
  sendgridApiKey: process.env.SENDGRID_API_KEY
};

// Export service information
export { SERVICES } from './service';

// Utility function to log service status
export function logServiceStatus(name: string, port: number) {
  console.log(`✨ ${name} running on port ${port}`);
}

// Export all configurations
export default {
  server: SERVER_CONFIG,
  database: DATABASE_CONFIG,
  security: SECURITY_CONFIG,
  email: EMAIL_CONFIG
};