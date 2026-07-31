import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

// Firebase configuration using environment variables or project credentials
const firebaseConfig = {
  apiKey: process.env.GATSBY_FIREBASE_API_KEY || "AIzaSyD0_IuVfsdQLvl-3j2MTiL1Wvwrdt0UrPI",
  authDomain: process.env.GATSBY_FIREBASE_AUTH_DOMAIN || "arena-fitness-6f42e.firebaseapp.com",
  projectId: process.env.GATSBY_FIREBASE_PROJECT_ID || "arena-fitness-6f42e",
  storageBucket: process.env.GATSBY_FIREBASE_STORAGE_BUCKET || "arena-fitness-6f42e.firebasestorage.app",
  messagingSenderId: process.env.GATSBY_FIREBASE_MESSAGING_SENDER_ID || "124348520104",
  appId: process.env.GATSBY_FIREBASE_APP_ID || "1:124348520104:web:9c96b934d256b1a9c6949d"
};

export const isFirebasePending = 
  !firebaseConfig.apiKey || 
  firebaseConfig.apiKey === "YOUR_API_KEY" || 
  firebaseConfig.apiKey.includes("YOUR_");

let app;
let auth;
let db;

// Safety check for Gatsby SSG build env (node.js) vs client-side browser execution
if (typeof window !== 'undefined' && !isFirebasePending) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);

    // Enable offline persistence for Firestore
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time.
        console.warn('Firestore offline persistence failed: Multiple tabs open.');
      } else if (err.code === 'unimplemented') {
        // The current browser does not support all of the features required to enable persistence
        console.warn('Firestore offline persistence not supported by current browser.');
      }
    });
  } catch (error) {
    console.error('Failed to initialize Firebase. Please verify project API keys.', error);
  }
}

export { auth, db };
export default app;
