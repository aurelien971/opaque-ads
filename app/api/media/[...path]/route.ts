// Media passthrough on our own (TikTok-verified) domain.
//
// TikTok's photo endpoint only accepts PULL_FROM_URL, and the URL prefix must be
// verified in the developer portal. Firebase Storage URLs can never be verified —
// so every slideshow image is handed to TikTok as
//   https://www.oaisislabs.com/api/media/<storage path>
// and this route streams the bytes straight out of the bucket.
import { NextResponse } from "next/server";

export const maxDuration = 60;

const BUCKET =
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "oaisislabs.firebasestorage.app";

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const objectPath = path.map((p) => decodeURIComponent(p)).join("/");
  // Only user media — never an arbitrary object, and never a path escape.
  if (!objectPath.startsWith("users/") || objectPath.includes("..")) {
    return new NextResponse("Not found", { status: 404 });
  }
  try {
    const { adminStorage } = await import("@/lib/admin");
    const file = adminStorage().bucket(BUCKET).file(objectPath);
    const [exists] = await file.exists();
    if (!exists) return new NextResponse("Not found", { status: 404 });
    const [meta] = await file.getMetadata();
    const [buf] = await file.download();
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": meta.contentType ?? "application/octet-stream",
        "Content-Length": String(buf.length),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    return new NextResponse(e instanceof Error ? e.message : "Media error", { status: 500 });
  }
}
