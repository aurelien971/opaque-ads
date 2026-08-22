// Verifies the Firebase ID token a route received as "Authorization: Bearer".
import { adminAuth } from "./admin";

export async function uidFromRequest(req: Request): Promise<string | null> {
  const h = req.headers.get("authorization") ?? "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (!token) return null;
  try {
    return (await adminAuth().verifyIdToken(token)).uid;
  } catch (e) {
    // Server misconfiguration must surface as a readable error, not a crash.
    if (e instanceof Error && e.message.includes("FIREBASE_SERVICE_ACCOUNT")) throw e;
    return null;
  }
}
