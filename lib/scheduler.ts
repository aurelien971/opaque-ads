// The scheduler: finds posts that are due, publishes them through the user's
// TikTok connection, then checks processing status and pulls stats for
// everything already posted. Runs from the cron route (all users) and from
// the dashboard's "run now" (one user).
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "./admin";
import {
  clampToCreator,
  creatorInfo,
  defaultMode,
  ensureFreshToken,
  isUnauditedForDirect,
  mediaUrl,
  publishPhotos,
  publishStatus,
  publishVideo,
  videoStats,
  userProfile,
  listVideos,
  type PostMode,
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
  let options: PostOptions = {
    caption:
      opts?.caption ??
      [p.caption, p.hashtags ? String(p.hashtags).split(/[\s,]+/).filter(Boolean).map((t: string) => (t.startsWith("#") ? t : `#${t}`)).join(" ") : ""]
        .filter(Boolean)
        .join(" "),
    // Public is the point of the product now that the app is audited. A post
    // that explicitly chose another level keeps it.
    privacy: opts?.privacy ?? p.privacy ?? "PUBLIC_TO_EVERYONE",
    allowComments: opts?.allowComments ?? p.allowComments ?? true,
    allowDuet: opts?.allowDuet ?? p.allowDuet ?? true,
    allowStitch: opts?.allowStitch ?? p.allowStitch ?? true,
    commercial: opts?.commercial ?? p.commercial ?? false,
    yourBrand: opts?.yourBrand ?? p.yourBrand ?? false,
    brandedContent: opts?.brandedContent ?? p.brandedContent ?? false,
    // Everything this pipeline makes is AI-edited imagery, so the label is on
    // unless a post explicitly opts out.
    aigc: opts?.aigc ?? p.aigc !== false,
  };
  // Direct posting is bound by what the account itself allows — ask, then
  // narrow. A private account can't post publicly, and comment/duet/stitch can
  // be off account-wide; posting against a level TikTok doesn't offer fails.
  if (process.env.TIKTOK_POST_MODE === "direct") {
    try {
      options = clampToCreator(options, await creatorInfo(conn.accessToken));
    } catch {
      /* creator_info unavailable — post with what we have rather than stall */
    }
  }

  // Slideshows go through the photo endpoint (TikTok pulls the slides from our
  // verified domain and attaches a soundtrack itself); videos go through upload.
  const isPhoto = p.mediaType === "PHOTO";
  const photoUrls = ((p.photoPaths as string[] | undefined) ?? []).length
    ? (p.photoPaths as string[]).map(mediaUrl)
    : ((p.photoUrls as string[] | undefined) ?? []);
  const photoOpts = { ...options, autoAddMusic: opts?.autoAddMusic ?? p.autoAddMusic !== false };

  const send = (mode: PostMode) =>
    isPhoto
      ? publishPhotos(conn.accessToken, photoUrls, photoOpts, mode)
      : publishVideo(conn.accessToken, p.videoUrl, options, mode);

  let mode = defaultMode();
  try {
    let publishId: string;
    try {
      publishId = await send(mode);
    } catch (e) {
      // Asking for a direct post before the Direct Post audit has been granted
      // is refused outright — the app being Live is a different approval. Land
      // it in the inbox instead of losing the post, and say so on the document.
      if (mode !== "direct" || !isUnauditedForDirect(e)) throw e;
      mode = "inbox";
      publishId = await send(mode);
    }
    await ref.update({
      status: "posted",
      dueAt: null,
      publishId,
      postedAt: Timestamp.now(),
      mode,
      downgraded: mode !== defaultMode(),
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

  // Due posts. Adding uid to the dueAt range turns this into a composite query,
  // which Firestore refuses without a hand-built index — so when we're scoped to
  // one user we fetch that user's posts on the single-field index and pick the
  // due ones here. A user's own post count is small; the whole-fleet path keeps
  // the range query, which needs no index either.
  const due = uid
    ? (await db.collection("posts").where("uid", "==", uid).get()).docs
        .filter((d) => {
          const at = d.data().dueAt as Timestamp | null | undefined;
          return at ? at.toMillis() <= Date.now() : false;
        })
        .slice(0, 20)
    : (await db.collection("posts").where("dueAt", "<=", Timestamp.now()).limit(20).get()).docs;
  for (const d of due) {
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
  // Same story as the due query — status + uid together would need an index.
  const postedDocs = uid
    ? (await db.collection("posts").where("uid", "==", uid).get()).docs
        .filter((d) => d.data().status === "posted")
        .slice(0, 60)
    : (await db.collection("posts").where("status", "==", "posted").limit(60).get()).docs;
  const byUser = new Map<string, typeof postedDocs>();
  for (const d of postedDocs) {
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
