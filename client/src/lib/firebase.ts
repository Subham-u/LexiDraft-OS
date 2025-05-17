import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from "firebase/auth";

// Check for required Firebase environment variables
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID'
];

// Verify all required Firebase config variables exist
const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);
if (missingVars.length > 0) {
  console.error(`Missing required Firebase environment variables: ${missingVars.join(', ')}`);
  // Don't throw error here, let Firebase initialization fail naturally
  // This prevents complete app crash in case of minor configuration issues
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Sign in with Google - Changed to popup for more reliable authentication flow in Replit
export const signInWithGoogle = async () => {
  // Using popup instead of redirect for better compatibility in Replit environment
  try {
    console.log("Starting Google sign-in...");
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Google sign-in successful:", result);
    return result;
  } catch (error) {
    console.error("Google sign-in error details:", error);
    throw error;
  }
};

// Sign out
export const logOut = () => {
  return signOut(auth);
};

// Listen to auth state changes
export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export { auth };
