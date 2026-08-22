// The landing: white, clean, visual. A centered headline with real Opaque
// creatives floating around it, then the product as a five-step chain.
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import HeroCollage from "@/components/HeroCollage";
import Journey from "@/components/Journey";

const FEATURES = [
  {
    title: "Before/after videos that stop the scroll",
    body: "Upload a photo, get a transformation reveal — the highest-retention ad format on TikTok. Hooks, pacing and text vary per render so no two are alike.",
    image: "/journey/after-polaroid.jpg",
  },
  {
    title: "Templates you design once",
    body: "Beat timelines, reveals, endings, overlays. Design it once, then mass-produce variations — what you preview is exactly what renders.",
    image: "/journey/after-film.jpg",
  },
  {
    title: "Publishing with every control TikTok requires",
    body: "Privacy level, comments, duets, commercial disclosure — chosen per post, by you, before anything goes out.",
    image: "/journey/post.jpg",
  },
];

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute left-1/2 top-0 h-[40rem] w-[70rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(163,194,240,0.35),transparent)]" />
          <HeroCollage />
          <div className="relative mx-auto flex min-h-[88svh] max-w-2xl flex-col items-center justify-center px-5 py-24 text-center">
            <p className="glass mb-6 rounded-full px-4 py-1.5 text-xs font-semibold tracking-widest text-accent">
              BETA — FREE WHILE WE BUILD
            </p>
            <h1 className="text-5xl font-bold leading-[1.02] tracking-tight md:text-6xl lg:text-7xl">
              Your TikTok ad machine,
              <br />
              <span className="serif-accent mercury-text text-6xl md:text-7xl lg:text-8xl">on autopilot</span>
            </h1>
            <p className="mt-7 max-w-lg text-lg leading-relaxed text-muted">
              Connect your account, pick a creator, generate the video, set a
              schedule — and it posts. Built to grow our own app, open to every
              marketer.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link href="/signup" className="glass-bright rounded-full px-7 py-3.5 font-semibold transition">
                Start free ✦
              </Link>
              <Link
                href="/#how"
                className="rounded-full border border-stroke bg-surface px-7 py-3.5 font-semibold text-fg shadow-sm transition hover:border-accent"
              >
                See how it works
              </Link>
            </div>
            <p className="mt-5 text-xs text-muted">No credit card. Your account, your rules.</p>
          </div>
        </section>

        {/* How it works — the chain */}
        <section id="how" className="mx-auto max-w-6xl px-5 py-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
              Five steps, <span className="serif-accent mercury-text text-4xl md:text-6xl">on repeat</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted">
              The whole loop lives in one place. Nothing goes out without your say-so.
            </p>
          </div>
          <Journey />
        </section>

        {/* Features — visual */}
        <section id="features" className="border-t border-stroke bg-surface">
          <div className="mx-auto max-w-6xl px-5 py-24">
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
              Made from <span className="serif-accent mercury-text text-4xl md:text-6xl">real creatives</span>
            </h2>
            <p className="mt-4 max-w-xl text-muted">
              Every image on this page came out of the pipeline. That&apos;s the product.
            </p>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="scan-card group rounded-3xl border border-stroke bg-ink p-3 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(84,125,204,0.18)]"
                >
                  <div className="aspect-[4/5] overflow-hidden rounded-2xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={f.image}
                      alt=""
                      className="h-full w-full object-cover object-top transition duration-700 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="mt-4 px-2 text-lg font-semibold leading-snug">{f.title}</h3>
                  <p className="mt-2 px-2 pb-2 text-sm leading-relaxed text-muted">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust + CTA */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[30rem] w-[60rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(163,194,240,0.3),transparent)]" />
          <div className="relative mx-auto max-w-3xl px-5 py-24 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
              Your next hundred creatives are{" "}
              <span className="serif-accent mercury-text text-4xl md:text-6xl">one batch away</span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-muted">
              Free during beta. Opaque Studio publishes only what you approve,
              to the TikTok account you connect, with the privacy level you
              choose. Disconnect any time.
            </p>
            <Link href="/signup" className="glass-bright mt-9 inline-block rounded-full px-9 py-3.5 font-semibold transition">
              Create your account
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
