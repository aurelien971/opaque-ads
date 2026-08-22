// Server-side TikTok: token refresh, video upload (FILE_UPLOAD — works for
// any video host, no domain verification needed), publish status, and video
// stats. Used by the scheduler and the publish-now route.
//
// TIKTOK_POST_MODE: "inbox" (default) sends the video to the user's TikTok
// inbox as a draft — what unaudited apps are allowed to do. "direct" posts
// straight to the profile once the app passes TikTok's audit.

const API = "https://open.tiktokapis.com/v2";

export type StoredConnection = {
  openId: string;
  displayName: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string;
};

export type PostOptions = {
  caption: string;
  privacy: string;
  allowComments: boolean;
  allowDuet: boolean;
  allowStitch: boolean;
  commercial?: boolean;
  yourBrand?: boolean;
  brandedContent?: boolean;
};

const clientKey = () =>
  process.env.TIKTOK_CLIENT_KEY ?? process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY ?? "";
const clientSecret = () => process.env.TIKTOK_CLIENT_SECRET ?? "";

export const tiktokConfigured = () => !!clientKey() && !!clientSecret();

// Refreshes when within 10 minutes of expiry. Returns the (possibly new)
// connection; caller persists it.
export async function ensureFreshToken(c: StoredConnection): Promise<StoredConnection> {
  if (c.expiresAt - Date.now() > 10 * 60 * 1000) return c;
  const res = await fetch(`${API}/oauth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: clientKey(),
      client_secret: clientSecret(),
      grant_type: "refresh_token",
      refresh_token: c.refreshToken,
    }),
  });
  const t = await res.json();
  if (!res.ok || t.error) throw new Error(t.error_description ?? "Token refresh failed");
  return {
    ...c,
    accessToken: t.access_token,
    refreshToken: t.refresh_token ?? c.refreshToken,
    expiresAt: Date.now() + (t.expires_in ?? 86400) * 1000,
    scope: t.scope ?? c.scope,
  };
}

async function tt<T = Record<string, unknown>>(
  path: string,
  token: string,
  body: unknown,
): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  const code = data.error?.code;
  if (!res.ok || (code && code !== "ok")) {
    throw new Error(data.error?.message ?? `TikTok ${path} failed (${res.status})`);
  }
  return data.data as T;
}

// Uploads a video from a URL we can read (the user's Storage file) into the
// user's TikTok — inbox draft or direct post. Returns TikTok's publish_id.
export async function publishVideo(
  token: string,
  videoUrl: string,
  opts: PostOptions,
): Promise<string> {
  const file = await fetch(videoUrl);
  if (!file.ok) throw new Error("Could not read the video file.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const size = bytes.byteLength;
  if (size > 64 * 1024 * 1024) throw new Error("Video over 64 MB — compress it first.");

  const direct = process.env.TIKTOK_POST_MODE === "direct";
  const source_info = {
    source: "FILE_UPLOAD",
    video_size: size,
    chunk_size: size,
    total_chunk_count: 1,
  };
  const init = direct
    ? await tt<{ publish_id: string; upload_url: string }>(
        "/post/publish/video/init/",
        token,
        {
          post_info: {
            title: opts.caption.slice(0, 2200),
            privacy_level: opts.privacy,
            disable_comment: !opts.allowComments,
            disable_duet: !opts.allowDuet,
            disable_stitch: !opts.allowStitch,
            ...(opts.commercial
              ? {
                  brand_content_toggle: !!opts.brandedContent,
                  brand_organic_toggle: !!opts.yourBrand,
                }
              : {}),
          },
          source_info,
        },
      )
    : await tt<{ publish_id: string; upload_url: string }>(
        "/post/publish/inbox/video/init/",
        token,
        { source_info },
      );

  const put = await fetch(init.upload_url, {
    method: "PUT",
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(size),
      "Content-Range": `bytes 0-${size - 1}/${size}`,
    },
    body: bytes,
  });
  if (!put.ok && put.status !== 201) {
    throw new Error(`Upload to TikTok failed (${put.status}).`);
  }
  return init.publish_id;
}

export async function publishStatus(token: string, publishId: string) {
  return tt<{ status: string; publicaly_available_post_id?: string[]; fail_reason?: string }>(
    "/post/publish/status/fetch/",
    token,
    { publish_id: publishId },
  );
}

export type VideoStats = {
  views: number;
  likes: number;
  comments: number;
  shares: number;
};

// Needs the video.list scope. Returns stats keyed by TikTok video id.
export async function videoStats(token: string, ids: string[]): Promise<Record<string, VideoStats>> {
  if (!ids.length) return {};
  const res = await fetch(
    `${API}/video/query/?fields=id,view_count,like_count,comment_count,share_count`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({ filters: { video_ids: ids.slice(0, 20) } }),
    },
  );
  const data = await res.json();
  const out: Record<string, VideoStats> = {};
  for (const v of data.data?.videos ?? []) {
    out[v.id] = {
      views: v.view_count ?? 0,
      likes: v.like_count ?? 0,
      comments: v.comment_count ?? 0,
      shares: v.share_count ?? 0,
    };
  }
  return out;
}
