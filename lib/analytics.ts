// Derived analytics from what TikTok's API gives us (per-video views/likes/
// comments/shares + create time): best posting slots, hashtag performance,
// engagement. Pure functions — used by the Smart-schedule button and the
// Analytics page.
import type { TikTokVideo } from "./tiktok-server";

export type Slot = { day: number; hour: number }; // local weekday 0–6, hour 0–23

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// 7 × 6 grid of 4-hour buckets: average views of videos posted in each.
export function postingHeatmap(videos: TikTokVideo[]) {
  const sum = Array.from({ length: 7 }, () => Array(6).fill(0));
  const n = Array.from({ length: 7 }, () => Array(6).fill(0));
  for (const v of videos) {
    const d = new Date(v.createdAt * 1000);
    const day = d.getDay();
    const b = Math.floor(d.getHours() / 4);
    sum[day][b] += v.views;
    n[day][b] += 1;
  }
  return sum.map((row, day) => row.map((s, b) => ({ day, bucket: b, avg: n[day][b] ? s / n[day][b] : 0, count: n[day][b] })));
}

// The best slots to post, from the account's own history. Falls back to
// sensible TikTok defaults until there's enough data (≥ 4 videos).
export function bestSlots(videos: TikTokVideo[], want = 3): { slots: Slot[]; basis: "history" | "default" } {
  if (videos.length < 4) {
    return { slots: [{ day: 2, hour: 18 }, { day: 4, hour: 18 }, { day: 6, hour: 12 }].slice(0, want), basis: "default" };
  }
  const cells = postingHeatmap(videos).flat().filter((c) => c.count > 0);
  cells.sort((a, b) => b.avg - a.avg);
  const slots: Slot[] = [];
  for (const c of cells) {
    if (slots.some((s) => s.day === c.day)) continue; // spread across days
    slots.push({ day: c.day, hour: c.bucket * 4 + 2 }); // middle of the 4-hour bucket
    if (slots.length === want) break;
  }
  return { slots: slots.length ? slots : bestSlots([], want).slots, basis: "history" };
}

export function describeSlots(slots: Slot[]) {
  const fmtHour = (h: number) => `${((h + 11) % 12) + 1}${h < 12 ? "am" : "pm"}`;
  return slots.map((s) => `${DAY_NAMES[s.day]} ${fmtHour(s.hour)}`).join(" · ");
}

export function hashtagReport(videos: TikTokVideo[]) {
  const m = new Map<string, { uses: number; views: number; likes: number }>();
  for (const v of videos) {
    const tags = new Set((v.title.match(/#[\p{L}\p{N}_]+/gu) ?? []).map((t) => t.toLowerCase()));
    for (const t of tags) {
      const e = m.get(t) ?? { uses: 0, views: 0, likes: 0 };
      e.uses++;
      e.views += v.views;
      e.likes += v.likes;
      m.set(t, e);
    }
  }
  return [...m.entries()]
    .map(([tag, e]) => ({ tag, uses: e.uses, avgViews: e.views / e.uses, likeRate: e.views ? e.likes / e.views : 0 }))
    .sort((a, b) => b.avgViews - a.avgViews);
}

export const engagement = (v: TikTokVideo) => (v.views ? (v.likes + v.comments + v.shares) / v.views : 0);

export const fmtN = (v: number) =>
  v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(1)}K` : String(Math.round(v));
