/**
 * Configuration for LexiDraft services
 * This file centralizes all configuration settings
 */

// Environment configuration
export const ENV = process.env.NODE_ENV || 'development';
export const IS_PRODUCTION = ENV === 'production';
export const IS_DEVELOPMENT = ENV === 'development';

// API keys and external service configurations
export const OPENAI_CONFIG = {
  apiKey: process.env.OPENAI_API_KEY,
  available: !!process.env.OPENAI_API_KEY,
  defaultModel: 'gpt-4o' // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
};

export const CASHFREE_CONFIG = {
  appId: process.env.CASHFREE_APP_ID,
  secretKey: process.env.CASHFREE_SECRET_KEY,
  available: !!(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY),
  env: IS_PRODUCTION ? 'PRODUCTION' : 'TEST',
  apiUrls: {
    TEST: 'https://sandbox.cashfree.com/pg',
    PRODUCTION: 'https://api.cashfree.com/pg'
  }
};

export const SENDGRID_CONFIG = {
  apiKey: process.env.SENDGRID_API_KEY,
  available: !!process.env.SENDGRID_API_KEY,
  defaultSender: 'notifications@lexidraft.com'
};

export const FIREBASE_CONFIG = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  available: !!(process.env.VITE_FIREBASE_API_KEY && 
              process.env.VITE_FIREBASE_PROJECT_ID && 
              process.env.VITE_FIREBASE_APP_ID)
};

// Server configuration
export const SERVER_CONFIG = {
  port: 5000,
  host: '0.0.0.0',
  reusePort: true
};

// Database configuration
export const DB_CONFIG = {
  url: process.env.DATABASE_URL,
  available: !!process.env.DATABASE_URL
};

// Authentication configuration
export const AUTH_CONFIG = {
  tokenExpiryTime: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  jwtSecret: process.env.JWT_SECRET || 'lexidraft-dev-secret-key', // Should be set in production
};

// Service status check and logging
export function checkServiceAvailability() {
  return {
    database: DB_CONFIG.available,
    openai: OPENAI_CONFIG.available,
    cashfree: CASHFREE_CONFIG.available,
    sendgrid: SENDGRID_CONFIG.available,
    firebase: FIREBASE_CONFIG.available
  };
}

// Log service availability
export function logServiceStatus() {
  const services = checkServiceAvailability();
  const unavailableServices = Object.entries(services)
    .filter(([_, available]) => !available)
    .map(([name]) => name);

  if (unavailableServices.length > 0) {
    console.warn(`⚠️ WARNING: The following services are unavailable: ${unavailableServices.join(', ')}`);
  } else {
    console.log('✅ All services are available');
  }
}