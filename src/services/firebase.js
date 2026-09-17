import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig, isMockFirebase } from '../config/firebaseConfig';

let app;
let auth;
let db;
let storage;

if (!isMockFirebase()) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    
    // Initialize Auth with React Native AsyncStorage persistence
    try {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch (e) {
      // If auth was already initialized
      auth = getAuth(app);
    }

    db = getFirestore(app);
    storage = getStorage(app);
    console.log('[ALAGA Firebase] Successfully connected to live Firebase project:', firebaseConfig.projectId);
  } catch (error) {
    console.warn('[ALAGA Firebase] Live initialization error, using fallback:', error.message);
  }
} else {
  console.log('[ALAGA Firebase] Running with local mock persistence (Placeholder credentials in firebaseConfig.js)');
}

export { app, auth, db, storage };
export default app;
