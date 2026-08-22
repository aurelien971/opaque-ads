// Firebase Admin for server routes (scheduler, cron). Needs the project's
// service-account JSON in FIREBASE_SERVICE_ACCOUNT (the whole file, as one
// string) — set on Vercel, never committed.
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

let app: App | null = null;

export function adminApp(): App {
  if (app) return app;
  if (getApps().length) return (app = getApps()[0]);
  // Prefer the base64 form (paste-proof); fall back to raw JSON.
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  const raw = b64
    ? Buffer.from(b64, "base64").toString("utf8")
    : process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT(_B64) is not set on the server.");
  let sa: { project_id?: string; client_email?: string; private_key?: string };
  try {
    sa = JSON.parse(raw);
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT is not valid JSON — use FIREBASE_SERVICE_ACCOUNT_B64 instead.");
  }
  if (!sa.private_key || !sa.client_email) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT is missing private_key/client_email.");
  }
  app = initializeApp({
    credential: cert(sa as import("firebase-admin/app").ServiceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
  return app;
}

export const adminAuth = () => getAuth(adminApp());
export const adminDb = () => getFirestore(adminApp());
export const adminStorage = () => getStorage(adminApp());
