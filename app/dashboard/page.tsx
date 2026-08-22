"use client";
// The dashboard: connect TikTok → bulk-upload videos → set a cadence → the
// calendar fills → posts go out on time → results come back.
import { useEffect, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { deleteField, doc, onSnapshot, updateDoc } from "firebase/firestore";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PostComposer from "@/components/PostComposer";
import PostEditor from "@/components/PostEditor";
import Studio from "@/components/Studio";
import { auth, db, firebaseConfigured } from "@/lib/firebase";
import { useRequireAuth } from "@/lib/auth";
import { buildAuthUrl, tiktokClientKey, type TikTokConnection } from "@/lib/tiktok";
import {
  autoSchedule,
  scheduleAt,
  unschedule,
  updatePost,
  uploadPost,
  watchPosts,
  type Post,
} from "@/lib/posts";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const PRIVACY_LABEL: Record<string, string> = { PUBLIC_TO_EVERYONE: "Public", MUTUAL_FOLLOW_FRIENDS: "Friends", FOLLOWER_OF_CREATOR: "Followers", SELF_ONLY: "Only me" };

export default function Dashboard() {
  const { user, loading } = useRequireAuth();
  const [connection, setConnection] = useState<TikTokConnection | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [uploading, setUploading] = useState<{ done: number; total: number; pct: number } | null>(null);
  const [composing, setComposing] = useState<Post | null>(null);
  const [editing, setEditing] = useState<Post | null>(null);
  const [notice, setNotice] = useState("");
  const [running, setRunning] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // Cadence
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [time, setTime] = useState("18:00");
  const [perDay, setPerDay] = useState(1);
  const [exact, setExact] = useState("");   // datetime-local, user's own time zone

  async function quick(minutes: number) {
    const n = await scheduleAt(drafts, new Date(Date.now() + minutes * 60_000));
    setNotice(`${n} video${n === 1 ? "" : "s"} scheduled for ${new Date(Date.now() + minutes * 60_000).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} (your time).`);
  }
  async function atExact() {
    if (!exact) return;
    const when = new Date(exact);
    const n = await scheduleAt(drafts, when);
    setNotice(`${n} video${n === 1 ? "" : "s"} scheduled for ${when.toLocaleString()}.`);
  }

  useEffect(() => {
    if (!user) return;
    const stopUser = onSnapshot(doc(db, "users", user.uid), (snap) => {
      setConnection((snap.data()?.tiktok as TikTokConnection) ?? null);
    });
    const stopPosts = watchPosts(user.uid, setPosts);
    return () => {
      stopUser();
      stopPosts();
    };
  }, [user]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-muted">Loading…</div>;
  }

  const drafts = posts.filter((p) => p.status === "draft");
  const scheduled = posts
    .filter((p) => p.status === "scheduled")
    .sort((a, b) => (a.dueAt?.toMillis() ?? 0) - (b.dueAt?.toMillis() ?? 0));
  const posted = posts.filter((p) => p.status === "posted" || p.status === "failed");

  async function authed(path: string, body: unknown) {
    const token = await user!.getIdToken();
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Request failed.");
    return data;
  }

  async function connectTikTok() {
    if (!tiktokClientKey()) {
      setNotice("TikTok keys aren't configured on the server yet.");
      return;
    }
    window.location.href = await buildAuthUrl();
  }

  async function onUpload(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files);
    for (let i = 0; i < list.length; i++) {
      setUploading({ done: i, total: list.length, pct: 0 });
      try {
        await uploadPost(user!.uid, list[i], (pct) => setUploading({ done: i, total: list.length, pct }));
      } catch (e) {
        setNotice(`Upload failed for ${list[i].name}: ${e instanceof Error ? e.message : "unknown error"}`);
      }
    }
    setUploading(null);
  }

  async function scheduleAll() {
    const [h, m] = time.split(":").map(Number);
    const n = await autoSchedule(drafts, { days, hour: h, minute: m, startFrom: new Date(), perDay });
    setNotice(`${n} video${n === 1 ? "" : "s"} placed on the calendar.`);
  }

  async function runNow() {
    setRunning(true);
    try {
      const r = await authed("/api/scheduler/run", {});
      setNotice(
        `Scheduler ran — ${r.published.length} published, ${r.failed.length} failed, ${r.statsUpdated} stats refreshed.`,
      );
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Scheduler failed.");
    } finally {
      setRunning(false);
    }
  }

  const fmt = (p: Post) =>
    p.dueAt?.toDate().toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) ?? "";

  return (
    <>
      <Nav />
      <main className="mx-auto min-h-[80vh] max-w-6xl px-5 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Your studio</h1>
          <div className="flex items-center gap-4 text-sm text-muted">
            <span>{user.email}</span>
            <button onClick={() => signOut(auth)} className="hover:text-fg">Sign out</button>
          </div>
        </div>

        {!firebaseConfigured && (
          <div className="mt-4 rounded-xl border border-orange-300 bg-orange-50 p-4 text-sm text-orange-800">
            Database not configured — set the NEXT_PUBLIC_FIREBASE_* variables.
          </div>
        )}
        {notice && (
          <div className="mt-4 flex items-start justify-between gap-4 rounded-xl border border-accent/30 bg-surface p-4 text-sm">
            <span>{notice}</span>
            <button onClick={() => setNotice("")} className="text-muted hover:text-fg">✕</button>
          </div>
        )}

        {/* 1 · Connect */}
        <section className="mt-6 rounded-2xl border border-stroke bg-surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-widest text-accent">STEP 1</p>
              <h2 className="mt-1 font-semibold">TikTok account</h2>
              <p className="mt-1 text-sm text-muted">
                {connection ? (
                  <>Connected as <span className="font-semibold text-fg">@{connection.displayName}</span>. Posts go to this account.</>
                ) : (
                  <>Connect the account you want to post to. You approve the permissions on TikTok&apos;s screen.</>
                )}
              </p>
            </div>
            {connection ? (
              <button
                onClick={() => updateDoc(doc(db, "users", user.uid), { tiktok: deleteField() })}
                className="rounded-full border border-stroke px-5 py-2 text-sm font-semibold hover:border-red-400 hover:text-red-500"
              >
                Disconnect
              </button>
            ) : (
              <button onClick={connectTikTok} className="glass-bright rounded-full px-5 py-2 text-sm font-semibold">
                Connect TikTok
              </button>
            )}
          </div>
        </section>

        {connection && <Studio getToken={() => user.getIdToken()} />}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* 2 · Upload */}
          <section
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("video/"));
              const dt = new DataTransfer();
              files.forEach((f) => dt.items.add(f));
              onUpload(dt.files);
            }}
            className={`rounded-2xl border-2 border-dashed p-6 text-center transition ${
              dragging ? "border-accent bg-accent/5 shadow-[0_0_40px_rgba(84,125,204,0.25)]" : "border-stroke bg-surface"
            }`}
          >
            <p className="text-xs font-bold tracking-widest text-accent">STEP 2</p>
            <input
              ref={fileInput}
              type="file"
              accept="video/mp4,video/quicktime"
              multiple
              hidden
              onChange={(e) => onUpload(e.target.files)}
            />
            {uploading ? (
              <div className="mt-3">
                <p className="text-sm text-muted">
                  Uploading {uploading.done + 1} of {uploading.total} · {uploading.pct}%
                </p>
                <div className="mx-auto mt-2 h-1.5 w-64 overflow-hidden rounded-full bg-ink">
                  <div className="mercury-bg h-full transition-all" style={{ width: `${uploading.pct}%` }} />
                </div>
              </div>
            ) : (
              <>
                <button onClick={() => fileInput.current?.click()} className="glass-bright mt-3 rounded-full px-6 py-2.5 text-sm font-semibold">
                  Upload videos
                </button>
                <p className="mt-2 text-xs text-muted">{dragging ? "Drop them!" : "Or drag videos here. MP4 or MOV, up to 64 MB each — as many as you like."}</p>
              </>
            )}
            {drafts.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-3 text-left sm:grid-cols-3 md:grid-cols-4">
                {drafts.map((p) => (
                  <PostCard key={p.id} p={p} onOpen={() => setEditing(p)} onPublish={() => (connection ? setComposing(p) : setNotice("Connect TikTok first."))} />
                ))}
              </div>
            )}
          </section>

          {/* 3 · Schedule */}
          <section className="rounded-2xl border border-stroke bg-surface p-6">
            <p className="text-xs font-bold tracking-widest text-accent">STEP 3</p>
            <h2 className="mt-1 font-semibold">Posting schedule</h2>
            <p className="mt-1 text-sm text-muted">Pick the days and time. Drafts fill the calendar in order.</p>
            <div className="mt-4 flex gap-1.5">
              {DAY_LABELS.map((l, i) => (
                <button
                  key={i}
                  onClick={() => setDays((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i]))}
                  className={`h-9 w-9 rounded-full text-sm font-semibold transition ${
                    days.includes(i) ? "bg-fg text-white" : "bg-ink text-muted hover:text-fg"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3 text-sm">
              <label className="text-muted">At</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="rounded-lg border border-stroke bg-ink px-3 py-1.5" />
              <label className="text-muted">Per day</label>
              <select value={perDay} onChange={(e) => setPerDay(Number(e.target.value))} className="rounded-lg border border-stroke bg-ink px-3 py-1.5">
                {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <button
              onClick={scheduleAll}
              disabled={!drafts.length || !days.length}
              className="glass-bright mt-5 w-full rounded-full py-2.5 text-sm font-semibold disabled:opacity-40"
            >
              Schedule {drafts.length} draft{drafts.length === 1 ? "" : "s"}
            </button>
            <div className="mt-5 border-t border-stroke pt-4">
              <p className="text-xs font-semibold text-muted">QUICK TEST — all drafts, your time zone</p>
              <div className="mt-2 flex gap-2">
                {[5, 15, 60].map((m) => (
                  <button
                    key={m}
                    onClick={() => quick(m)}
                    disabled={!drafts.length}
                    className="flex-1 rounded-full border border-stroke py-1.5 text-xs font-semibold hover:border-accent disabled:opacity-40"
                  >
                    +{m < 60 ? `${m} min` : "1 h"}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  type="datetime-local"
                  value={exact}
                  onChange={(e) => setExact(e.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-stroke bg-ink px-2 py-1.5 text-xs"
                />
                <button
                  onClick={atExact}
                  disabled={!drafts.length || !exact}
                  className="rounded-full border border-stroke px-3 py-1.5 text-xs font-semibold hover:border-accent disabled:opacity-40"
                >
                  Set
                </button>
              </div>
            </div>
            <button
              onClick={runNow}
              disabled={running}
              className="mt-3 w-full rounded-full border border-stroke py-2 text-xs font-semibold text-muted hover:border-accent hover:text-fg disabled:opacity-40"
            >
              {running ? "Running…" : "Run scheduler now (test)"}
            </button>
            <p className="mt-2 text-[11px] leading-snug text-muted">
              The scheduler runs automatically every few minutes. &ldquo;Run now&rdquo; posts anything already due and refreshes results.
            </p>
          </section>
        </div>

        {/* 4 · Calendar */}
        <section className="mt-8">
          <h2 className="font-semibold">
            Up next <span className="text-sm font-normal text-muted">{scheduled.length} scheduled</span>
          </h2>
          {scheduled.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Nothing scheduled. Upload videos, then set the cadence.</p>
          ) : (
            <div className="mt-4 divide-y divide-stroke rounded-2xl border border-stroke bg-surface">
              {scheduled.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setEditing(p)}
                  className="flex w-full items-center gap-4 px-4 py-3 text-left transition hover:bg-ink"
                >
                  <video src={p.videoUrl} preload="metadata" className="h-16 w-10 rounded-lg bg-ink object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{p.name}</p>
                    <p className="truncate text-xs text-muted">
                      {p.caption || <span className="italic">No caption yet — click to add</span>}
                      {p.hashtags ? ` · ${p.hashtags}` : ""}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {PRIVACY_LABEL[p.privacy ?? "SELF_ONLY"]} · {p.allowComments === false ? "comments off" : "comments on"}
                      {p.commercial ? " · commercial" : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{fmt(p)}</p>
                    <p className="text-[11px] text-accent">Edit details →</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* 5 · Results */}
        {posted.length > 0 && (
          <section className="mt-10">
            <h2 className="font-semibold">
              Results <span className="text-sm font-normal text-muted">{posted.length}</span>
            </h2>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-stroke bg-surface">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted">
                  <tr>
                    <th className="px-4 py-3">Video</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Views</th>
                    <th className="px-4 py-3 text-right">Likes</th>
                    <th className="px-4 py-3 text-right">Comments</th>
                    <th className="px-4 py-3 text-right">Shares</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke">
                  {posted.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3">
                        {p.status === "failed" ? (
                          <span className="text-red-500" title={p.error}>Failed — {p.error}</span>
                        ) : (
                          <span className="text-green-600">
                            {p.mode === "inbox" ? "In TikTok inbox" : "Posted"}
                            {p.postedAt ? ` · ${p.postedAt.toDate().toLocaleDateString()}` : ""}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{p.stats?.views ?? "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{p.stats?.likes ?? "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{p.stats?.comments ?? "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{p.stats?.shares ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
      <Footer />

      {editing && (
        <PostEditor
          post={posts.find((p) => p.id === editing.id) ?? editing}
          onClose={() => setEditing(null)}
          onPostNow={() => {
            if (!connection) { setNotice("Connect TikTok first."); return; }
            setComposing(editing);
            setEditing(null);
          }}
        />
      )}

      {composing && connection && (
        <PostComposer
          creative={{ id: composing.id, caption: composing.caption }}
          connection={connection}
          onClose={() => setComposing(null)}
          onPublish={async (opts) => {
            try {
              await authed("/api/tiktok/publish", { postId: composing.id, ...opts });
              return null;
            } catch (e) {
              return e instanceof Error ? e.message : "Publish failed.";
            }
          }}
        />
      )}
    </>
  );
}

function PostCard({ p, onOpen, onPublish }: { p: Post; onOpen: () => void; onPublish: () => void }) {
  return (
    <div className="overflow-hidden rounded-xl border border-stroke bg-ink transition hover:border-accent/50">
      <button onClick={onOpen} className="block w-full">
        <video src={p.videoUrl} preload="metadata" className="aspect-[9/16] w-full bg-black object-cover" />
      </button>
      <div className="p-2">
        <p className="truncate text-xs font-semibold">{p.name}</p>
        <p className="truncate text-[11px] text-muted">{p.caption || "No caption yet"}</p>
        <div className="mt-1.5 flex justify-between text-[11px]">
          <button onClick={onOpen} className="font-semibold text-accent hover:underline">Edit details</button>
          <button onClick={onPublish} className="text-muted hover:text-fg">Post now</button>
        </div>
      </div>
    </div>
  );
}
