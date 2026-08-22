"use client";
// The hero's collage: real Opaque creatives as vertical cards floating around
// the headline — three before→after wipes, the phone, a "posted" receipt.
// Near cards are sharp; far ones are blurred and faint for depth. The whole
// field leans with the pointer (parallax), each card at its own depth.
import { useEffect, useRef } from "react";

function WipeCard({
  after,
  label,
  className,
  depth,
}: {
  after: string;
  label: string;
  className: string;
  depth: number;
}) {
  return (
    <div
      data-depth={depth}
      className={`floaty absolute aspect-[9/16] overflow-hidden rounded-2xl bg-surface shadow-[0_20px_50px_rgba(11,13,18,0.18)] ring-1 ring-black/5 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/journey/creator.jpg" alt="" className="absolute inset-0 h-full w-full object-cover object-top" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after} alt="" className="wipe-after absolute inset-0 h-full w-full object-cover object-top" />
      <div className="wipe-line absolute inset-y-0 w-0.5 bg-white shadow-[0_0_10px_2px_rgba(255,255,255,0.9)]" />
      <span className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
        {label}
      </span>
    </div>
  );
}

export default function HeroCollage() {
  const field = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = field.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let tx = 0, ty = 0, cx = 0, cy = 0;
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
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div ref={field} aria-hidden className="pointer-events-none absolute inset-0 hidden md:block">
      {/* far layer — blurred */}
      <WipeCard after="/journey/after-film.jpg" label="Film 35mm" depth={0.6}
        className="left-[3%] top-[6%] w-32 rotate-[-9deg] opacity-60 blur-[1.5px]" />
      <WipeCard after="/journey/after-polaroid.jpg" label="Polaroid" depth={0.5}
        className="right-[4%] top-[58%] w-28 rotate-[8deg] opacity-50 blur-[2px] [animation-delay:-2s]" />
      {/* near layer — sharp */}
      <WipeCard after="/journey/after-pixar.jpg" label="Pixar 3D" depth={1.4}
        className="left-[9%] top-[38%] w-44 rotate-[-5deg] [animation-delay:-1s]" />
      <div
        data-depth={1.2}
        className="floaty absolute right-[8%] top-[10%] aspect-[9/16] w-44 overflow-hidden rounded-2xl shadow-[0_20px_50px_rgba(11,13,18,0.18)] ring-1 ring-black/5 rotate-[6deg] [animation-delay:-3s]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/journey/post.jpg" alt="" className="h-full w-full object-cover object-[50%_42%]" />
      </div>
      {/* the receipt */}
      <div
        data-depth={0.9}
        className="floaty glass absolute bottom-[14%] right-[14%] flex items-center gap-3 rounded-2xl px-4 py-3 [animation-delay:-4s]"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">✓</span>
        <div>
          <p className="text-sm font-semibold leading-tight">Posted to @yourbrand</p>
          <p className="text-xs text-muted">Today · 6:00 PM · Public</p>
        </div>
      </div>
    </div>
  );
}
