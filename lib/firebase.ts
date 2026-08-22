// Firebase client for the OAISIS Labs project (its own, separate from any
// other app). Web config is public by design; env vars override if set.
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Static process.env.NEXT_PUBLIC_* references only — Next inlines these at
// build time; dynamic lookups would be empty in the browser.
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBVf5vnHNjBmjsF7K8ehyjkOTCoYe3xbwM",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "oaisislabs.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "oaisislabs",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "oaisislabs.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID || "72501085752",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:72501085752:web:a930532db1201c93e8c8cd",
};

export const firebaseConfigured = true;

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
