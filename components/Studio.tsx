"use client";
// The user's TikTok studio: who they are, how the account is doing, and every
// video with its numbers — plus a quick report (totals, averages, best post).
import { useEffect, useState } from "react";
import type { TikTokProfile, TikTokVideo } from "@/lib/tiktok-server";

const n = (v: number) =>
  v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(1)}K` : String(v);

export default function Studio({ getToken, onVideos }: { getToken: () => Promise<string>; onVideos?: (v: TikTokVideo[]) => void }) {
  const [profile, setProfile] = useState<TikTokProfile | null>(null);
  const [videos, setVideos] = useState<TikTokVideo[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tiktok/studio", {
        method: "POST",
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfile(data.profile);
      setVideos(data.videos);
      onVideos?.(data.videos);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load your studio.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && !profile) {
    return <div className="mt-6 rounded-2xl border border-stroke bg-surface p-6 text-sm text-muted">Loading your studio…</div>;
  }
  if (error && !profile) {
    return <div className="mt-6 rounded-2xl border border-stroke bg-surface p-6 text-sm text-red-500">{error}</div>;
  }
  if (!profile) return null;

  const totalViews = videos.reduce((a, v) => a + v.views, 0);
  const totalLikes = videos.reduce((a, v) => a + v.likes, 0);
  const avgViews = videos.length ? Math.round(totalViews / videos.length) : 0;
  const engagement = totalViews ? ((totalLikes / totalViews) * 100).toFixed(1) : "0.0";
  const best = videos.length ? videos.reduce((a, v) => (v.views > a.views ? v : a)) : null;

  return (
    <section className="mt-6">
      {/* Account header */}
      <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-stroke bg-surface p-6">
        {profile.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-stroke" />
        ) : (
          <div className="h-16 w-16 rounded-full bg-ink" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold">
            @{profile.displayName} {profile.verified && <span className="text-accent">✓</span>}
          </p>
          {profile.bio && <p className="truncate text-sm text-muted">{profile.bio}</p>}
          {profile.profileUrl && (
            <a href={profile.profileUrl} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline">
              Open on TikTok ↗
            </a>
          )}
        </div>
        <div className="grid grid-cols-4 gap-6 text-center">
          {[
            ["Followers", profile.followers],
            ["Following", profile.following],
            ["Likes", profile.likes],
            ["Videos", profile.videos],
          ].map(([l, v]) => (
            <div key={l as string}>
              <p className="text-xl font-bold tabular-nums">{n(v as number)}</p>
              <p className="text-[11px] text-muted">{l}</p>
            </div>
          ))}
        </div>
        <button onClick={load} disabled={loading} className="rounded-full border border-stroke px-4 py-1.5 text-xs font-semibold text-muted hover:border-accent hover:text-fg disabled:opacity-50">
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* Report */}
      {videos.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {[
            ["Total views", n(totalViews), `across ${videos.length} recent videos`],
            ["Avg views / video", n(avgViews), "recent videos"],
            ["Like rate", `${engagement}%`, "likes ÷ views"],
            ["Best post", best ? n(best.views) : "—", best ? (best.title || "untitled").slice(0, 34) : ""],
          ].map(([l, v, s]) => (
            <div key={l} className="rounded-2xl border border-stroke bg-surface p-4">
              <p className="text-[11px] font-semibold tracking-wide text-muted">{l.toUpperCase()}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{v}</p>
              <p className="truncate text-xs text-muted">{s}</p>
            </div>
          ))}
        </div>
      )}

      {/* Videos */}
      <h2 className="mt-8 font-semibold">
        Your videos <span className="text-sm font-normal text-muted">{videos.length} most recent</span>
      </h2>
      {videos.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No videos on this account yet — the ones you schedule will show up here with their numbers.</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {videos.map((v) => (
            <a
              key={v.id}
              href={v.url}
              target="_blank"
              rel="noreferrer"
              className="group overflow-hidden rounded-2xl border border-stroke bg-surface transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(84,125,204,0.18)]"
            >
              <div className="relative aspect-[9/16] bg-ink">
                {v.cover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.cover} alt="" className="h-full w-full object-cover" />
                )}
                <span className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white">
                  ▶ {n(v.views)}
                </span>
              </div>
              <div className="p-3">
                <p className="truncate text-xs font-semibold">{v.title || "Untitled"}</p>
                <p className="mt-1 text-[11px] text-muted">
                  {new Date(v.createdAt * 1000).toLocaleDateString()}
                </p>
                <div className="mt-2 flex justify-between text-[11px] text-muted">
                  <span>♥ {n(v.likes)}</span>
                  <span>💬 {n(v.comments)}</span>
                  <span>↗ {n(v.shares)}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
