"use client";
// The landing: the product as a journey — a glowing 3D path with one card per
// step (connect → creator → generate → schedule → post), glass UI over it.
import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { STEPS } from "@/components/JourneyScene";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const JourneyScene = dynamic(() => import("@/components/JourneyScene"), { ssr: false });

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


export default function Home() {
  const [active, setActive] = useState(0);
  const [touched, setTouched] = useState(false);
  // Auto-advance through the steps until the visitor takes the wheel.
  useEffect(() => {
    if (touched) return;
    const id = setInterval(() => setActive((a) => (a + 1) % STEPS.length), 4200);
    return () => clearInterval(id);
  }, [touched]);
  const pick = (i: number) => {
    setTouched(true);
    setActive(i);
  };
  return (
    <>
      <Nav />
      <main>
        {/* Hero — the journey: the product, step by step, on a glowing path */}
        <section className="relative -mt-14 flex min-h-[100svh] items-end overflow-hidden md:items-center">
          <JourneyScene active={active} onSelect={pick} />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-ink/90 via-ink/40 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-ink" />
          <div className="pointer-events-none relative z-10 mx-auto w-full max-w-6xl px-5 pb-16 pt-14 md:pb-0">
            <div className="pointer-events-auto max-w-md">
              <p className="glass mb-5 inline-block rounded-full px-4 py-1.5 text-xs font-semibold tracking-widest text-accent">
                BETA — FREE WHILE WE BUILD
              </p>
              <h1 className="text-4xl font-bold leading-[1.05] md:text-6xl">
                <span className="mercury-text">Your TikTok</span>
                <br />
                ad machine.
              </h1>
              <p className="mt-5 max-w-sm text-base leading-relaxed text-muted md:text-lg">
                Connect your account, pick a creator, generate the video, set a
                schedule — and it posts. Five steps, on repeat.
              </p>
              {/* Step control */}
              <div className="mt-7 flex items-center gap-3">
                <button
                  onClick={() => pick((active + 1) % STEPS.length)}
                  className="glass-bright rounded-full px-6 py-3 font-semibold text-fg transition"
                >
                  {active === STEPS.length - 1 ? "Start over" : `Next: ${STEPS[active + 1].title}`}
                </button>
                <div className="flex gap-1.5">
                  {STEPS.map((s, i) => (
                    <button
                      key={s.title}
                      aria-label={s.title}
                      onClick={() => pick(i)}
                      className={`h-2 rounded-full transition-all ${
                        i === active ? "w-6 bg-accent" : "w-2 bg-stroke hover:bg-muted"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-6 flex gap-4 text-sm">
                <Link href="/signup" className="text-accent hover:underline">
                  Start free →
                </Link>
                <Link href="/#features" className="text-muted hover:text-fg">
                  Explore the studio
                </Link>
              </div>
            </div>
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
          <div className="mt-10 grid gap-8 sm:grid-cols-2 md:grid-cols-5">
            {STEPS.map((s, i) => (
              <div key={s.title}>
                <div className="mercury-text text-4xl font-bold">{i + 1}</div>
                <h3 className="mt-2 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.caption}</p>
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
