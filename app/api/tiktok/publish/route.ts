// Publishes a queued video to the user's TikTok account via the official
// Content Posting API (direct post, PULL_FROM_URL). The video URL is the
// user's own Firebase Storage file; TikTok fetches it directly.
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const {
    accessToken,
    videoUrl,
    caption,
    privacy,
    allowComments,
    allowDuet,
    allowStitch,
    commercial,
    yourBrand,
    brandedContent,
  } = await req.json();

  if (!accessToken || !videoUrl || !privacy) {
    return NextResponse.json(
      { error: "Missing token, video, or privacy level." },
      { status: 400 },
    );
  }

  const body = {
    post_info: {
      title: caption ?? "",
      privacy_level: privacy,
      disable_comment: !allowComments,
      disable_duet: !allowDuet,
      disable_stitch: !allowStitch,
      ...(commercial
        ? {
            brand_content_toggle: !!brandedContent,
            brand_organic_toggle: !!yourBrand,
          }
        : {}),
    },
    source_info: {
      source: "PULL_FROM_URL",
      video_url: videoUrl,
    },
  };

  const res = await fetch(
    "https://open.tiktokapis.com/v2/post/publish/video/init/",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify(body),
    },
  );
  const data = await res.json();
  const errCode = data.error?.code;
  if (!res.ok || (errCode && errCode !== "ok")) {
    return NextResponse.json(
      {
        error:
          data.error?.message ??
          "TikTok did not accept the post. If our platform access is still in review, publishing activates on approval.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ publishId: data.data?.publish_id ?? "" });
}
