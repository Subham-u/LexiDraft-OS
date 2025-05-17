/**
 * Central configuration for LexiDraft
 * Exports all configuration settings from individual modules
 */

export * from './service';
export * from './database';
export * from './redis';

import { ENV, IS_PRODUCTION } from './service';
import { DB_CONFIG } from './database';
import { REDIS_CONFIG } from './redis';

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

// Service status check and logging
export function checkServiceAvailability() {
  return {
    database: DB_CONFIG.available,
    redis: REDIS_CONFIG.available,
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