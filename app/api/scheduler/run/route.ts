// "Run the scheduler now" for the signed-in user — publishes their due posts
// and refreshes their stats. Lets you test a schedule without waiting.
import { NextResponse } from "next/server";
import { uidFromRequest } from "@/lib/server-auth";
import { runScheduler } from "@/lib/scheduler";
import { tiktokConfigured } from "@/lib/tiktok-server";

export const maxDuration = 60;

export async function POST(req: Request) {
  if (!tiktokConfigured()) {
    return NextResponse.json({ error: "TikTok keys are not configured yet." }, { status: 503 });
  }
  const uid = await uidFromRequest(req);
  if (!uid) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  try {
    return NextResponse.json(await runScheduler(uid));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Scheduler failed." }, { status: 500 });
  }
}
