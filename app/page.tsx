import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

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
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-16 md:grid-cols-2 md:pt-24">
          <div>
            <p className="mb-4 inline-block rounded-full border border-stroke bg-surface px-3 py-1 text-xs font-semibold tracking-wide text-accent">
              BETA — FREE WHILE WE BUILD
            </p>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">
              <span className="mercury-text">AI creatives,</span>
              <br />
              published to TikTok.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">
              Opaque Studio turns your product photos into scroll-stopping
              before/after videos, scores them with music, and publishes them
              straight to your TikTok account. Built to grow our own app —
              now open to every marketer.
            </p>
            <div className="mt-8 flex gap-4">
              <Link
                href="/signup"
                className="rounded-full bg-accent px-6 py-3 font-semibold text-ink transition hover:bg-deep hover:text-fg"
              >
                Start free
              </Link>
              <Link
                href="/#how"
                className="rounded-full border border-stroke px-6 py-3 font-semibold text-fg transition hover:border-accent"
              >
                How it works
              </Link>
            </div>
          </div>

          {/* CSS phone demo: an endless before→after wipe */}
          <div className="flex justify-center">
            <div className="relative aspect-[9/16] w-64 overflow-hidden rounded-[2rem] border border-stroke bg-surface shadow-2xl shadow-deep/20">
              <div className="absolute inset-0 bg-gradient-to-b from-[#3a3f4d] to-[#22262f]" />
              <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-30">
                🌇
              </div>
              <div className="wipe-layer absolute inset-y-0 left-0 overflow-hidden">
                <div className="absolute inset-y-0 left-0 w-64 bg-gradient-to-b from-deep to-ink" />
                <div className="absolute inset-y-0 left-0 flex w-64 items-center justify-center text-6xl">
                  🌆
                </div>
                <div className="absolute inset-y-0 right-0 w-0.5 bg-accent shadow-[0_0_12px_2px_rgba(163,194,240,0.8)]" />
              </div>
              <div className="chip-in absolute bottom-16 left-1/2 -translate-x-1/2 rounded-full bg-ink/80 px-3 py-1 text-xs font-semibold text-accent">
                Golden Hour
              </div>
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[10px] tracking-wide text-muted">
                rendered by Opaque Studio
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t border-stroke/60 bg-surface/40">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <h2 className="text-3xl font-bold">
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
                  className="rounded-2xl border border-stroke bg-ink p-6 transition hover:border-accent/50"
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
        <section id="how" className="mx-auto max-w-6xl px-5 py-20">
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
          <div className="mt-12 rounded-2xl border border-stroke bg-surface p-6 text-sm leading-relaxed text-muted">
            <strong className="text-fg">Your account, your rules.</strong> Opaque
            Studio publishes only what you approve, to the TikTok account you
            connect, with the privacy level you choose on each post. Disconnect
            at any time — revoking access takes one click here or in your TikTok
            settings.
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-stroke/60 bg-surface/40">
          <div className="mx-auto max-w-6xl px-5 py-16 text-center">
            <h2 className="text-3xl font-bold">
              Your next hundred creatives are{" "}
              <span className="mercury-text">one batch away</span>
            </h2>
            <p className="mx-auto mt-3 max-w-md text-muted">
              Free during beta. No credit card. Bring a product photo and see
              your first before/after in minutes.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-block rounded-full bg-accent px-8 py-3 font-semibold text-ink transition hover:bg-deep hover:text-fg"
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
