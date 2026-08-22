// The clock. Hit on a schedule (Vercel Cron, or any external cron such as
// cron-job.org every 5 minutes) with "Authorization: Bearer $CRON_SECRET".
// Publishes every user's due posts and refreshes stats.
import { NextResponse } from "next/server";
import { runScheduler } from "@/lib/scheduler";
import { tiktokConfigured } from "@/lib/tiktok-server";

export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!tiktokConfigured()) {
    return NextResponse.json({ skipped: "TikTok keys not configured" });
  }
  try {
    return NextResponse.json(await runScheduler());
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Scheduler failed." }, { status: 500 });
  }
}
