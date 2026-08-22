"use client";
// The publish sheet — implements TikTok's required UX for the Content Posting
// API: creator identity shown, privacy chosen manually (never pre-selected),
// interaction toggles, commercial content disclosure, and the music/branded
// content declarations. Mirrors the compliant sheet from our desktop tooling.
import { useEffect, useState } from "react";
import { PRIVACY_LEVELS, type TikTokConnection } from "@/lib/tiktok";

export default function PostComposer({
  creative,
  connection,
  onClose,
  onPublish,
}: {
  creative: { id: string; caption: string };
  connection: TikTokConnection;
  onClose: () => void;
  onPublish: (opts: {
    caption: string;
    privacy: string;
    allowComments: boolean;
    allowDuet: boolean;
    allowStitch: boolean;
    commercial: boolean;
    yourBrand: boolean;
    brandedContent: boolean;
  }) => Promise<string | null>;
}) {
  const [caption, setCaption] = useState(creative.caption);
  const [privacy, setPrivacy] = useState("");
  const [allowComments, setAllowComments] = useState(true);
  const [allowDuet, setAllowDuet] = useState(true);
  const [allowStitch, setAllowStitch] = useState(true);
  const [commercial, setCommercial] = useState(false);
  const [yourBrand, setYourBrand] = useState(false);
  const [brandedContent, setBrandedContent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Branded content can't be private — TikTok requirement.
  useEffect(() => {
    if (brandedContent && privacy === "SELF_ONLY") setPrivacy("");
  }, [brandedContent, privacy]);

  const commercialInvalid = commercial && !yourBrand && !brandedContent;
  const canPost = privacy !== "" && !commercialInvalid && !busy;

  async function publish() {
    setBusy(true);
    setError("");
    const err = await onPublish({
      caption,
      privacy,
      allowComments,
      allowDuet,
      allowStitch,
      commercial,
      yourBrand,
      brandedContent,
    });
    setBusy(false);
    if (err) setError(err);
    else onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-stroke bg-surface p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold">Publish to TikTok</h2>
            <p className="mt-1 text-sm text-muted">
              Publishing to{" "}
              <span className="font-semibold text-fg">
                @{connection.displayName}
              </span>
            </p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-fg">
            ✕
          </button>
        </div>

        <label className="mt-5 block text-xs font-semibold text-muted">
          CAPTION
        </label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={3}
          maxLength={2200}
          className="mt-1 w-full rounded-lg border border-stroke bg-ink px-3 py-2 text-sm outline-none focus:border-accent"
        />

        <label className="mt-4 block text-xs font-semibold text-muted">
          WHO CAN VIEW THIS VIDEO
        </label>
        <select
          value={privacy}
          onChange={(e) => setPrivacy(e.target.value)}
          className="mt-1 w-full rounded-lg border border-stroke bg-ink px-3 py-2 text-sm outline-none focus:border-accent"
        >
          <option value="" disabled>
            Choose a privacy level…
          </option>
          {Object.entries(PRIVACY_LEVELS).map(([k, label]) => (
            <option key={k} value={k} disabled={brandedContent && k === "SELF_ONLY"}>
              {label}
              {brandedContent && k === "SELF_ONLY"
                ? " (unavailable for branded content)"
                : ""}
            </option>
          ))}
        </select>

        <div className="mt-4 space-y-2">
          {(
            [
              ["Allow comments", allowComments, setAllowComments],
              ["Allow Duet", allowDuet, setAllowDuet],
              ["Allow Stitch", allowStitch, setAllowStitch],
            ] as const
          ).map(([label, val, set]) => (
            <label key={label} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={val}
                onChange={(e) => set(e.target.checked)}
                className="accent-[#547dcc]"
              />
              {label}
            </label>
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-stroke bg-ink p-4">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={commercial}
              onChange={(e) => setCommercial(e.target.checked)}
              className="accent-[#547dcc]"
            />
            Disclose commercial content
          </label>
          <p className="mt-1 text-xs text-muted">
            Turn on if this video promotes a brand, product, or service.
          </p>
          {commercial && (
            <div className="mt-3 space-y-2 pl-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={yourBrand}
                  onChange={(e) => setYourBrand(e.target.checked)}
                  className="accent-[#547dcc]"
                />
                Your brand — promoting your own business
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={brandedContent}
                  onChange={(e) => setBrandedContent(e.target.checked)}
                  className="accent-[#547dcc]"
                />
                Branded content — paid partnership with another brand
              </label>
              {commercialInvalid && (
                <p className="text-xs text-orange-400">
                  Select at least one option to disclose commercial content.
                </p>
              )}
            </div>
          )}
        </div>

        <p className="mt-4 text-xs leading-relaxed text-muted">
          By posting, you confirm this content complies with{" "}
          <a
            href="https://www.tiktok.com/legal/page/global/music-usage-confirmation/en"
            target="_blank"
            rel="noreferrer"
            className="text-accent underline"
          >
            TikTok&apos;s Music Usage Confirmation
          </a>
          {brandedContent && (
            <>
              {" "}
              and{" "}
              <a
                href="https://www.tiktok.com/legal/page/global/bc-policy/en"
                target="_blank"
                rel="noreferrer"
                className="text-accent underline"
              >
                Branded Content Policy
              </a>
            </>
          )}
          .
        </p>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <button
          onClick={publish}
          disabled={!canPost}
          className="mt-5 w-full rounded-full bg-fg py-2.5 font-semibold text-white transition hover:bg-deep hover:text-white disabled:opacity-40"
        >
          {busy ? "Publishing…" : "Publish"}
        </button>
      </div>
    </div>
  );
}
