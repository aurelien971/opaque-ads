import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata = { title: "Pricing — Opaque Studio" };

const TIERS = [
  {
    name: "Free",
    price: "$0",
    tagline: "Try the pipeline end to end.",
    features: [
      "10 AI generations / month",
      "1 connected TikTok account",
      "3 published posts / month",
      "Core templates",
      "Watermarked renders",
    ],
    cta: "Start free",
  },
  {
    name: "Creator",
    price: "$19/mo",
    tagline: "For solo marketers shipping daily.",
    features: [
      "300 AI generations / month",
      "1 connected TikTok account",
      "Unlimited publishing & scheduling",
      "All templates + template studio",
      "Music library & BPM matching",
      "No watermark",
    ],
    cta: "Choose Creator",
    highlight: true,
  },
  {
    name: "Studio",
    price: "$49/mo",
    tagline: "For teams and agencies.",
    features: [
      "1,500 AI generations / month",
      "Up to 5 connected TikTok accounts",
      "Unlimited publishing & scheduling",
      "Variant analytics & CSV export",
      "Priority rendering",
      "Priority support",
    ],
    cta: "Choose Studio",
  },
];

export default function Pricing() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-5 py-16">
        <h1 className="text-4xl font-bold">
          Simple <span className="mercury-text">pricing</span>
        </h1>
        <p className="mt-3 max-w-xl text-muted">
          Opaque Studio is in beta: every plan is free right now, and paid
          billing starts only when we exit beta — with notice, never
          retroactively. Lock in your account today.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={`rounded-2xl border p-7 ${
                t.highlight
                  ? "border-accent bg-surface shadow-lg shadow-deep/20"
                  : "border-stroke bg-surface/50"
              }`}
            >
              {t.highlight && (
                <p className="mb-3 text-xs font-bold tracking-widest text-accent">
                  MOST POPULAR
                </p>
              )}
              <h2 className="text-xl font-bold">{t.name}</h2>
              <p className="mt-1 text-3xl font-bold">
                {t.price}
                <span className="ml-2 align-middle text-xs font-semibold text-accent">
                  free in beta
                </span>
              </p>
              <p className="mt-2 text-sm text-muted">{t.tagline}</p>
              <ul className="mt-6 space-y-2 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-accent">✓</span>
                    <span className="text-muted">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`mt-8 block rounded-full py-2.5 text-center font-semibold transition ${
                  t.highlight
                    ? "bg-fg text-white hover:bg-deep hover:text-white"
                    : "border border-stroke text-fg hover:border-accent"
                }`}
              >
                {t.cta}
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-10 text-sm text-muted">
          Questions about plans, limits, or agency use?{" "}
          <a className="text-accent" href="mailto:nicolle.aurelien@gmail.com">
            Talk to us.
          </a>
        </p>
      </main>
      <Footer />
    </>
  );
}
