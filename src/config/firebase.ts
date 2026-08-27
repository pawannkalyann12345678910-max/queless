import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';

// Firebase configuration from environment or fallback default project
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForLocalDevelopmentAndAuth123",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "queless-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "queless-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "queless-app.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:abcdef123456"
};

let app: any = null;
let auth: any = null;
let googleProvider: any = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });
  
  // Set persistent session in browser so user stays logged in across tabs & restarts
  setPersistence(auth, browserLocalPersistence).catch((err: any) => {
    console.warn('Firebase persistence setup notice:', err.message);
  });
} catch (e) {
  console.warn('Firebase app initialization notice (Running with local auth engine):', e);
}

export { auth, googleProvider, signInWithPopup, fbSignOut, onAuthStateChanged };
export type { FirebaseUser };
