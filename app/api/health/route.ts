// Server self-check: which env vars exist, whether firebase-admin loads and
// initializes, whether Firestore answers. Safe to expose — no secrets echoed.
import { NextResponse } from "next/server";

export async function GET() {
  const report: Record<string, unknown> = {
    env: {
      FIREBASE_SERVICE_ACCOUNT_B64: !!process.env.FIREBASE_SERVICE_ACCOUNT_B64,
      FIREBASE_SERVICE_ACCOUNT: !!process.env.FIREBASE_SERVICE_ACCOUNT,
      NEXT_PUBLIC_TIKTOK_CLIENT_KEY: !!process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY,
      TIKTOK_CLIENT_SECRET: !!process.env.TIKTOK_CLIENT_SECRET,
      TIKTOK_POST_MODE: process.env.TIKTOK_POST_MODE ?? "(unset)",
      CRON_SECRET: !!process.env.CRON_SECRET,
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "(unset → default)",
    },
    node: process.version,
  };
  try {
    const { adminDb } = await import("@/lib/admin");
    report.adminImport = "ok";
    try {
      await adminDb().collection("_health").limit(1).get();
      report.firestore = "ok";
    } catch (e) {
      report.firestore = "ERROR: " + (e instanceof Error ? e.message : String(e));
    }
  } catch (e) {
    report.adminImport = "ERROR: " + (e instanceof Error ? `${e.message}\n${e.stack ?? ""}` : String(e));
  }
  return NextResponse.json(report);
}
