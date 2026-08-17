// Firebase client — auth, Firestore, Storage. The web API key is public by
// design (security lives in Firebase rules); override any value with
// NEXT_PUBLIC_* env vars on Vercel without touching code.
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ??
    "AIzaSyAIXhjYZWxiQyfzGA3an3_tnVDshdUkJqc",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "opaque-3964b.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "opaque-3964b",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    "opaque-3964b.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID ?? "216863331433",
  ...(process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    ? { appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID }
    : {}),
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
