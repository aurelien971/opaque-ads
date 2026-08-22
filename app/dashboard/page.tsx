"use client";
// The studio dashboard: TikTok connection, creative queue, upload, publish.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { deleteField, doc, onSnapshot, updateDoc } from "firebase/firestore";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PostComposer from "@/components/PostComposer";
import { auth, db } from "@/lib/firebase";
import { useRequireAuth } from "@/lib/auth";
import {
  buildAuthUrl,
  tiktokClientKey,
  type TikTokConnection,
} from "@/lib/tiktok";
import {
  addCreative,
  deleteCreative,
  updateCreative,
  watchCreatives,
  type Creative,
} from "@/lib/creatives";

export default function Dashboard() {
  const { user, loading } = useRequireAuth();
  const [connection, setConnection] = useState<TikTokConnection | null>(null);
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [composing, setComposing] = useState<Creative | null>(null);
  const [notice, setNotice] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const stopUser = onSnapshot(doc(db, "users", user.uid), (snap) => {
      setConnection((snap.data()?.tiktok as TikTokConnection) ?? null);
    });
    const stopCreatives = watchCreatives(user.uid, setCreatives);
    return () => {
      stopUser();
      stopCreatives();
    };
  }, [user]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        Loading…
      </div>
    );
  }

  async function connectTikTok() {
    if (!tiktokClientKey()) {
      setNotice(
        "TikTok connection is pending platform approval — it activates the moment TikTok issues our production keys. Everything else works today.",
      );
      return;
    }
    window.location.href = await buildAuthUrl();
  }

  async function disconnectTikTok() {
    await updateDoc(doc(db, "users", user!.uid), { tiktok: deleteField() });
  }

  async function onUpload(files: FileList | null) {
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      setUploadPct(0);
      try {
        await addCreative(user!.uid, file, setUploadPct);
      } catch {
        setNotice("Upload failed — check your connection and try again.");
      }
    }
    setUploadPct(null);
  }

  async function publish(c: Creative, opts: Parameters<
    React.ComponentProps<typeof PostComposer>["onPublish"]
  >[0]): Promise<string | null> {
    const res = await fetch("/api/tiktok/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accessToken: connection!.accessToken,
        videoUrl: c.videoUrl,
        ...opts,
      }),
    });
    const data = await res.json();
    if (!res.ok) return data.error ?? "Publishing failed.";
    await updateCreative(user!.uid, c.id, {
      status: "posted",
      caption: opts.caption,
      postedAt: Date.now(),
    });
    return null;
  }

  const drafts = creatives.filter((c) => c.status === "draft");
  const posted = creatives.filter((c) => c.status === "posted");

  return (
    <>
      <Nav />
      <main className="mx-auto min-h-[80vh] max-w-5xl px-5 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Your studio</h1>
          <div className="flex items-center gap-4 text-sm text-muted">
            <span>{user.email}</span>
            <button onClick={() => signOut(auth)} className="hover:text-fg">
              Sign out
            </button>
          </div>
        </div>

        {notice && (
          <div className="mt-4 rounded-xl border border-accent/40 bg-surface p-4 text-sm text-accent">
            {notice}
            <button onClick={() => setNotice("")} className="ml-3 text-muted">
              dismiss
            </button>
          </div>
        )}

        {/* TikTok connection */}
        <section className="mt-6 rounded-2xl border border-stroke bg-surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold">TikTok connection</h2>
              {connection ? (
                <p className="mt-1 text-sm text-muted">
                  Connected as{" "}
                  <span className="font-semibold text-fg">
                    @{connection.displayName}
                  </span>{" "}
                  — you approve every post before it goes out.
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted">
                  Connect your own TikTok account to publish directly from your
                  queue. You&apos;ll approve the permissions on TikTok&apos;s
                  consent screen.
                </p>
              )}
            </div>
            {connection ? (
              <button
                onClick={disconnectTikTok}
                className="rounded-full border border-stroke px-5 py-2 text-sm font-semibold hover:border-red-400 hover:text-red-400"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={connectTikTok}
                className="rounded-full bg-fg px-5 py-2 text-sm font-semibold text-white hover:bg-deep hover:text-white"
              >
                Connect TikTok
              </button>
            )}
          </div>
        </section>

        {/* Upload */}
        <section className="mt-6 rounded-2xl border border-dashed border-stroke bg-surface/50 p-6 text-center">
          <input
            ref={fileInput}
            type="file"
            accept="video/mp4,video/quicktime"
            multiple
            hidden
            onChange={(e) => onUpload(e.target.files)}
          />
          {uploadPct !== null ? (
            <div>
              <p className="text-sm text-muted">Uploading… {uploadPct}%</p>
              <div className="mx-auto mt-2 h-1.5 w-64 overflow-hidden rounded-full bg-ink">
                <div
                  className="mercury-bg h-full transition-all"
                  style={{ width: `${uploadPct}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={() => fileInput.current?.click()}
                className="rounded-full bg-fg px-6 py-2.5 text-sm font-semibold text-white hover:bg-deep hover:text-white"
              >
                Upload creatives
              </button>
              <p className="mt-2 text-xs text-muted">
                MP4 or MOV. AI generation from photos lands here next — upload
                finished renders meanwhile.
              </p>
            </>
          )}
        </section>

        {/* Queue */}
        <section className="mt-8">
          <h2 className="font-semibold">
            Queue{" "}
            <span className="text-sm font-normal text-muted">
              {drafts.length} draft{drafts.length === 1 ? "" : "s"}
            </span>
          </h2>
          {drafts.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              Nothing queued — upload a creative to get started.
            </p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {drafts.map((c) => (
                <div
                  key={c.id}
                  className="overflow-hidden rounded-2xl border border-stroke bg-surface"
                >
                  <video
                    src={c.videoUrl}
                    controls
                    preload="metadata"
                    className="aspect-[9/16] w-full bg-ink object-contain"
                  />
                  <div className="p-4">
                    <p className="truncate text-sm font-semibold">{c.name}</p>
                    <textarea
                      placeholder="Caption…"
                      value={c.caption}
                      onChange={(e) =>
                        updateCreative(user.uid, c.id, {
                          caption: e.target.value,
                        })
                      }
                      rows={2}
                      className="mt-2 w-full rounded-lg border border-stroke bg-ink px-2 py-1.5 text-xs outline-none focus:border-accent"
                    />
                    <div className="mt-3 flex justify-between">
                      <button
                        onClick={() => deleteCreative(user.uid, c)}
                        className="text-xs text-muted hover:text-red-400"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() =>
                          connection
                            ? setComposing(c)
                            : setNotice(
                                "Connect your TikTok account first — then every draft gets a Publish button.",
                              )
                        }
                        className="rounded-full bg-fg px-4 py-1 text-xs font-semibold text-white hover:bg-deep hover:text-white"
                      >
                        Publish…
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Posted */}
        {posted.length > 0 && (
          <section className="mt-10">
            <h2 className="font-semibold">
              Posted{" "}
              <span className="text-sm font-normal text-muted">
                {posted.length}
              </span>
            </h2>
            <div className="mt-4 space-y-2">
              {posted.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-xl border border-stroke bg-surface/50 px-4 py-3 text-sm"
                >
                  <span className="truncate">{c.name}</span>
                  <span className="text-xs text-muted">
                    {c.postedAt ? new Date(c.postedAt).toLocaleString() : ""}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        <p className="mt-12 text-xs text-muted">
          Need your data gone?{" "}
          <Link href="/data-deletion" className="text-accent">
            Data deletion
          </Link>{" "}
          — disconnecting TikTok deletes our stored tokens immediately.
        </p>
      </main>
      <Footer />

      {composing && connection && (
        <PostComposer
          creative={composing}
          connection={connection}
          onClose={() => setComposing(null)}
          onPublish={(opts) => publish(composing, opts)}
        />
      )}
    </>
  );
}
