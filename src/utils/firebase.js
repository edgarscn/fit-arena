import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

// Firebase configuration using environment variables or placeholders
const firebaseConfig = {
  apiKey: process.env.GATSBY_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: process.env.GATSBY_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: process.env.GATSBY_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: process.env.GATSBY_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: process.env.GATSBY_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: process.env.GATSBY_FIREBASE_APP_ID || "YOUR_APP_ID"
};

let app;
let auth;
let db;

// Safety check for Gatsby SSG build env (node.js) vs client-side browser execution
if (typeof window !== 'undefined') {
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
