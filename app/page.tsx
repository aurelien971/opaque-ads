// The landing: white, clean, visual. One promise — upload your videos, set a
// calendar, they post to TikTok on schedule, you see how they did.
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import HeroCollage from "@/components/HeroCollage";
import Journey from "@/components/Journey";

const FEATURES = [
  {
    title: "Upload in bulk, once",
    body: "Drop a whole month of videos in one go. Add captions now or later — the queue keeps everything in order.",
    image: "/img/creator-unboxing.jpg",
  },
  {
    title: "A calendar that fills itself",
    body: "Pick your posting days and the hour. Every upload gets a slot automatically, spaced the way TikTok likes.",
    image: "/img/phones-flatlay.jpg",
  },
  {
    title: "Feedback on every post",
    body: "Views, likes, comments and shares come back into your dashboard, so next month's batch is smarter than this one.",
    image: "/img/creator-talking.jpg",
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
              Schedule your TikToks.
              <br />
              <span className="serif-accent mercury-text text-6xl md:text-7xl lg:text-8xl">They post themselves.</span>
            </h1>
            <p className="mt-7 max-w-lg text-lg leading-relaxed text-muted">
              Upload your videos in bulk, set a posting calendar, and OAISIS Labs publishes them to your TikTok account on time — then shows
              you how each one did.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link href="/signup" className="glass-bright rounded-full px-7 py-3.5 font-semibold transition">
                Start free ✦
              </Link>
              <Link href="/#how" className="rounded-full border border-stroke bg-surface px-7 py-3.5 font-semibold text-fg shadow-sm transition hover:border-accent">
                See how it works
              </Link>
            </div>
            <p className="mt-5 text-xs text-muted">No credit card. Your account, your rules.</p>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-6xl px-5 py-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
              Four steps, <span className="serif-accent mercury-text text-4xl md:text-6xl">then it runs</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted">
              Nothing goes out without your say-so. You choose the account, the videos, the days, and the privacy level.
            </p>
          </div>
          <Journey />
        </section>

        {/* Features */}
        <section id="features" className="border-t border-stroke bg-surface">
          <div className="mx-auto max-w-6xl px-5 py-24">
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
              Built for people who <span className="serif-accent mercury-text text-4xl md:text-6xl">post every day</span>
            </h2>
            <p className="mt-4 max-w-xl text-muted">
              Creators, app makers, small brands — anyone with more videos than hours.
            </p>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="scan-card group rounded-3xl border border-stroke bg-ink p-3 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(84,125,204,0.18)]">
                  <div className="aspect-[4/5] overflow-hidden rounded-2xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.image} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                  </div>
                  <h3 className="mt-4 px-2 text-lg font-semibold leading-snug">{f.title}</h3>
                  <p className="mt-2 px-2 pb-2 text-sm leading-relaxed text-muted">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[30rem] w-[60rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(163,194,240,0.3),transparent)]" />
          <div className="relative mx-auto max-w-3xl px-5 py-24 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
              Your next month of posts,{" "}
              <span className="serif-accent mercury-text text-4xl md:text-6xl">done this afternoon</span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-muted">
              Free during beta. Disconnect any time — one click here or in your TikTok settings.
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
