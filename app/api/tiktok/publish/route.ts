// Publish one post right now (the dashboard's publish sheet). Auth'd by the
// user's Firebase ID token; the post must belong to them.
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/admin";
import { uidFromRequest } from "@/lib/server-auth";
import { publishPost } from "@/lib/scheduler";
import { tiktokConfigured } from "@/lib/tiktok-server";

export const maxDuration = 60;

export async function POST(req: Request) {
  if (!tiktokConfigured()) {
    return NextResponse.json({ error: "TikTok keys are not configured yet." }, { status: 503 });
  }
  let uid: string | null;
  try {
    uid = await uidFromRequest(req);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server misconfigured." }, { status: 500 });
  }
  if (!uid) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const { postId, ...opts } = await req.json();
  const snap = await adminDb().doc(`posts/${postId}`).get();
  if (snap.data()?.uid !== uid) return NextResponse.json({ error: "Not your post." }, { status: 403 });
  try {
    const publishId = await publishPost(postId, opts);
    return NextResponse.json({ publishId });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Publish failed." }, { status: 502 });
  }
}
