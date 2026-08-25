"use client";
// The post details sheet: everything about one scheduled/draft post in one
// place — preview, caption, hashtags, privacy, interaction toggles, commercial
// disclosure, and the exact time it goes out. Saves explicitly, says so.
import { useEffect, useState } from "react";
import { Timestamp } from "firebase/firestore";
import { PRIVACY_LEVELS } from "@/lib/tiktok";
import { deletePost, unschedule, updatePost, type Post } from "@/lib/posts";

const toLocalInput = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export default function PostEditor({
  post,
  onClose,
  onPostNow,
}: {
  post: Post;
  onClose: () => void;
  onPostNow: () => void;
}) {
  const [caption, setCaption] = useState(post.caption ?? "");
  const [hashtags, setHashtags] = useState(post.hashtags ?? "");
  const [privacy, setPrivacy] = useState(post.privacy ?? "SELF_ONLY");
  const [allowComments, setAllowComments] = useState(post.allowComments ?? true);
  const [allowDuet, setAllowDuet] = useState(post.allowDuet ?? true);
  const [allowStitch, setAllowStitch] = useState(post.allowStitch ?? true);
  const [commercial, setCommercial] = useState(post.commercial ?? false);
  const [yourBrand, setYourBrand] = useState(post.yourBrand ?? false);
  const [brandedContent, setBrandedContent] = useState(post.brandedContent ?? false);
  const [when, setWhen] = useState(post.dueAt ? toLocalInput(post.dueAt.toDate()) : "");
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    if (brandedContent && privacy === "SELF_ONLY") setPrivacy("PUBLIC_TO_EVERYONE");
  }, [brandedContent, privacy]);

  const isScheduled = post.status === "scheduled";

  async function save() {
    setSaved("saving");
    const fields: Partial<Post> = {
      caption,
      hashtags,
      privacy,
      allowComments,
      allowDuet,
      allowStitch,
      commercial,
      yourBrand,
      brandedContent,
    };
    if (when) {
      fields.status = "scheduled";
      fields.dueAt = Timestamp.fromDate(new Date(when));
    }
    await updatePost(post.id, fields);
    setSaved("saved");
    setTimeout(() => setSaved("idle"), 1500);
  }

  const cleanTags = hashtags
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((t) => (t.startsWith("#") ? t : `#${t}`))
    .join(" ");
  const charCount = (caption + (cleanTags ? " " + cleanTags : "")).length;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/50" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-xl flex-col overflow-y-auto bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stroke px-6 py-4">
          <div>
            <p className="text-xs font-bold tracking-widest text-accent">
              {isScheduled ? "SCHEDULED POST" : post.status === "draft" ? "DRAFT" : post.status.toUpperCase()}
            </p>
            <h2 className="font-semibold">{post.name}</h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-fg">✕</button>
        </div>

        <div className="grid gap-6 p-6 sm:grid-cols-[160px_1fr]">
          {post.mediaType === "PHOTO" ? (
            <div className="flex gap-2 overflow-x-auto rounded-xl bg-black p-2">
              {(post.photoUrls ?? []).map((u, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={u} alt={`Slide ${i + 1}`} className="aspect-[9/16] w-[46%] shrink-0 rounded-lg object-cover" />
              ))}
            </div>
          ) : (
            <video src={post.videoUrl} controls preload="metadata" className="aspect-[9/16] w-full rounded-xl bg-black object-contain" />
          )}
          {post.mediaType === "PHOTO" && (
            <p className="mt-2 text-[12px] text-faint">
              Slideshow · {(post.photoUrls ?? []).length} slides · TikTok adds a soundtrack automatically.
            </p>
          )}

          <div className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-muted">CAPTION</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
                placeholder="What's this video about?"
                className="mt-1 w-full rounded-lg border border-stroke bg-ink px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted">HASHTAGS</label>
              <input
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="fyp, beforeafter, yourbrand"
                className="mt-1 w-full rounded-lg border border-stroke bg-ink px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <p className="mt-1 text-[11px] text-muted">
                Posted as: <span className="text-fg">{caption}{cleanTags ? ` ${cleanTags}` : ""}</span>
                <span className={charCount > 2200 ? "text-red-500" : ""}> · {charCount}/2200</span>
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted">WHO CAN VIEW</label>
              <select
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stroke bg-ink px-3 py-2 text-sm outline-none focus:border-accent"
              >
                {Object.entries(PRIVACY_LEVELS).map(([k, l]) => (
                  <option key={k} value={k} disabled={brandedContent && k === "SELF_ONLY"}>{l}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              {([["Comments", allowComments, setAllowComments], ["Duet", allowDuet, setAllowDuet], ["Stitch", allowStitch, setAllowStitch]] as const).map(([l, v, set]) => (
                <label key={l} className="flex items-center gap-2">
                  <input type="checkbox" checked={v} onChange={(e) => set(e.target.checked)} className="accent-[#4E5B3A]" /> {l}
                </label>
              ))}
            </div>

            <div className="rounded-xl border border-stroke bg-ink p-3 text-sm">
              <label className="flex items-center gap-2 font-semibold">
                <input type="checkbox" checked={commercial} onChange={(e) => setCommercial(e.target.checked)} className="accent-[#4E5B3A]" />
                Commercial content
              </label>
              {commercial && (
                <div className="mt-2 space-y-1.5 pl-6 text-xs">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={yourBrand} onChange={(e) => setYourBrand(e.target.checked)} className="accent-[#4E5B3A]" /> Your brand</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={brandedContent} onChange={(e) => setBrandedContent(e.target.checked)} className="accent-[#4E5B3A]" /> Branded content (paid partnership)</label>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-muted">GOES OUT AT (your time)</label>
              <input
                type="datetime-local"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stroke bg-ink px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <p className="mt-1 text-[11px] text-muted">Sound: add it inside TikTok when the draft arrives — the API can&apos;t attach sounds.</p>
            </div>
          </div>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-stroke px-6 py-4">
          <button onClick={save} className="glass-bright rounded-full px-6 py-2.5 text-sm font-semibold">
            {saved === "saving" ? "Saving…" : saved === "saved" ? "Saved ✓" : when ? "Save & schedule" : "Save"}
          </button>
          {post.status !== "posted" && (
            <button onClick={onPostNow} className="rounded-full border border-stroke px-5 py-2.5 text-sm font-semibold hover:border-accent">
              Post now…
            </button>
          )}
          {isScheduled && (
            <button onClick={async () => { await unschedule(post.id); onClose(); }} className="text-sm text-muted hover:text-fg">
              Unschedule
            </button>
          )}
          <button onClick={async () => { await deletePost(post); onClose(); }} className="ml-auto text-sm text-muted hover:text-red-500">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
