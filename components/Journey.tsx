// The five steps as a connected chain — light, visual, each card with real
// Opaque imagery or a tiny UI vignette. Hover lifts and glows.

export type Step = {
  title: string;
  caption: string;
  visual: "connect" | "creator" | "generate" | "schedule" | "post";
};

export const STEPS: Step[] = [
  { title: "Connect your TikTok", caption: "One tap. You approve the permissions on TikTok's own screen.", visual: "connect" },
  { title: "Pick your creator", caption: "Choose the face of your brand — a model photo, or an AI creator.", visual: "creator" },
  { title: "Generate the video", caption: "Before → after reveals, hooks, music. A fresh variant every time.", visual: "generate" },
  { title: "Set the schedule", caption: "Pick the days and the hour. The queue fills itself.", visual: "schedule" },
  { title: "It posts", caption: "Straight to your account, with the privacy level you chose.", visual: "post" },
];

export function CardVisual({ kind }: { kind: Step["visual"] }) {
  const frame = "relative h-36 w-full overflow-hidden rounded-xl bg-ink";
  switch (kind) {
    case "connect":
      return (
        <div className={`${frame} flex items-center justify-center gap-4`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/app-icon.png" alt="" className="h-14 w-14 rounded-2xl shadow-md" />
          <span className="text-2xl text-accent">⟷</span>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-[11px] font-black text-white shadow-md">
            TikTok
          </div>
        </div>
      );
    case "creator":
      return (
        <div className={frame}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/journey/creator.jpg" alt="" className="h-full w-full object-cover object-top" />
          <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-fg shadow">
            ✓ selected
          </span>
        </div>
      );
    case "generate":
      return (
        <div className={`${frame} grid grid-cols-2 gap-0.5`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/journey/creator.jpg" alt="" className="h-full w-full object-cover object-top" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/journey/after-pixar.jpg" alt="" className="h-full w-full object-cover object-top" />
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-fg shadow">
            before → after
          </span>
        </div>
      );
    case "schedule":
      return (
        <div className={`${frame} grid grid-cols-7 gap-1.5 p-3`}>
          {Array.from({ length: 21 }, (_, i) => (
            <div
              key={i}
              className={`rounded-md ${[2, 4, 8, 11, 13, 16, 18].includes(i) ? "bg-accent shadow-[0_0_12px_rgba(84,125,204,0.5)]" : "bg-stroke"}`}
            />
          ))}
          <span className="absolute bottom-2 right-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-fg shadow">
            7 / week · 6 pm
          </span>
        </div>
      );
    case "post":
      return (
        <div className={frame}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/journey/post.jpg" alt="" className="h-full w-full object-cover object-[50%_40%]" />
          <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-green-600 shadow">
            ● posted
          </span>
        </div>
      );
  }
}

export default function Journey() {
  return (
    <div className="relative mt-14">
      {/* the chain */}
      <div className="pointer-events-none absolute left-[10%] right-[10%] top-5 hidden h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent md:block" />
      <ol className="grid gap-6 md:grid-cols-5 md:gap-4">
        {STEPS.map((s, i) => (
          <li key={s.title} className="group relative">
            <div className="relative z-10 mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-fg text-sm font-bold text-white shadow-[0_0_0_6px_var(--color-ink),0_0_24px_rgba(84,125,204,0.45)] transition group-hover:bg-deep">
              {i + 1}
            </div>
            <div className="mt-4 rounded-2xl border border-stroke bg-surface p-3 shadow-[0_8px_30px_rgba(11,13,18,0.05)] transition duration-300 group-hover:-translate-y-1.5 group-hover:border-accent/50 group-hover:shadow-[0_20px_50px_rgba(84,125,204,0.22)]">
              <CardVisual kind={s.visual} />
              <p className="mt-3 px-1 text-sm font-semibold">{s.title}</p>
              <p className="mt-1 px-1 pb-1 text-xs leading-snug text-muted">{s.caption}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
