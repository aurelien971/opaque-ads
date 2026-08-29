"use client";
// The post details sheet: everything about one scheduled/draft post in one
// place — preview, caption, hashtags, privacy, interaction toggles, commercial
// disclosure, and the exact time it goes out. Saves explicitly, says so.
import { useEffect, useState } from "react";
import { Timestamp } from "firebase/firestore";
import { PRIVACY_LEVELS } from "@/lib/tiktok";
import type { CreatorInfo } from "@/lib/tiktok-server";
import { deletePost, unschedule, updatePost, type Post } from "@/lib/posts";

const toLocalInput = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export default function PostEditor({
  post,
  account,
  step,
  onClose,
  onNext,
  onPostNow,
  getCreator,
}: {
  post: Post;
  /** @handle of the connected account — TikTok requires it be shown at publish. */
  account?: string;
  /** Set while reviewing a freshly uploaded batch: "3 of 7". */
  step?: { index: number; total: number };
  onClose: () => void;
  onNext?: () => void;
  /** Publishes this post immediately with whatever is saved on it. */
  onPostNow: (postId: string) => Promise<void>;
  /** Fetches creator_info from TikTok for the connected account. */
  getCreator: () => Promise<CreatorInfo>;
}) {
  const [caption, setCaption] = useState(post.caption ?? "");
  const [hashtags, setHashtags] = useState(post.hashtags ?? "");
  // Deliberately empty until chosen: TikTok's UX rules forbid pre-selecting a
  // privacy level, and nothing may be published before one is picked.
  const [privacy, setPrivacy] = useState(post.privacy ?? "");
  // Interaction settings start OFF and are opted into by hand — TikTok's
  // guidelines require it, and a pre-ticked box fails the audit.
  const [allowComments, setAllowComments] = useState(post.allowComments ?? false);
  const [allowDuet, setAllowDuet] = useState(post.allowDuet ?? false);
  const [allowStitch, setAllowStitch] = useState(post.allowStitch ?? false);
  const [commercial, setCommercial] = useState(post.commercial ?? false);
  const [yourBrand, setYourBrand] = useState(post.yourBrand ?? false);
  const [brandedContent, setBrandedContent] = useState(post.brandedContent ?? false);
  const [when, setWhen] = useState(post.dueAt ? toLocalInput(post.dueAt.toDate()) : "");
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");
  const [posting, setPosting] = useState(false);
  const [creator, setCreator] = useState<CreatorInfo | null>(null);
  const [creatorError, setCreatorError] = useState("");
  const [duration, setDuration] = useState<number | null>(null);

  // Point 1 of the guidelines: show real, fetched creator information.
  useEffect(() => {
    let alive = true;
    getCreator()
      .then((c) => alive && setCreator(c))
      .catch((e) => alive && setCreatorError(e instanceof Error ? e.message : String(e)));
    return () => {
      alive = false;
    };
  }, [getCreator]);

  useEffect(() => {
    if (brandedContent && privacy === "SELF_ONLY") setPrivacy("");
  }, [brandedContent, privacy]);

  const isScheduled = post.status === "scheduled";

  async function save() {
    setSaved("saving");
    const fields: Partial<Post> = {
      caption,
      hashtags,
      ...(privacy ? { privacy } : {}),
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

  // Post now saves first, so what goes out is exactly what's on screen — no
  // second sheet asking for the caption all over again.
  async function postNow() {
    setPosting(true);
    try {
      await save();
      await onPostNow(post.id);
    } finally {
      setPosting(false);
    }
  }

  const isPhoto = post.mediaType === "PHOTO";

  // Everything below is dictated by the account, not by us.
  const levels = creator?.privacy_level_options ?? Object.keys(PRIVACY_LEVELS);
  const tooLong =
    !isPhoto && creator && duration !== null && duration > creator.max_video_post_duration_sec;
  // Branded content can't be private, and the guidelines want that said out loud.
  const privateBlocked = brandedContent;
  const canPost = !!privacy && !tooLong && !(commercial && !yourBrand && !brandedContent);
  const lastStep = !step || step.index === step.total - 1;

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
              {step
                ? `REVIEW ${step.index + 1} OF ${step.total}`
                : isScheduled ? "SCHEDULED POST" : post.status === "draft" ? "DRAFT" : post.status.toUpperCase()}
            </p>
            <h2 className="font-semibold">{post.name}</h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-fg">✕</button>
        </div>

        <div className="border-b border-stroke px-6 py-4">
          <p className="text-xs font-semibold text-muted">POSTING TO</p>
          {creator ? (
            <div className="mt-2 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={creator.creator_avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
              <div>
                <p className="text-sm font-semibold">{creator.creator_nickname}</p>
                <p className="text-[11px] text-muted">
                  @{creator.creator_username} · max video {Math.floor(creator.max_video_post_duration_sec / 60)} min
                </p>
              </div>
            </div>
          ) : creatorError ? (
            <p className="mt-2 text-[12px] text-red-600">Couldn&apos;t read your account from TikTok: {creatorError}</p>
          ) : (
            <p className="mt-2 text-[12px] text-muted">Reading your account from TikTok…</p>
          )}
        </div>

        <div className="grid gap-6 p-6 sm:grid-cols-[160px_1fr]">
          {/* One grid cell: the media and whatever has to be said about it. */}
          <div>
            {post.mediaType === "PHOTO" ? (
              <>
                <div className="flex gap-2 overflow-x-auto rounded-xl bg-black p-2">
                  {(post.photoUrls ?? []).map((u, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={u} alt={`Slide ${i + 1}`} className="aspect-[9/16] w-[46%] shrink-0 rounded-lg object-cover" />
                  ))}
                </div>
                <p className="mt-2 text-[12px] text-faint">
                  Slideshow · {(post.photoUrls ?? []).length} slides · TikTok adds a soundtrack automatically.
                </p>
              </>
            ) : (
              <>
                <video
                  src={post.videoUrl}
                  controls
                  preload="metadata"
                  onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                  className="aspect-[9/16] w-full rounded-xl bg-black object-contain"
                />
                {duration !== null && (
                  <p className={`mt-2 text-[12px] ${tooLong ? "text-red-600" : "text-faint"}`}>
                    {Math.round(duration)}s
                    {creator ? ` of ${creator.max_video_post_duration_sec}s allowed` : ""}
                    {tooLong ? " — too long for this account." : ""}
                  </p>
                )}
              </>
            )}
          </div>

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
                <option value="" disabled>Choose who can see this…</option>
                {levels.map((k) => (
                  <option key={k} value={k} disabled={privateBlocked && k === "SELF_ONLY"}>
                    {PRIVACY_LEVELS[k] ?? k}
                  </option>
                ))}
              </select>
              {!privacy && (
                <p className="mt-1 text-[11px] text-muted">Pick one before posting — nothing is chosen for you.</p>
              )}
              {privateBlocked && (
                <p className="mt-1 text-[11px] text-red-600">Branded content visibility cannot be set to private.</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-muted">WHO CAN INTERACT</label>
              <div className="mt-1 flex flex-wrap gap-4 text-sm">
                {([
                  ["Comments", allowComments, setAllowComments, creator?.comment_disabled],
                  ["Duet", allowDuet, setAllowDuet, isPhoto || creator?.duet_disabled],
                  ["Stitch", allowStitch, setAllowStitch, isPhoto || creator?.stitch_disabled],
                ] as const).map(([l, v, set, off]) => (
                  <label key={l} className={`flex items-center gap-2 ${off ? "opacity-40" : ""}`}>
                    <input
                      type="checkbox"
                      checked={v && !off}
                      disabled={!!off}
                      onChange={(e) => set(e.target.checked)}
                      className="accent-[#4E5B3A]"
                    />
                    {l}
                    {off && <span className="text-[11px] text-muted">(off for this account)</span>}
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-stroke bg-ink p-3 text-sm">
              <label className="flex items-center gap-2 font-semibold">
                <input type="checkbox" checked={commercial} onChange={(e) => setCommercial(e.target.checked)} className="accent-[#4E5B3A]" />
                Disclose commercial content
              </label>
              <p className="mt-1 pl-6 text-[11px] text-muted">
                Turn on if this post promotes a brand, product or service.
              </p>
              {commercial && (
                <div className="mt-2 space-y-1.5 pl-6 text-xs">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={yourBrand} onChange={(e) => setYourBrand(e.target.checked)} className="accent-[#4E5B3A]" />
                    Your brand — this post will be labelled <span className="font-semibold">Promotional content</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={brandedContent} onChange={(e) => setBrandedContent(e.target.checked)} className="accent-[#4E5B3A]" />
                    Branded content — this post will be labelled <span className="font-semibold">Paid partnership</span>
                  </label>
                  {!yourBrand && !brandedContent && (
                    <p className="text-[11px] text-red-600">Choose at least one, or turn commercial content off.</p>
                  )}
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
              <p className="mt-1 text-[11px] text-muted">
                {isPhoto
                  ? "Sound: TikTok picks one from its licensed library automatically."
                  : "Sound: add it inside TikTok when the draft arrives — the API can’t attach sounds to video."}
              </p>
              <p className="mt-1 text-[11px] text-muted">Leave this empty and the post just waits as a draft until you schedule or post it.</p>
            </div>
          </div>
        </div>

        <div className="mt-auto border-t border-stroke px-6 py-4">
          {/* TikTok requires the destination account and the music confirmation
              to be visible wherever a post can be sent. */}
          <p className="mb-3 text-[11px] text-muted">
            {account ? <>Posting to <span className="font-semibold text-fg">@{account}</span>. </> : null}
            By posting you confirm this content complies with TikTok&apos;s{" "}
            {brandedContent ? (
              <>
                <a className="underline" href="https://www.tiktok.com/legal/page/global/bc-policy/en" target="_blank" rel="noreferrer">
                  Branded Content Policy
                </a>{" and "}
              </>
            ) : null}
            <a className="underline" href="https://www.tiktok.com/legal/page/global/music-usage-confirmation/en" target="_blank" rel="noreferrer">
              Music Usage Confirmation
            </a>.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {post.status !== "posted" && (
              <button
                onClick={postNow}
                disabled={posting || !canPost}
                title={canPost ? undefined : "Choose who can see this first"}
                className="glass-bright rounded-full px-6 py-2.5 text-sm font-semibold disabled:opacity-40"
              >
                {posting ? "Posting…" : "Post now"}
              </button>
            )}

            <button
              onClick={async () => {
                await save();
                onNext?.();
              }}
              className="rounded-full border border-stroke px-5 py-2.5 text-sm font-semibold hover:border-accent"
            >
              {saved === "saving"
                ? "Saving…"
                : step
                  ? lastStep ? "Save & finish" : "Save & next →"
                  : saved === "saved" ? "Saved ✓" : when ? "Save & schedule" : "Save"}
            </button>

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
    </div>
  );
}
