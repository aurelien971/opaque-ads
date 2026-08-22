// The scheduler: finds posts that are due, publishes them through the user's
// TikTok connection, then checks processing status and pulls stats for
// everything already posted. Runs from the cron route (all users) and from
// the dashboard's "run now" (one user).
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "./admin";
import {
  ensureFreshToken,
  publishStatus,
  publishVideo,
  videoStats,
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
  try {
    const publishId = await publishVideo(conn.accessToken, p.videoUrl, options);
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
      if (!p.tiktokVideoId && p.publishId && p.mode === "direct") {
        try {
          const st = await publishStatus(conn.accessToken, p.publishId);
          const vid = st.publicaly_available_post_id?.[0];
          if (vid) await d.ref.update({ tiktokVideoId: String(vid), processing: st.status });
          else await d.ref.update({ processing: st.status, ...(st.fail_reason ? { error: st.fail_reason } : {}) });
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
