import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const [{ uidFromRequest }, { runScheduler }, { tiktokConfigured }] = await Promise.all([
      import("@/lib/server-auth"), import("@/lib/scheduler"), import("@/lib/tiktok-server"),
    ]);
    if (!tiktokConfigured()) return NextResponse.json({ error: "TikTok keys are not configured yet." }, { status: 503 });
    const uid = await uidFromRequest(req);
    if (!uid) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
    return NextResponse.json(await runScheduler(uid));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
