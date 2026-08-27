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
  // Photo posts only: let TikTok pick and attach a soundtrack automatically.
  autoAddMusic?: boolean;
  // Declares the media as AI-generated. TikTok requires realistic AI-made or
  // AI-edited people/scenes to carry this label; undeclared AIGC is one of the
  // things that makes a post ineligible for the For You feed (and unpromotable).
  aigc?: boolean;
};

// Public base for media TikTok has to pull from. Must be a domain verified in
// the TikTok developer portal (URL Ownership Verification) — Storage URLs are not.
export const siteBase = () =>
  (process.env.NEXT_PUBLIC_SITE_URL || "https://www.oaisislabs.com").replace(/\/$/, "");

// A storage object path → a URL on our verified domain (see app/api/media).
export const mediaUrl = (storagePath: string) =>
  `${siteBase()}/api/media/${storagePath.split("/").map(encodeURIComponent).join("/")}`;

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

// What the account itself allows. TikTok requires this to be queried before a
// DIRECT_POST and the answer respected: a private account cannot post publicly,
// and comment/duet/stitch may be switched off account-wide. Posting against a
// level the account doesn't offer is rejected outright, so this is not optional.
export type CreatorInfo = {
  creator_nickname: string;
  creator_username: string;
  privacy_level_options: string[];
  comment_disabled: boolean;
  duet_disabled: boolean;
  stitch_disabled: boolean;
  max_video_post_duration_sec: number;
};

export async function creatorInfo(token: string): Promise<CreatorInfo> {
  const res = await fetch(`${API}/post/publish/creator_info/query/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
  });
  const data = await res.json();
  if (!res.ok || (data.error?.code && data.error.code !== "ok")) {
    throw new Error(data.error?.message ?? `TikTok creator_info failed (${res.status})`);
  }
  return data.data as CreatorInfo;
}

/**
 * Narrows a post's options to what this account actually permits.
 * Falls back to the account's own first allowed privacy level when the one we
 * wanted isn't on offer — better a post that lands than one TikTok refuses.
 */
export function clampToCreator(opts: PostOptions, info: CreatorInfo): PostOptions {
  const levels = info.privacy_level_options ?? [];
  const privacy = levels.includes(opts.privacy)
    ? opts.privacy
    : levels.find((l) => l === "PUBLIC_TO_EVERYONE") ?? levels[0] ?? opts.privacy;
  return {
    ...opts,
    privacy,
    allowComments: opts.allowComments && !info.comment_disabled,
    allowDuet: opts.allowDuet && !info.duet_disabled,
    allowStitch: opts.allowStitch && !info.stitch_disabled,
  };
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
            ...(opts.aigc ? { is_aigc: true } : {}),
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

// Slideshow (photo carousel). TikTok only accepts PULL_FROM_URL here, so the
// images must sit on a verified domain — pass URLs built with mediaUrl().
// `autoAddMusic` is the API's own "put a soundtrack on it" switch: TikTok picks a
// track from its licensed library, exactly like the in-app slideshow editor.
export async function publishPhotos(
  token: string,
  photoUrls: string[],
  opts: PostOptions,
): Promise<string> {
  if (!photoUrls.length) throw new Error("No slides to post.");
  if (photoUrls.length > 35) throw new Error("TikTok allows at most 35 slides.");

  const direct = process.env.TIKTOK_POST_MODE === "direct";
  const [title, ...rest] = opts.caption.split("\n");
  const description = (rest.join("\n") || opts.caption).slice(0, 4000);

  // Music is the point of a slideshow — on unless explicitly turned off. TikTok
  // only honours auto_add_music (and disable_comment / the brand toggles) in
  // DIRECT_POST; MEDIA_UPLOAD takes title + description and nothing else, so
  // sending more there risks the whole init being refused. Until the app is
  // audited, a slideshow lands in the drafts and the account picks its own sound.
  const post_info = direct
    ? {
        title: title.slice(0, 90),
        description,
        privacy_level: opts.privacy,
        disable_comment: !opts.allowComments,
        auto_add_music: opts.autoAddMusic !== false,
        ...(opts.commercial
          ? {
              brand_content_toggle: !!opts.brandedContent,
              brand_organic_toggle: !!opts.yourBrand,
            }
          : {}),
      }
    : { title: title.slice(0, 90), description };

  const init = await tt<{ publish_id: string }>("/post/publish/content/init/", token, {
    media_type: "PHOTO",
    post_mode: direct ? "DIRECT_POST" : "MEDIA_UPLOAD",
    // Body-level for photos (not a post_info field), so it survives MEDIA_UPLOAD.
    ...(opts.aigc ? { is_aigc: true } : {}),
    post_info,
    source_info: {
      source: "PULL_FROM_URL",
      photo_cover_index: 0,
      photo_images: photoUrls,
    },
  });
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

// ---- Studio: the account and its videos (user.info.* + video.list scopes) ----

export type TikTokProfile = {
  displayName: string;
  avatarUrl: string;
  bio: string;
  profileUrl: string;
  verified: boolean;
  followers: number;
  following: number;
  likes: number;
  videos: number;
};

export async function userProfile(token: string): Promise<TikTokProfile> {
  const fields =
    "open_id,display_name,avatar_url,bio_description,profile_web_link,is_verified,follower_count,following_count,likes_count,video_count";
  const res = await fetch(`${API}/user/info/?fields=${fields}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  const u = data.data?.user ?? {};
  return {
    displayName: u.display_name ?? "",
    avatarUrl: u.avatar_url ?? "",
    bio: u.bio_description ?? "",
    profileUrl: u.profile_web_link ?? "",
    verified: !!u.is_verified,
    followers: u.follower_count ?? 0,
    following: u.following_count ?? 0,
    likes: u.likes_count ?? 0,
    videos: u.video_count ?? 0,
  };
}

export type TikTokVideo = {
  id: string;
  title: string;
  cover: string;
  url: string;
  createdAt: number; // epoch seconds
  views: number;
  likes: number;
  comments: number;
  shares: number;
};

export async function listVideos(token: string, max = 20): Promise<TikTokVideo[]> {
  const fields =
    "id,title,cover_image_url,share_url,create_time,view_count,like_count,comment_count,share_count";
  const res = await fetch(`${API}/video/list/?fields=${fields}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify({ max_count: max }),
  });
  const data = await res.json();
  return (data.data?.videos ?? []).map((v: Record<string, unknown>) => ({
    id: String(v.id),
    title: (v.title as string) ?? "",
    cover: (v.cover_image_url as string) ?? "",
    url: (v.share_url as string) ?? "",
    createdAt: (v.create_time as number) ?? 0,
    views: (v.view_count as number) ?? 0,
    likes: (v.like_count as number) ?? 0,
    comments: (v.comment_count as number) ?? 0,
    shares: (v.share_count as number) ?? 0,
  }));
}
