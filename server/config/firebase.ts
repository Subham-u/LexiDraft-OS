/**
 * Firebase configuration
 * Note: Firebase Admin SDK has been temporarily disabled in favor of JWT-based authentication
 */
import { createLogger } from '../utils/logger';
// import { initializeApp, getApps, cert } from 'firebase-admin/app';
// import { getAuth } from 'firebase-admin/auth';

const logger = createLogger('firebase-config');

// Initialize Firebase Admin SDK
// let auth;

// try {
//   // Check if Firebase is already initialized
//   if (getApps().length === 0) {
//     // Initialize Firebase Admin SDK with service account
//     const serviceAccount = {
//       projectId: process.env.FIREBASE_PROJECT_ID,
//       clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
//       privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
//     };

//     if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
//       logger.warn('Firebase credentials not found. Using default credentials.');
//       initializeApp();
//     } else {
//       initializeApp({
//         credential: cert(serviceAccount)
//       });
//     }
//   }

//   // Get Auth instance
//   auth = getAuth();
//   logger.info('Firebase Admin SDK initialized successfully');
// } catch (error) {
//   logger.error('Error initializing Firebase Admin SDK', { error });
//   // Initialize with default credentials as fallback
//   if (getApps().length === 0) {
//     initializeApp();
//     auth = getAuth();
//     logger.info('Firebase Admin SDK initialized with default credentials');
//   }
// }

// Placeholder for future Firebase client SDK integration if needed
export const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// export { auth };
logger.info('Firebase configuration loaded (Admin SDK disabled)'); 