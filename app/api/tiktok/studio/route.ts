import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const [{ uidFromRequest }, { connectionFor }, { listVideos, userProfile }] = await Promise.all([
      import("@/lib/server-auth"), import("@/lib/scheduler"), import("@/lib/tiktok-server"),
    ]);
    const uid = await uidFromRequest(req);
    if (!uid) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
    const conn = await connectionFor(uid);
    if (!conn) return NextResponse.json({ error: "TikTok not connected." }, { status: 400 });
    const [profile, videos] = await Promise.all([
      userProfile(conn.accessToken),
      listVideos(conn.accessToken).catch(() => []),
    ]);
    return NextResponse.json({ profile, videos });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? `${e.message}` : String(e) }, { status: 500 });
  }
}
