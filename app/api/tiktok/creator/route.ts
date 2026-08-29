// creator_info for the signed-in user's connected account.
//
// TikTok's content-sharing guidelines require the publish UI to show *fetched*
// creator information — nickname, what the account allows, and the maximum
// video length — rather than a hardcoded mockup. The browser can't call TikTok
// directly (the access token must never leave the server), so this route is the
// bridge. Read-only.
import { NextResponse } from "next/server";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const [{ uidFromRequest }, { connectionFor }, { creatorInfo }] = await Promise.all([
      import("@/lib/server-auth"),
      import("@/lib/scheduler"),
      import("@/lib/tiktok-server"),
    ]);
    const uid = await uidFromRequest(req);
    if (!uid) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
    const conn = await connectionFor(uid);
    if (!conn) return NextResponse.json({ error: "TikTok is not connected." }, { status: 400 });
    return NextResponse.json(await creatorInfo(conn.accessToken));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
