"use client";
// Sidebar account card: who's connected and how the account is doing, in one
// quiet panel. Also hands the account's recent videos up to the dashboard.
import { useEffect, useState } from "react";
import Link from "next/link";
import type { TikTokProfile, TikTokVideo } from "@/lib/tiktok-server";
import { fmtN } from "@/lib/analytics";

export default function AccountCard({
  getToken,
  onVideos,
  onProfile,
  onDisconnect,
}: {
  getToken: () => Promise<string>;
  onVideos?: (v: TikTokVideo[]) => void;
  onProfile?: (p: TikTokProfile) => void;
  onDisconnect: () => void;
}) {
  const [profile, setProfile] = useState<TikTokProfile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/tiktok/studio", { method: "POST", headers: { Authorization: `Bearer ${await getToken()}` } });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setProfile(data.profile);
        onProfile?.(data.profile);
        onVideos?.(data.videos);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't reach TikTok.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-[20px] border border-[rgba(22,21,15,0.08)] bg-surface p-5">
      <p className="mono">Connected account</p>
      {error && <p className="mt-3 text-[13px] text-red-700">{error}</p>}
      <div className="mt-4 flex items-center gap-3">
        {profile?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatarUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
        ) : (
          <div className="h-12 w-12 rounded-full bg-ink" />
        )}
        <div className="min-w-0">
          <p className="truncate text-[15px] font-medium">@{profile?.displayName ?? "…"}</p>
          {profile?.profileUrl && (
            <a href={profile.profileUrl} target="_blank" rel="noreferrer" className="text-[12px] text-faint hover:text-fg">Open on TikTok ↗</a>
          )}
        </div>
      </div>
      {profile && (
        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-[rgba(22,21,15,0.08)] pt-4">
          {[["Followers", profile.followers], ["Likes", profile.likes], ["Videos", profile.videos]].map(([l, v]) => (
            <div key={l as string}>
              <p className="text-[18px] font-medium tabular-nums">{fmtN(v as number)}</p>
              <p className="mono-sm">{l}</p>
            </div>
          ))}
        </div>
      )}
      <div className="mt-5 flex items-center justify-between text-[12px]">
        <Link href="/dashboard/analytics" className="font-medium hover:text-accent">Analytics →</Link>
        <button onClick={onDisconnect} className="text-faint hover:text-fg">Disconnect</button>
      </div>
    </div>
  );
}
