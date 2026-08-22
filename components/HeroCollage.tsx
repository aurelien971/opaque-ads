"use client";
// The hero collage: creators and generic app UIs floating around the
// headline — real photos plus CSS-drawn app mockups (no brand imagery).
// Near cards sharp, far cards blurred; the field leans with the pointer.
import { useEffect, useRef } from "react";

function Frame({ className, depth, children }: { className: string; depth: number; children: React.ReactNode }) {
  return (
    <div
      data-depth={depth}
      className={`floaty absolute overflow-hidden rounded-2xl bg-surface shadow-[0_20px_50px_rgba(11,13,18,0.16)] ring-1 ring-black/5 ${className}`}
    >
      {children}
    </div>
  );
}

// A generic app screen drawn in CSS — a fitness tracker.
function FitnessApp() {
  return (
    <div className="flex h-full w-full flex-col gap-2 bg-[#f3f6ff] p-3 text-[9px] text-fg">
      <div className="flex items-center justify-between text-[8px] text-muted"><span>9:41</span><span>●●●</span></div>
      <p className="text-[11px] font-bold">Today</p>
      <div className="mx-auto my-1 flex h-16 w-16 items-center justify-center rounded-full border-[5px] border-[#547dcc] border-r-stroke text-[13px] font-bold">72%</div>
      <div className="grid grid-cols-3 gap-1.5">
        {["8,241", "42m", "512"].map((v, i) => (
          <div key={i} className="rounded-lg bg-white p-1.5 text-center shadow-sm"><p className="font-bold">{v}</p><p className="text-[7px] text-muted">{["steps", "active", "kcal"][i]}</p></div>
        ))}
      </div>
      <div className="mt-auto h-8 rounded-lg bg-white shadow-sm" />
    </div>
  );
}

// A generic app screen — a shopping / product app.
function ShopApp() {
  return (
    <div className="flex h-full w-full flex-col gap-2 bg-[#fff8f1] p-3 text-[9px] text-fg">
      <div className="flex items-center justify-between text-[8px] text-muted"><span>9:41</span><span>●●●</span></div>
      <div className="h-5 rounded-full bg-white shadow-sm" />
      <div className="grid grid-cols-2 gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg bg-white p-1 shadow-sm">
            <div className={`h-10 rounded-md ${["bg-[#ffd9c2]", "bg-[#cfe5ff]", "bg-[#dff5d8]", "bg-[#ece0ff]"][i]}`} />
            <div className="mt-1 h-1.5 w-3/4 rounded bg-stroke" />
            <div className="mt-1 h-1.5 w-1/3 rounded bg-stroke" />
          </div>
        ))}
      </div>
      <div className="mt-auto h-7 rounded-full bg-fg" />
    </div>
  );
}

export default function HeroCollage() {
  const field = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = field.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0, tx = 0, ty = 0, cx = 0, cy = 0;
    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const cards = Array.from(el.querySelectorAll<HTMLElement>("[data-depth]"));
    const tick = () => {
      raf = requestAnimationFrame(tick);
      cx += (tx - cx) * 0.05;
      cy += (ty - cy) * 0.05;
      for (const c of cards) {
        const d = Number(c.dataset.depth);
        c.style.transform = `translate(${-cx * d * 18}px, ${-cy * d * 12}px)`;
      }
    };
    window.addEventListener("pointermove", onMove);
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("pointermove", onMove); };
  }, []);

  return (
    <div ref={field} aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
      {/* far, blurred */}
      <Frame depth={0.5} className="left-[2%] top-[6%] aspect-[9/16] w-28 rotate-[-9deg] opacity-60 blur-[1.5px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/creator-talking.jpg" alt="" className="h-full w-full object-cover" />
      </Frame>
      <Frame depth={0.5} className="right-[3%] top-[60%] aspect-[9/16] w-28 rotate-[8deg] opacity-55 blur-[2px] [animation-delay:-2s]">
        <ShopApp />
      </Frame>
      {/* near, sharp */}
      <Frame depth={1.4} className="left-[4%] top-[40%] aspect-[9/16] w-40 rotate-[-5deg] [animation-delay:-1s]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/creator-review.jpg" alt="" className="h-full w-full object-cover" />
        <span className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">Thu · 6:00 PM</span>
      </Frame>
      <Frame depth={1.2} className="right-[3%] top-[9%] aspect-[9/16] w-40 rotate-[6deg] [animation-delay:-3s]">
        <FitnessApp />
        <span className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">Fri · 12:30 PM</span>
      </Frame>
      <Frame depth={0.9} className="left-[14%] top-[8%] aspect-[9/16] w-24 rotate-[4deg] opacity-80 [animation-delay:-5s]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/creator-unboxing.jpg" alt="" className="h-full w-full object-cover" />
      </Frame>
      {/* the receipt */}
      <div data-depth={0.9} className="floaty glass absolute bottom-[9%] right-[15%] flex items-center gap-3 rounded-2xl px-4 py-3 [animation-delay:-4s]">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">✓</span>
        <div>
          <p className="text-sm font-semibold leading-tight">Posted · 12.4K views</p>
          <p className="text-xs text-muted">Thu 6:00 PM · Public</p>
        </div>
      </div>
    </div>
  );
}
