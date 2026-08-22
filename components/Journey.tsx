// The product in four steps, as a connected chain.

export const STEPS = [
  { title: "Connect your TikTok", caption: "One tap. You approve the permissions on TikTok's own screen.", visual: "connect" },
  { title: "Upload your videos", caption: "Drop in a week, a month, a hundred. Captions optional.", visual: "upload" },
  { title: "Set the calendar", caption: "Pick the days and the hour. The queue lays itself out.", visual: "schedule" },
  { title: "They post. You learn.", caption: "Each video goes out on time — and comes back with its numbers.", visual: "results" },
] as const;

type Visual = (typeof STEPS)[number]["visual"];

function Visual({ kind }: { kind: Visual }) {
  const frame = "relative h-36 w-full overflow-hidden rounded-xl bg-ink";
  switch (kind) {
    case "connect":
      return (
        <div className={`${frame} flex items-center justify-center gap-4`}>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md">
            <svg width="30" height="30" viewBox="0 0 64 64"><circle cx="32" cy="32" r="15" fill="none" stroke="#0b0d12" strokeWidth="4" /><circle cx="49.7" cy="14.3" r="5" fill="#547dcc" /></svg>
          </div>
          <span className="text-2xl text-accent">⟷</span>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-[11px] font-black text-white shadow-md">TikTok</div>
        </div>
      );
    case "upload":
      return (
        <div className={`${frame} flex items-end justify-center gap-1.5 p-3`}>
          {["/img/creator-review.jpg", "/img/creator-unboxing.jpg", "/img/creator-talking.jpg"].map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} alt="" className={`aspect-[9/16] w-14 rounded-lg object-cover shadow ${i === 1 ? "-translate-y-2" : ""}`} />
          ))}
          <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-fg shadow">+24 more</span>
        </div>
      );
    case "schedule":
      return (
        <div className={`${frame} grid grid-cols-7 gap-1.5 p-3`}>
          {Array.from({ length: 21 }, (_, i) => (
            <div key={i} className={`rounded-md ${[1, 3, 5, 8, 10, 12, 15, 17, 19].includes(i) ? "bg-accent shadow-[0_0_12px_rgba(84,125,204,0.45)]" : "bg-stroke"}`} />
          ))}
          <span className="absolute bottom-2 right-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-fg shadow">Mon · Wed · Fri · 6 pm</span>
        </div>
      );
    case "results":
      return (
        <div className={`${frame} flex flex-col justify-center gap-2 p-4`}>
          {[["Unboxing v2", "18.2K", 92], ["Morning routine", "9.7K", 58], ["Review · short", "4.1K", 30]].map(([n, v, w]) => (
            <div key={n as string}>
              <div className="flex justify-between text-[10px]"><span className="font-semibold">{n}</span><span className="text-muted">{v} views</span></div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-stroke"><div className="mercury-bg h-full" style={{ width: `${w}%` }} /></div>
            </div>
          ))}
        </div>
      );
  }
}

export default function Journey() {
  return (
    <div className="relative mt-14">
      <div className="pointer-events-none absolute left-[12%] right-[12%] top-5 hidden h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent md:block" />
      <ol className="grid gap-6 md:grid-cols-4">
        {STEPS.map((s, i) => (
          <li key={s.title} className="group relative">
            <div className="relative z-10 mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-fg text-sm font-bold text-white shadow-[0_0_0_6px_var(--color-ink),0_0_24px_rgba(84,125,204,0.45)] transition group-hover:bg-deep">
              {i + 1}
            </div>
            <div className="mt-4 rounded-2xl border border-stroke bg-surface p-3 shadow-[0_8px_30px_rgba(11,13,18,0.05)] transition duration-300 group-hover:-translate-y-1.5 group-hover:border-accent/50 group-hover:shadow-[0_20px_50px_rgba(84,125,204,0.22)]">
              <Visual kind={s.visual} />
              <p className="mt-3 px-1 text-sm font-semibold">{s.title}</p>
              <p className="mt-1 px-1 pb-1 text-xs leading-snug text-muted">{s.caption}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
