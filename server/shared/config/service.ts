/**
 * Service configuration for LexiDraft
 */

// Environment configuration
export const ENV = process.env.NODE_ENV || 'development';
export const IS_PRODUCTION = ENV === 'production';
export const IS_DEVELOPMENT = ENV === 'development';

// Server configuration
export const SERVER_CONFIG = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 5000,
  host: '0.0.0.0',
  reusePort: true,
  basePath: '/api'
};

// Services configuration with auto port assignment
export const SERVICES = {
  // Static port assignment
  gateway: {
    port: SERVER_CONFIG.port,
    path: '/'
  },
  // Dynamic port assignments - will be assigned at runtime
  user: {
    port: 0, // Will be assigned at runtime
    path: '/user'
  },
  lawyer: {
    port: 0,
    path: '/lawyers'
  },
  client: {
    port: 0,
    path: '/clients'
  },
  contract: {
    port: 0,
    path: '/contracts'
  },
  consultation: {
    port: 0,
    path: '/consultations'
  },
  payment: {
    port: 0,
    path: '/payments'
  },
  ai: {
    port: 0,
    path: '/ai'
  },
  notification: {
    port: 0,
    path: '/notifications'
  },
  search: {
    port: 0,
    path: '/search'
  }
};

// Common service configuration
export const SERVICE_CONFIG = {
  timeout: 30000, // 30 seconds timeout for service calls
  retries: 3, // Number of retries for failed service calls
};