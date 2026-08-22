import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const [{ runScheduler }, { tiktokConfigured }] = await Promise.all([import("@/lib/scheduler"), import("@/lib/tiktok-server")]);
    if (!tiktokConfigured()) return NextResponse.json({ skipped: "TikTok keys not configured" });
    return NextResponse.json(await runScheduler());
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
