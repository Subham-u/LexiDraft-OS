/**
 * Firebase Admin SDK initialization
 * Note: Temporarily disabled in favor of JWT-based authentication
 */
// import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { createLogger } from '../utils/logger';

const logger = createLogger('firebase-service');

// Initialize Firebase Admin SDK
export function initializeFirebaseAdmin() {
  logger.info('Firebase Admin SDK initialization disabled');
  return null;
  
  // try {
  //   // Check if necessary environment variables are set
  //   if (!process.env.VITE_FIREBASE_PROJECT_ID) {
  //     throw new Error('Firebase project ID not found in environment variables');
  //   }

  //   // For secure deployments, we should use a service account private key
  //   // For development and testing, we can use the application default credentials
  //   const firebaseConfig: ServiceAccount = {
  //     projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  //     clientEmail: process.env.FIREBASE_CLIENT_EMAIL || undefined,
  //     privateKey: process.env.FIREBASE_PRIVATE_KEY ? 
  //       process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined
  //   };

  //   // Initialize Firebase Admin SDK
  //   const app = initializeApp({
  //     credential: cert(firebaseConfig as ServiceAccount)
  //   });

  //   logger.info('Firebase Admin SDK initialized successfully');
    
  //   return app;
  // } catch (error) {
  //   logger.error('Failed to initialize Firebase Admin SDK', error);
    
  //   // For development purposes, we can fall back to application default credentials
  //   logger.info('Attempting to initialize with application default credentials');
  //   try {
  //     const app = initializeApp();
  //     logger.info('Firebase Admin SDK initialized with default credentials');
  //     return app;
  //   } catch (fallbackError) {
  //     logger.error('Failed to initialize with default credentials', fallbackError);
  //     throw new Error('Firebase Admin initialization failed');
  //   }
  // }
}