"use client";
// The landing: a living Three.js hero (chrome mercury field, orbit parallax,
// pointer dust, scan-line intro) with glass UI over it.
import Link from "next/link";
import dynamic from "next/dynamic";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const HeroScene = dynamic(() => import("@/components/HeroScene"), { ssr: false });

const FEATURES = [
  {
    title: "AI before/after creatives",
    body: "Upload product or model photos and generate transformation videos — the single highest-retention ad format on TikTok. Every render is unique: hooks, pacing, and text variants are sampled per video.",
    icon: "✦",
  },
  {
    title: "Template studio",
    body: "Design a template once — beat timelines, reveals, hooks, endings, overlays — then mass-produce diverse variations from it. What you preview is exactly what renders.",
    icon: "▦",
  },
  {
    title: "Music that fits the cut",
    body: "Bring your licensed tracks. Opaque Studio BPM-matches them to each template's pacing and bakes them into the render with clean fades.",
    icon: "♪",
  },
  {
    title: "Publish to TikTok",
    body: "Connect your TikTok account and post directly from your queue — with full control over privacy level, comments, duets, and commercial content disclosure on every post.",
    icon: "➤",
  },
  {
    title: "Variant tracking",
    body: "Every video carries a variant key — template, hook, filter, pacing, song. Match it against views to learn which creative decisions actually retain.",
    icon: "◔",
  },
  {
    title: "A queue that ships",
    body: "Schedule your week of posts in one sitting. Drafts, captions, and hashtags are generated with the creative, ready to edit before they go out.",
    icon: "☰",
  },
];

const STEPS = [
  ["Create", "Upload photos, pick a template, generate a batch of unique video creatives."],
  ["Review", "Approve the ones you love, tweak captions, pick the song."],
  ["Connect", "Link your TikTok account with one tap — you approve every permission."],
  ["Publish", "Post now or schedule the week. Track what retains, double down."],
];

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        {/* Hero — the living scene */}
        <section className="relative -mt-14 flex min-h-[100svh] items-center overflow-hidden">
          <HeroScene />
          {/* Readability scrim behind the copy + bottom fade into the page */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-3/5 bg-gradient-to-r from-ink/95 via-ink/55 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-ink" />
          <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pt-14">
            <div className="max-w-xl">
              <p className="glass mb-5 inline-block rounded-full px-4 py-1.5 text-xs font-semibold tracking-widest text-accent">
                BETA — FREE WHILE WE BUILD
              </p>
              <h1 className="text-5xl font-bold leading-[1.05] md:text-7xl">
                <span className="mercury-text">AI creatives,</span>
                <br />
                published to TikTok.
              </h1>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
                Opaque Studio turns your product photos into scroll-stopping
                before/after videos, scores them with music, and publishes them
                straight to your TikTok account.
              </p>
              <div className="mt-9 flex flex-wrap gap-4">
                <Link
                  href="/signup"
                  className="glass-bright rounded-full px-7 py-3.5 font-semibold text-fg transition"
                >
                  Start free
                </Link>
                <Link
                  href="/#features"
                  className="glass rounded-full px-7 py-3.5 font-semibold text-fg transition hover:border-accent/50"
                >
                  Explore the studio
                </Link>
              </div>
            </div>
          </div>
          <div className="scroll-hint absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-muted">
            ↓
          </div>
        </section>

        {/* Features */}
        <section id="features" className="relative">
          <div className="mx-auto max-w-6xl px-5 py-24">
            <h2 className="text-3xl font-bold md:text-4xl">
              The whole pipeline, <span className="mercury-text">one studio</span>
            </h2>
            <p className="mt-3 max-w-xl text-muted">
              Most teams stitch together a designer, an editor, a scheduler, and a
              spreadsheet. Opaque Studio is the pipeline: generate → review →
              publish → learn.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="glass scan-card rounded-2xl p-6 transition hover:border-accent/50 hover:shadow-lg hover:shadow-deep/20"
                >
                  <div className="mercury-text text-2xl">{f.icon}</div>
                  <h3 className="mt-3 font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-3xl font-bold">How it works</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-4">
            {STEPS.map(([title, body], i) => (
              <div key={title}>
                <div className="mercury-text text-4xl font-bold">{i + 1}</div>
                <h3 className="mt-2 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
              </div>
            ))}
          </div>
          <div className="glass mt-12 rounded-2xl p-6 text-sm leading-relaxed text-muted">
            <strong className="text-fg">Your account, your rules.</strong> Opaque
            Studio publishes only what you approve, to the TikTok account you
            connect, with the privacy level you choose on each post. Disconnect
            at any time — revoking access takes one click here or in your TikTok
            settings.
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden border-t border-stroke/60">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[42rem] -translate-x-1/2 rounded-full bg-deep/20 blur-3xl" />
          <div className="relative mx-auto max-w-6xl px-5 py-20 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">
              Your next hundred creatives are{" "}
              <span className="mercury-text">one batch away</span>
            </h2>
            <p className="mx-auto mt-3 max-w-md text-muted">
              Free during beta. No credit card. Bring a product photo and see
              your first before/after in minutes.
            </p>
            <Link
              href="/signup"
              className="glass-bright mt-9 inline-block rounded-full px-9 py-3.5 font-semibold text-fg transition"
            >
              Create your account
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
