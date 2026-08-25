// The scheduler: finds posts that are due, publishes them through the user's
// TikTok connection, then checks processing status and pulls stats for
// everything already posted. Runs from the cron route (all users) and from
// the dashboard's "run now" (one user).
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "./admin";
import {
  ensureFreshToken,
  mediaUrl,
  publishPhotos,
  publishStatus,
  publishVideo,
  videoStats,
  userProfile,
  listVideos,
  type PostOptions,
  type StoredConnection,
  type VideoStats,
} from "./tiktok-server";

export type RunReport = {
  published: string[];
  failed: { id: string; error: string }[];
  statsUpdated: number;
};

export async function connectionFor(uid: string): Promise<StoredConnection | null> {
  const snap = await adminDb().doc(`users/${uid}`).get();
  const c = snap.data()?.tiktok as StoredConnection | undefined;
  if (!c?.accessToken) return null;
  const fresh = await ensureFreshToken(c);
  if (fresh !== c) await adminDb().doc(`users/${uid}`).update({ tiktok: fresh });
  return fresh;
}

// Publishes one post document right now. Used by both the scheduler and the
// dashboard's publish-now sheet.
export async function publishPost(postId: string, opts?: Partial<PostOptions>) {
  const ref = adminDb().doc(`posts/${postId}`);
  const snap = await ref.get();
  const p = snap.data();
  if (!p) throw new Error("Post not found.");
  const conn = await connectionFor(p.uid);
  if (!conn) throw new Error("TikTok is not connected.");
  const options: PostOptions = {
    caption:
      opts?.caption ??
      [p.caption, p.hashtags ? String(p.hashtags).split(/[\s,]+/).filter(Boolean).map((t: string) => (t.startsWith("#") ? t : `#${t}`)).join(" ") : ""]
        .filter(Boolean)
        .join(" "),
    privacy: opts?.privacy ?? p.privacy ?? "SELF_ONLY",
    allowComments: opts?.allowComments ?? p.allowComments ?? true,
    allowDuet: opts?.allowDuet ?? p.allowDuet ?? true,
    allowStitch: opts?.allowStitch ?? p.allowStitch ?? true,
    commercial: opts?.commercial ?? p.commercial ?? false,
    yourBrand: opts?.yourBrand ?? p.yourBrand ?? false,
    brandedContent: opts?.brandedContent ?? p.brandedContent ?? false,
  };
  // Slideshows go through the photo endpoint (TikTok pulls the slides from our
  // verified domain and attaches a soundtrack itself); videos go through upload.
  const isPhoto = p.mediaType === "PHOTO";
  try {
    const publishId = isPhoto
      ? await publishPhotos(
          conn.accessToken,
          ((p.photoPaths as string[] | undefined) ?? []).length
            ? (p.photoPaths as string[]).map(mediaUrl)
            : ((p.photoUrls as string[] | undefined) ?? []),
          { ...options, autoAddMusic: opts?.autoAddMusic ?? p.autoAddMusic !== false },
        )
      : await publishVideo(conn.accessToken, p.videoUrl, options);
    await ref.update({
      status: "posted",
      dueAt: null,
      publishId,
      postedAt: Timestamp.now(),
      mode: process.env.TIKTOK_POST_MODE === "direct" ? "direct" : "inbox",
      error: FieldValue.delete(),
      ...options,
    });
    return publishId;
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    await ref.update({ status: "failed", dueAt: null, error });
    throw e;
  }
}

export async function runScheduler(uid?: string): Promise<RunReport> {
  const db = adminDb();
  const report: RunReport = { published: [], failed: [], statsUpdated: 0 };

  // Due posts: dueAt is only set while a post is scheduled, so a single-field
  // range query is enough (no composite index to create).
  let q = db.collection("posts").where("dueAt", "<=", Timestamp.now());
  if (uid) q = q.where("uid", "==", uid);
  const due = await q.limit(20).get();
  for (const d of due.docs) {
    try {
      await publishPost(d.id);
      report.published.push(d.id);
    } catch (e) {
      report.failed.push({ id: d.id, error: e instanceof Error ? e.message : String(e) });
    }
  }

  // Daily account snapshot (followers, likes, views) for the analytics trends.
  const today = new Date().toISOString().slice(0, 10);
  const userIds = uid
    ? [uid]
    : (await db.collection("users").get()).docs.filter((d) => d.data().tiktok?.accessToken).map((d) => d.id);
  for (const u of userIds) {
    const snapRef = db.doc(`users/${u}/snapshots/${today}`);
    if ((await snapRef.get()).exists) continue;
    const conn = await connectionFor(u).catch(() => null);
    if (!conn) continue;
    try {
      const [profile, videos] = await Promise.all([userProfile(conn.accessToken), listVideos(conn.accessToken).catch(() => [])]);
      await snapRef.set({
        date: today,
        at: Timestamp.now(),
        followers: profile.followers,
        following: profile.following,
        likes: profile.likes,
        videos: profile.videos,
        totalViews: videos.reduce((a, v) => a + v.views, 0),
      });
    } catch {
      /* next run */
    }
  }

  // Feedback: resolve processing → public post ids, then refresh stats.
  let pq = db.collection("posts").where("status", "==", "posted");
  if (uid) pq = pq.where("uid", "==", uid);
  const posted = await pq.limit(60).get();
  const byUser = new Map<string, typeof posted.docs>();
  for (const d of posted.docs) {
    const u = d.data().uid as string;
    byUser.set(u, [...(byUser.get(u) ?? []), d]);
  }
  for (const [u, docs] of byUser) {
    const conn = await connectionFor(u).catch(() => null);
    if (!conn) continue;
    const ids: string[] = [];
    for (const d of docs) {
      const p = d.data();
      // Delivery: ask TikTok what happened to the upload (inbox AND direct).
      if (p.publishId && !p.deliveredAt && !p.deliveryFailed) {
        try {
          const st = await publishStatus(conn.accessToken, p.publishId);
          const vid = st.publicaly_available_post_id?.[0];
          const delivered = st.status === "SEND_TO_USER_INBOX" || st.status === "PUBLISH_COMPLETE";
          await d.ref.update({
            processing: st.status,
            ...(delivered ? { deliveredAt: Timestamp.now() } : {}),
            ...(vid ? { tiktokVideoId: String(vid) } : {}),
            ...(st.status === "FAILED" ? { deliveryFailed: true, error: st.fail_reason ?? "TikTok rejected the upload." } : {}),
          });
          if (vid) ids.push(String(vid));
        } catch {
          /* next run */
        }
      } else if (p.tiktokVideoId) {
        ids.push(p.tiktokVideoId);
      }
    }
    if (!ids.length) continue;
    const stats: Record<string, VideoStats> = await videoStats(conn.accessToken, ids).catch(() => ({}));
    for (const d of docs) {
      const vid = d.data().tiktokVideoId;
      if (vid && stats[vid]) {
        await d.ref.update({ stats: stats[vid], statsAt: Timestamp.now() });
        report.statsUpdated++;
      }
    }
  }
  return report;
}
