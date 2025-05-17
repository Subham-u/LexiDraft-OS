/**
 * User service configuration
 */
import { ENV, IS_PRODUCTION } from '../../../shared/config/service';

export const config = {
  port: process.env.USER_SERVICE_PORT 
    ? parseInt(process.env.USER_SERVICE_PORT) 
    : 0, // Will be assigned dynamically
  serviceName: 'user-service',
  version: '1.0.0',
  auth: {
    tokenExpiryTime: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    jwtSecret: process.env.JWT_SECRET || 'lexidraft-dev-secret-key', // Should be set in production
  },
  firebase: {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
    available: !!(process.env.VITE_FIREBASE_API_KEY && 
                process.env.VITE_FIREBASE_PROJECT_ID && 
                process.env.VITE_FIREBASE_APP_ID)
  }
};