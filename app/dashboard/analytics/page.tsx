"use client";
// Analytics: what we can derive from TikTok's API for THIS account —
// follower growth (daily snapshots), best posting slots (views by when you
// posted), hashtag performance, engagement per video. One hue for magnitude,
// thin marks, labels in text tokens, a table under every chart.
import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { db } from "@/lib/firebase";
import { useRequireAuth } from "@/lib/auth";
import { DAY_NAMES, bestSlots, describeSlots, engagement, fmtN, hashtagReport, postingHeatmap } from "@/lib/analytics";
import type { TikTokProfile, TikTokVideo } from "@/lib/tiktok-server";

type Snapshot = { date: string; followers: number; likes: number; videos: number; totalViews: number };

export default function Analytics() {
  const { user, loading } = useRequireAuth();
  const [profile, setProfile] = useState<TikTokProfile | null>(null);
  const [videos, setVideos] = useState<TikTokVideo[]>([]);
  const [snaps, setSnaps] = useState<Snapshot[]>([]);
  const [error, setError] = useState("");
  const [hover, setHover] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await fetch("/api/tiktok/studio", { method: "POST", headers: { Authorization: `Bearer ${await user.getIdToken()}` } });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setProfile(data.profile);
        setVideos(data.videos);
        const q = query(collection(db, "users", user.uid, "snapshots"), orderBy("date"));
        setSnaps((await getDocs(q)).docs.map((d) => d.data() as Snapshot));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't load analytics.");
      }
    })();
  }, [user]);

  if (loading || !user) return <div className="flex min-h-screen items-center justify-center text-muted">Loading…</div>;

  const heat = postingHeatmap(videos);
  const maxAvg = Math.max(1, ...heat.flat().map((c) => c.avg));
  const slots = bestSlots(videos);
  const tags = hashtagReport(videos).slice(0, 8);
  const byEng = [...videos].sort((a, b) => engagement(b) - engagement(a));
  const BUCKETS = ["0–4", "4–8", "8–12", "12–16", "16–20", "20–24"];

  // Follower line — single series, so no legend; the title names it.
  const series = snaps.length ? snaps : profile ? [{ date: new Date().toISOString().slice(0, 10), followers: profile.followers, likes: profile.likes, videos: profile.videos, totalViews: 0 }] : [];
  const W = 640, H = 160, P = 28;
  const ys = series.map((s) => s.followers);
  const yMin = Math.min(...ys, 0), yMax = Math.max(...ys, 1);
  const x = (i: number) => P + (series.length > 1 ? (i / (series.length - 1)) * (W - 2 * P) : (W - 2 * P) / 2);
  const y = (v: number) => H - P - ((v - yMin) / (yMax - yMin || 1)) * (H - 2 * P);
  const path = series.map((s, i) => `${i ? "L" : "M"}${x(i)},${y(s.followers)}`).join(" ");

  return (
    <>
      <Nav />
      <main className="mx-auto min-h-[80vh] max-w-6xl px-5 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/dashboard" className="text-xs text-muted hover:text-fg">← Studio</Link>
            <h1 className="text-2xl font-bold tracking-tight">Analytics {profile ? <span className="text-muted">· @{profile.displayName}</span> : null}</h1>
          </div>
          <p className="text-xs text-muted">Live from TikTok · snapshots taken daily</p>
        </div>
        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

        {/* Headline tiles */}
        {profile && (
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            {[
              ["Followers", fmtN(profile.followers), snaps.length > 1 ? `${profile.followers - snaps[0].followers >= 0 ? "+" : ""}${fmtN(profile.followers - snaps[0].followers)} since ${snaps[0].date}` : "growth appears after a few days"],
              ["Total likes", fmtN(profile.likes), "all time"],
              ["Avg views / video", fmtN(videos.length ? videos.reduce((a, v) => a + v.views, 0) / videos.length : 0), `last ${videos.length} videos`],
              ["Best slots", describeSlots(slots.slots), slots.basis === "history" ? "from your history" : "defaults until you have 4+ videos"],
            ].map(([l, v, s]) => (
              <div key={l} className="rounded-2xl border border-stroke bg-surface p-4">
                <p className="text-[11px] font-semibold tracking-wide text-muted">{l.toUpperCase()}</p>
                <p className="mt-1 truncate text-2xl font-bold tabular-nums">{v}</p>
                <p className="truncate text-xs text-muted">{s}</p>
              </div>
            ))}
          </div>
        )}

        {/* Follower growth */}
        <section className="mt-8 rounded-2xl border border-stroke bg-surface p-6">
          <h2 className="font-semibold">Follower growth</h2>
          <p className="text-xs text-muted">One snapshot per day while your account is connected.</p>
          <div className="mt-4 overflow-x-auto">
            <svg viewBox={`0 0 ${W} ${H}`} className="h-40 w-full min-w-[480px]" role="img" aria-label="Followers over time">
              {[0, 0.5, 1].map((t) => (
                <g key={t}>
                  <line x1={P} x2={W - P} y1={H - P - t * (H - 2 * P)} y2={H - P - t * (H - 2 * P)} stroke="#e6e4df" strokeWidth="1" />
                  <text x={P - 6} y={H - P - t * (H - 2 * P) + 4} textAnchor="end" fontSize="10" fill="#6b7280">{fmtN(yMin + t * (yMax - yMin))}</text>
                </g>
              ))}
              <path d={path} fill="none" stroke="#4E5B3A" strokeWidth="2" strokeLinejoin="round" />
              {series.map((s, i) => (
                <g key={s.date} onMouseEnter={() => setHover(s.date)} onMouseLeave={() => setHover("")}>
                  <circle cx={x(i)} cy={y(s.followers)} r="9" fill="transparent" />
                  <circle cx={x(i)} cy={y(s.followers)} r="4" fill="#4E5B3A" stroke="#fff" strokeWidth="2" />
                  {(hover === s.date || series.length === 1 || i === series.length - 1) && (
                    <text x={x(i)} y={y(s.followers) - 10} textAnchor="middle" fontSize="11" fontWeight="600" fill="#0b0d12">{fmtN(s.followers)}</text>
                  )}
                  {(i === 0 || i === series.length - 1 || hover === s.date) && (
                    <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="#6b7280">{s.date.slice(5)}</text>
                  )}
                </g>
              ))}
            </svg>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Posting-time heatmap */}
          <section className="rounded-2xl border border-stroke bg-surface p-6">
            <h2 className="font-semibold">When your posts perform</h2>
            <p className="text-xs text-muted">Average views by the day and hour you posted. Darker = more views.</p>
            <div className="mt-4 grid grid-cols-[36px_repeat(6,1fr)] gap-1 text-[10px] text-muted">
              <div />
              {BUCKETS.map((b) => <div key={b} className="text-center">{b}</div>)}
              {heat.map((row, d) => (
                <div key={d} className="contents">
                  <div className="flex items-center">{DAY_NAMES[d]}</div>
                  {row.map((c) => {
                    const isBest = slots.basis === "history" && slots.slots.some((s) => s.day === c.day && Math.floor(s.hour / 4) === c.bucket);
                    return (
                      <div
                        key={c.bucket}
                        title={`${DAY_NAMES[c.day]} ${BUCKETS[c.bucket]}h — ${c.count ? `${fmtN(c.avg)} avg views over ${c.count} video${c.count === 1 ? "" : "s"}` : "no posts yet"}`}
                        className={`flex aspect-[2/1] items-center justify-center rounded-md ${isBest ? "ring-2 ring-[#e6a23c]" : ""}`}
                        style={{ background: c.count ? `rgba(78,91,58,${0.15 + 0.85 * (c.avg / maxAvg)})` : "#f0efeb" }}
                      >
                        {c.count > 0 && <span className={`font-semibold ${c.avg / maxAvg > 0.55 ? "text-white" : "text-fg"}`}>{fmtN(c.avg)}</span>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-muted"><span className="inline-block h-2.5 w-2.5 rounded-sm ring-2 ring-[#e6a23c] align-middle" /> best slot — what Smart schedule uses.</p>
          </section>

          {/* Hashtags */}
          <section className="rounded-2xl border border-stroke bg-surface p-6">
            <h2 className="font-semibold">Hashtags that work</h2>
            <p className="text-xs text-muted">Average views of videos using each tag.</p>
            {tags.length === 0 ? (
              <p className="mt-4 text-sm text-muted">No hashtags found in your recent captions yet.</p>
            ) : (
              <table className="mt-4 w-full text-sm">
                <thead className="text-left text-[11px] text-muted"><tr><th className="pb-2">Tag</th><th className="pb-2 text-right">Uses</th><th className="pb-2 text-right">Avg views</th><th className="pb-2 text-right">Like rate</th></tr></thead>
                <tbody className="divide-y divide-stroke">
                  {tags.map((t) => (
                    <tr key={t.tag}>
                      <td className="py-2 font-medium">{t.tag}</td>
                      <td className="py-2 text-right tabular-nums">{t.uses}</td>
                      <td className="py-2 text-right tabular-nums">
                        <span className="mr-2 inline-block h-2 rounded-sm bg-[#4E5B3A] align-middle" style={{ width: `${Math.max(4, (t.avgViews / (tags[0].avgViews || 1)) * 80)}px` }} />
                        {fmtN(t.avgViews)}
                      </td>
                      <td className="py-2 text-right tabular-nums">{(t.likeRate * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>

        {/* Engagement table */}
        <section className="mt-6 rounded-2xl border border-stroke bg-surface p-6">
          <h2 className="font-semibold">Engagement per video</h2>
          <p className="text-xs text-muted">(likes + comments + shares) ÷ views. Higher means the people who saw it, acted.</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[11px] text-muted"><tr><th className="pb-2">Video</th><th className="pb-2">Posted</th><th className="pb-2 text-right">Views</th><th className="pb-2 text-right">Likes</th><th className="pb-2 text-right">Comments</th><th className="pb-2 text-right">Shares</th><th className="pb-2 text-right">Engagement</th></tr></thead>
              <tbody className="divide-y divide-stroke">
                {byEng.map((v) => (
                  <tr key={v.id}>
                    <td className="max-w-[260px] truncate py-2 font-medium"><a href={v.url} target="_blank" rel="noreferrer" className="hover:underline">{v.title || "Untitled"}</a></td>
                    <td className="py-2 text-muted">{new Date(v.createdAt * 1000).toLocaleString([], { weekday: "short", hour: "numeric" })}</td>
                    <td className="py-2 text-right tabular-nums">{fmtN(v.views)}</td>
                    <td className="py-2 text-right tabular-nums">{fmtN(v.likes)}</td>
                    <td className="py-2 text-right tabular-nums">{fmtN(v.comments)}</td>
                    <td className="py-2 text-right tabular-nums">{fmtN(v.shares)}</td>
                    <td className="py-2 text-right tabular-nums font-semibold">{(engagement(v) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
                {videos.length === 0 && <tr><td colSpan={7} className="py-4 text-muted">No videos yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
