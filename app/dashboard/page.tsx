"use client";
// The workspace. Three questions, answered top to bottom — what's going out,
// what went out, how it did — with the account and the controls on the right.
// Not connected yet? One focused panel, nothing else.
import { useEffect, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { deleteField, doc, onSnapshot, updateDoc } from "firebase/firestore";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PostComposer from "@/components/PostComposer";
import PostEditor from "@/components/PostEditor";
import AccountCard from "@/components/AccountCard";
import OrbitMark from "@/components/OrbitMark";
import { bestSlots, describeSlots, fmtN } from "@/lib/analytics";
import type { TikTokVideo } from "@/lib/tiktok-server";
import { auth, db } from "@/lib/firebase";
import { useRequireAuth } from "@/lib/auth";
import { buildAuthUrl, tiktokClientKey, type TikTokConnection } from "@/lib/tiktok";
import { autoSchedule, scheduleAt, smartSchedule, uploadPost, watchPosts, type Post } from "@/lib/posts";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const PRIVACY_LABEL: Record<string, string> = { PUBLIC_TO_EVERYONE: "Public", MUTUAL_FOLLOW_FRIENDS: "Friends", FOLLOWER_OF_CREATOR: "Followers", SELF_ONLY: "Only me" };

const card = "rounded-[20px] border border-[rgba(22,21,15,0.08)] bg-surface";

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
  const [videos, setVideos] = useState<TikTokVideo[]>([]);
  const [more, setMore] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // Custom cadence
  const [days, setDays] = useState<number[]>([2, 4, 6]);
  const [time, setTime] = useState("18:00");
  const [perDay, setPerDay] = useState(1);
  const [exact, setExact] = useState("");

  useEffect(() => {
    if (!user) return;
    const stopUser = onSnapshot(doc(db, "users", user.uid), (snap) => setConnection((snap.data()?.tiktok as TikTokConnection) ?? null));
    const stopPosts = watchPosts(user.uid, setPosts);
    return () => { stopUser(); stopPosts(); };
  }, [user]);

  // If anything is overdue while the page is open, fire the scheduler ourselves.
  const overdueKey = posts.filter((p) => p.status === "scheduled" && (p.dueAt?.toMillis() ?? Infinity) <= Date.now()).map((p) => p.id).join(",");
  useEffect(() => {
    if (!overdueKey || !connection || running) return;
    runNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overdueKey]);

  if (loading || !user) return <div className="flex min-h-screen items-center justify-center text-faint">Loading…</div>;

  const drafts = posts.filter((p) => p.status === "draft");
  const scheduled = posts.filter((p) => p.status === "scheduled").sort((a, b) => (a.dueAt?.toMillis() ?? 0) - (b.dueAt?.toMillis() ?? 0));
  const sent = posts.filter((p) => p.status === "posted" || p.status === "failed").sort((a, b) => (b.postedAt?.toMillis() ?? 0) - (a.postedAt?.toMillis() ?? 0));
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const postedThisMonth = sent.filter((p) => p.status === "posted" && (p.postedAt?.toMillis() ?? 0) >= monthStart.getTime()).length;
  const avgViews = videos.length ? videos.reduce((a, v) => a + v.views, 0) / videos.length : 0;
  const slots = bestSlots(videos);

  async function authed(path: string, body: unknown) {
    const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user!.getIdToken()}` }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Request failed.");
    return data;
  }
  async function connectTikTok() {
    if (!tiktokClientKey()) { setNotice("TikTok keys aren't configured on the server yet."); return; }
    window.location.href = await buildAuthUrl();
  }
  async function onUpload(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("video/"));
    for (let i = 0; i < list.length; i++) {
      setUploading({ done: i, total: list.length, pct: 0 });
      try { await uploadPost(user!.uid, list[i], (pct) => setUploading({ done: i, total: list.length, pct })); }
      catch (e) { setNotice(`Upload failed for ${list[i].name}: ${e instanceof Error ? e.message : "unknown error"}`); }
    }
    setUploading(null);
  }
  async function smart() {
    const { slots: s, basis } = bestSlots(videos);
    const times = await smartSchedule(drafts, s);
    setNotice(`${times.length} video${times.length === 1 ? "" : "s"} scheduled on ${describeSlots(s)} — ${basis === "history" ? "your account's best slots" : "sensible defaults until there's more history"}.`);
  }
  async function quick(minutes: number) {
    const n = await scheduleAt(drafts, new Date(Date.now() + minutes * 60_000));
    setNotice(`${n} video${n === 1 ? "" : "s"} scheduled for ${new Date(Date.now() + minutes * 60_000).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.`);
  }
  async function atExact() {
    if (!exact) return;
    const n = await scheduleAt(drafts, new Date(exact));
    setNotice(`${n} video${n === 1 ? "" : "s"} scheduled for ${new Date(exact).toLocaleString()}.`);
  }
  async function cadence() {
    const [h, m] = time.split(":").map(Number);
    const n = await autoSchedule(drafts, { days, hour: h, minute: m, startFrom: new Date(), perDay });
    setNotice(`${n} video${n === 1 ? "" : "s"} placed on the calendar.`);
  }
  async function runNow() {
    setRunning(true);
    try {
      const r = await authed("/api/scheduler/run", {});
      setNotice(`Scheduler ran — ${r.published.length} published, ${r.failed.length} failed, ${r.statsUpdated} stats refreshed.`);
    } catch (e) { setNotice(e instanceof Error ? e.message : "Scheduler failed."); }
    finally { setRunning(false); }
  }

  const dayKey = (d: Date) => d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
  const byDay = scheduled.reduce<Record<string, Post[]>>((acc, p) => {
    const d = p.dueAt!.toDate();
    const today = new Date(); const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);
    const k = d.toDateString() === today.toDateString() ? "Today" : d.toDateString() === tomorrow.toDateString() ? "Tomorrow" : dayKey(d);
    (acc[k] ??= []).push(p);
    return acc;
  }, {});
  const hm = (d?: Date) => d?.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) ?? "";
  const hms = (d?: Date) => d?.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" }) ?? "";
  const greeting = (() => { const h = new Date().getHours(); return h < 12 ? "Good morning." : h < 18 ? "Good afternoon." : "Good evening."; })();
  const headline = !connection
    ? "Let's connect your TikTok."
    : scheduled.length
      ? `${scheduled.length} video${scheduled.length === 1 ? "" : "s"} go${scheduled.length === 1 ? "es" : ""} out on schedule. Next one ${byDay["Today"] ? "today" : byDay["Tomorrow"] ? "tomorrow" : dayKey(scheduled[0].dueAt!.toDate())} at ${hm(scheduled[0].dueAt?.toDate())}.`
      : drafts.length
        ? `${drafts.length} draft${drafts.length === 1 ? "" : "s"} waiting for a slot.`
        : "Nothing scheduled yet. Drop in this week's videos.";

  return (
    <>
      <Nav />
      <main className="mx-auto min-h-[80vh] max-w-[1080px] px-6 pb-[90px] pt-6 md:px-12">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mono">{greeting}</p>
            <h1 className="serif mt-2 max-w-[640px] text-[30px] leading-[1.1] md:text-[36px]">{headline}</h1>
          </div>
          <div className="flex items-center gap-4 text-[13px] text-faint">
            <span>{user.email}</span>
            <button onClick={() => signOut(auth)} className="hover:text-fg">Sign out</button>
          </div>
        </div>

        {notice && (
          <div className={`${card} mt-6 flex items-start justify-between gap-4 px-5 py-4 text-[14px]`}>
            <span className="text-muted">{notice}</span>
            <button onClick={() => setNotice("")} className="text-faint hover:text-fg">✕</button>
          </div>
        )}

        {/* Not connected: one focused panel */}
        {!connection ? (
          <div className={`${card} relative mt-8 overflow-hidden px-8 py-14 text-center md:px-12`}>
            <div className="sun pointer-events-none absolute left-1/2 top-[-220px] h-[500px] w-[800px] -translate-x-1/2 rounded-full" />
            <div className="relative">
              <OrbitMark size={56} ringWidth={2} className="mx-auto" />
              <h2 className="serif mx-auto mt-6 max-w-[520px] text-[32px] leading-[1.1] md:text-[40px]">Connect the account your videos should post to.</h2>
              <p className="mx-auto mt-4 max-w-[460px] text-[16px] leading-[1.6] text-muted">
                You approve the permissions on TikTok&apos;s own screen. Nothing posts without you scheduling it.
              </p>
              <button onClick={connectTikTok} className="pill-primary mt-8 px-8 py-4 text-[15px] font-medium">Connect TikTok</button>
              <p className="mt-4 text-[13px] text-faint">Disconnect any time, here or in TikTok.</p>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-7 lg:grid-cols-[1fr_320px]">
            {/* ================= Main ================= */}
            <div className="min-w-0 space-y-10">
              {/* Stat strip */}
              <div className="grid gap-3 sm:grid-cols-4">
                {[
                  ["Up next", String(scheduled.length), scheduled[0] ? hm(scheduled[0].dueAt?.toDate()) + (byDay["Today"] ? " today" : "") : "nothing queued"],
                  ["Posted this month", String(postedThisMonth), "through OAISIS"],
                  ["Avg views / video", fmtN(avgViews), `last ${videos.length} on TikTok`],
                  ["Best slots", describeSlots(slots.slots), slots.basis === "history" ? "from your history" : "defaults for now"],
                ].map(([l, v, s]) => (
                  <div key={l} className={`${card} p-4`}>
                    <p className="mono-sm uppercase tracking-[0.15em]">{l}</p>
                    <p className="mt-2 truncate text-[22px] font-medium leading-none tabular-nums">{v}</p>
                    <p className="mt-1.5 truncate text-[12px] text-faint">{s}</p>
                  </div>
                ))}
              </div>

              {/* Up next */}
              <section>
                <div className="flex items-end justify-between">
                  <h2 className="serif text-[28px]">Up next</h2>
                  <span className="mono-sm">{scheduled.length} scheduled</span>
                </div>
                {scheduled.length === 0 ? (
                  <div className={`${card} mt-4 px-6 py-8 text-center text-[14px] text-muted`}>
                    {drafts.length ? "Your drafts are ready — hit Smart schedule on the right." : "Nothing on the calendar. Add videos below, then schedule them."}
                  </div>
                ) : (
                  <div className="mt-4 space-y-5">
                    {Object.entries(byDay).map(([day, items]) => (
                      <div key={day}>
                        <p className="mono mb-2">{day}</p>
                        <div className={`${card} divide-y divide-[rgba(22,21,15,0.08)]`}>
                          {items.map((p) => (
                            <button key={p.id} onClick={() => setEditing(p)} className="flex w-full items-center gap-4 px-4 py-3 text-left transition hover:bg-ink/60">
                              <video src={p.videoUrl} preload="metadata" className="h-14 w-9 rounded-lg bg-[#16150F] object-cover" />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[14px] font-medium">{p.caption || <span className="font-normal text-faint">No caption yet</span>}</p>
                                <p className="mono-sm mt-0.5 truncate">{p.name}{p.hashtags ? ` · ${p.hashtags}` : ""} · {PRIVACY_LABEL[p.privacy ?? "SELF_ONLY"]}</p>
                              </div>
                              <span className="font-mono text-[12px] tabular-nums">{hm(p.dueAt?.toDate())}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Drafts + upload */}
              <section>
                <div className="flex items-end justify-between">
                  <h2 className="serif text-[28px]">Drafts</h2>
                  <span className="mono-sm">{drafts.length} waiting</span>
                </div>
                <input ref={fileInput} type="file" accept="video/mp4,video/quicktime" multiple hidden onChange={(e) => onUpload(e.target.files)} />
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setDragging(false); onUpload(e.dataTransfer.files); }}
                  className={`mt-4 grid grid-cols-3 gap-3 rounded-[20px] border border-dashed p-3 transition sm:grid-cols-4 md:grid-cols-5 ${dragging ? "border-accent bg-surface" : "border-[rgba(22,21,15,0.2)]"}`}
                >
                  <button onClick={() => fileInput.current?.click()} className="flex aspect-[9/14] flex-col items-center justify-center rounded-[12px] border border-[rgba(22,21,15,0.14)] text-center transition hover:border-fg">
                    {uploading ? (
                      <>
                        <span className="font-mono text-[12px]">{uploading.pct}%</span>
                        <span className="mono-sm mt-1">{uploading.done + 1} of {uploading.total}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-[22px] leading-none">+</span>
                        <span className="mono-sm mt-2">{dragging ? "drop" : "add videos"}</span>
                      </>
                    )}
                  </button>
                  {drafts.map((p) => (
                    <button key={p.id} onClick={() => setEditing(p)} className="group relative aspect-[9/14] overflow-hidden rounded-[12px] bg-[#16150F] text-left">
                      <video src={p.videoUrl} preload="metadata" className="h-full w-full object-cover transition group-hover:opacity-80" />
                      <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-6 text-[11px] text-[#F4F1EA]">{p.caption || p.name}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[12px] text-faint">MP4 or MOV, up to 64 MB each. Click a draft to add its caption, hashtags and privacy.</p>
              </section>

              {/* Sent */}
              {sent.length > 0 && (
                <section>
                  <div className="flex items-end justify-between">
                    <h2 className="serif text-[28px]">Sent</h2>
                    <span className="mono-sm">{sent.length} total</span>
                  </div>
                  <div className={`${card} mt-4 overflow-x-auto`}>
                    <table className="w-full text-[13px]">
                      <thead><tr className="mono-sm text-left">
                        <th className="px-4 py-3 font-normal">Video</th><th className="px-4 py-3 font-normal">Sent</th><th className="px-4 py-3 font-normal">Delivered</th>
                        <th className="px-4 py-3 text-right font-normal">Views</th><th className="px-4 py-3 text-right font-normal">Likes</th><th className="px-4 py-3 text-right font-normal">Comments</th>
                      </tr></thead>
                      <tbody className="divide-y divide-[rgba(22,21,15,0.08)]">
                        {sent.map((p) => (
                          <tr key={p.id} className="cursor-pointer hover:bg-ink/60" onClick={() => setEditing(p)}>
                            <td className="max-w-[260px] truncate px-4 py-3 font-medium">{p.caption || p.name}</td>
                            <td className="px-4 py-3 font-mono text-[12px] tabular-nums">
                              {p.status === "failed" ? <span className="text-red-700" title={p.error}>failed</span> : hms(p.postedAt?.toDate())}
                            </td>
                            <td className="px-4 py-3 font-mono text-[12px] tabular-nums text-muted">
                              {p.deliveredAt ? `${hms(p.deliveredAt.toDate())}${p.mode === "inbox" ? " · inbox" : ""}` : p.status === "failed" ? (p.error ?? "").slice(0, 40) : p.processing ? p.processing.toLowerCase().replace(/_/g, " ") : "confirming…"}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums">{p.stats ? fmtN(p.stats.views) : "—"}</td>
                            <td className="px-4 py-3 text-right tabular-nums">{p.stats ? fmtN(p.stats.likes) : "—"}</td>
                            <td className="px-4 py-3 text-right tabular-nums">{p.stats ? fmtN(p.stats.comments) : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {sent.some((p) => p.mode === "inbox") && (
                    <p className="mt-2 text-[12px] text-faint">Inbox deliveries are waiting in your TikTok app — open the notification to add a sound and post.</p>
                  )}
                </section>
              )}

              {/* Recent on TikTok */}
              {videos.length > 0 && (
                <section>
                  <div className="flex items-end justify-between">
                    <h2 className="serif text-[28px]">Recent on TikTok</h2>
                    <a href="/dashboard/analytics" className="text-[13px] font-medium hover:text-accent">All analytics →</a>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
                    {videos.slice(0, 5).map((v) => (
                      <a key={v.id} href={v.url} target="_blank" rel="noreferrer" className="group relative aspect-[9/14] overflow-hidden rounded-[12px] bg-[#16150F]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {v.cover && <img src={v.cover} alt="" className="h-full w-full object-cover transition group-hover:opacity-85" />}
                        <span className="absolute bottom-2 left-2 rounded-full bg-[#F4F1EA]/90 px-2 py-0.5 font-mono text-[10px] text-fg">▶ {fmtN(v.views)}</span>
                      </a>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* ================= Sidebar ================= */}
            <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
              <AccountCard
                getToken={() => user.getIdToken()}
                onVideos={setVideos}
                onDisconnect={() => updateDoc(doc(db, "users", user.uid), { tiktok: deleteField() })}
              />

              <div className={`${card} p-5`}>
                <p className="mono">Schedule</p>
                <p className="mt-3 text-[14px] leading-[1.5] text-muted">
                  {drafts.length ? `${drafts.length} draft${drafts.length === 1 ? "" : "s"} ready.` : "Add videos first."}{" "}
                  Smart schedule uses {slots.basis === "history" ? "your account's best hours" : "sensible defaults"}: <span className="text-fg">{describeSlots(slots.slots)}</span>.
                </p>
                <button onClick={smart} disabled={!drafts.length} className="pill-primary mt-4 w-full py-3 text-[14px] font-medium disabled:opacity-40">
                  Smart schedule{drafts.length ? ` ${drafts.length}` : ""}
                </button>
                <button onClick={() => setMore(!more)} className="mt-3 text-[12px] text-faint hover:text-fg">{more ? "Hide options" : "Pick my own time or cadence"}</button>
                {more && (
                  <div className="mt-4 space-y-4 border-t border-[rgba(22,21,15,0.08)] pt-4">
                    <div>
                      <p className="mono-sm uppercase tracking-[0.15em]">Exact time</p>
                      <div className="mt-2 flex gap-2">
                        <input type="datetime-local" value={exact} onChange={(e) => setExact(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-[rgba(22,21,15,0.14)] bg-ink px-2 py-1.5 text-[12px]" />
                        <button onClick={atExact} disabled={!drafts.length || !exact} className="pill-secondary px-3 text-[12px] font-medium disabled:opacity-40">Set</button>
                      </div>
                      <div className="mt-2 flex gap-2">
                        {[5, 15, 60].map((m) => (
                          <button key={m} onClick={() => quick(m)} disabled={!drafts.length} className="pill-secondary flex-1 py-1.5 text-[12px] disabled:opacity-40">in {m < 60 ? `${m} min` : "1 h"}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mono-sm uppercase tracking-[0.15em]">Weekly cadence</p>
                      <div className="mt-2 flex gap-1.5">
                        {DAY_LABELS.map((l, i) => (
                          <button key={i} onClick={() => setDays((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i]))} className="h-8 w-8 rounded-full text-[12px] font-medium transition" style={{ background: days.includes(i) ? "#4E5B3A" : "rgba(22,21,15,0.07)", color: days.includes(i) ? "#F4F1EA" : "#55534A" }}>{l}</button>
                        ))}
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-[12px]">
                        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="rounded-lg border border-[rgba(22,21,15,0.14)] bg-ink px-2 py-1" />
                        <select value={perDay} onChange={(e) => setPerDay(Number(e.target.value))} className="rounded-lg border border-[rgba(22,21,15,0.14)] bg-ink px-2 py-1">
                          {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n} / day</option>)}
                        </select>
                        <button onClick={cadence} disabled={!drafts.length || !days.length} className="pill-secondary ml-auto px-3 py-1 font-medium disabled:opacity-40">Apply</button>
                      </div>
                    </div>
                    <button onClick={runNow} disabled={running} className="pill-secondary w-full py-1.5 text-[12px] text-muted disabled:opacity-40">{running ? "Running…" : "Run scheduler now"}</button>
                  </div>
                )}
              </div>

              <div className={`${card} flex items-center gap-3 px-5 py-4`}>
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <p className="text-[12px] text-muted">Scheduler active · checks every 5 minutes{running ? " · running now" : ""}</p>
              </div>
            </aside>
          </div>
        )}
      </main>
      <Footer />

      {editing && (
        <PostEditor
          post={posts.find((p) => p.id === editing.id) ?? editing}
          onClose={() => setEditing(null)}
          onPostNow={() => { if (!connection) { setNotice("Connect TikTok first."); return; } setComposing(editing); setEditing(null); }}
        />
      )}
      {composing && connection && (
        <PostComposer
          creative={{ id: composing.id, caption: composing.caption }}
          connection={connection}
          onClose={() => setComposing(null)}
          onPublish={async (opts) => {
            try { await authed("/api/tiktok/publish", { postId: composing.id, ...opts }); return null; }
            catch (e) { return e instanceof Error ? e.message : "Publish failed."; }
          }}
        />
      )}
    </>
  );
}
