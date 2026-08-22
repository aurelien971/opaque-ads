// The signed-in user's TikTok studio: profile + stats + their videos.
import { NextResponse } from "next/server";
import { uidFromRequest } from "@/lib/server-auth";
import { connectionFor } from "@/lib/scheduler";
import { listVideos, userProfile } from "@/lib/tiktok-server";

export async function POST(req: Request) {
  const uid = await uidFromRequest(req);
  if (!uid) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  try {
    const conn = await connectionFor(uid);
    if (!conn) return NextResponse.json({ error: "TikTok not connected." }, { status: 400 });
    const [profile, videos] = await Promise.all([
      userProfile(conn.accessToken),
      listVideos(conn.accessToken).catch(() => []),
    ]);
    return NextResponse.json({ profile, videos });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Studio failed." }, { status: 502 });
  }
}
