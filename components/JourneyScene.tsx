"use client";
// The journey hero: a glowing chrome path winding into the distance, with one
// node per step of the product — Connect TikTok → Pick your creator →
// Generate a video → Set a schedule → Post. Real DOM cards (clickable, with
// real imagery) float above each node, positioned every frame by projecting
// the node into screen space; the camera flies along the path as you step
// through. Pointer parallax and a dust field keep it alive.
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export type Step = {
  title: string;
  caption: string;
  visual: "connect" | "creator" | "generate" | "schedule" | "post";
};

export const STEPS: Step[] = [
  {
    title: "Connect your TikTok",
    caption: "One tap. You approve the permissions on TikTok's own screen.",
    visual: "connect",
  },
  {
    title: "Pick your creator",
    caption: "Choose the face of your brand — a model photo, or an AI creator.",
    visual: "creator",
  },
  {
    title: "Generate the video",
    caption: "Before → after reveals, hooks, music. A fresh variant every time.",
    visual: "generate",
  },
  {
    title: "Set the schedule",
    caption: "Pick the days and the hour. The queue fills itself.",
    visual: "schedule",
  },
  {
    title: "It posts",
    caption: "Straight to your account, with the privacy level you chose.",
    visual: "post",
  },
];

// Where each node sits along the curve (0 → 1).
const NODE_T = [0.1, 0.3, 0.5, 0.7, 0.9];

export default function JourneyScene({
  active,
  onSelect,
}: {
  active: number;
  onSelect: (i: number) => void;
}) {
  const mount = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const activeRef = useRef(active);
  activeRef.current = active;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = mount.current;
    if (!host) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0c11);
    scene.fog = new THREE.FogExp2(0x0a0c11, 0.07);
    scene.environment = new THREE.PMREMGenerator(renderer).fromScene(
      new RoomEnvironment(),
      0.04,
    ).texture;

    const camera = new THREE.PerspectiveCamera(
      48,
      host.clientWidth / host.clientHeight,
      0.1,
      80,
    );

    scene.add(new THREE.AmbientLight(0x223, 2));
    const key = new THREE.PointLight(0xa3c2f0, 70, 50);
    key.position.set(3, 6, 4);
    scene.add(key);
    const rim = new THREE.PointLight(0x547dcc, 50, 50);
    rim.position.set(-6, -2, -2);
    scene.add(rim);

    // ---- The path ----
    const curve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(-7, -3.2, 4),
        new THREE.Vector3(-3.5, -1.8, 2),
        new THREE.Vector3(-0.5, -0.9, 0.2),
        new THREE.Vector3(2.5, 0.1, -1.8),
        new THREE.Vector3(5.5, 1.2, -4),
        new THREE.Vector3(8.5, 2.6, -6.5),
      ],
      false,
      "catmullrom",
      0.6,
    );
    const chrome = new THREE.MeshStandardMaterial({
      color: 0xdfe6f2,
      metalness: 1,
      roughness: 0.12,
    });
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 240, 0.055, 16, false), chrome);
    scene.add(tube);

    // Energy flowing along the path: points riding the curve.
    const FLOW = 320;
    const flowPos = new Float32Array(FLOW * 3);
    const flowT = new Float32Array(FLOW);
    for (let i = 0; i < FLOW; i++) flowT[i] = Math.random();
    const flowGeo = new THREE.BufferGeometry();
    flowGeo.setAttribute("position", new THREE.BufferAttribute(flowPos, 3));
    scene.add(
      new THREE.Points(
        flowGeo,
        new THREE.PointsMaterial({
          color: 0xa3c2f0,
          size: 0.07,
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      ),
    );

    // ---- Nodes: chrome ring + glowing core at each step ----
    const nodes = NODE_T.map((t, i) => {
      const p = curve.getPointAt(t);
      const g = new THREE.Group();
      g.position.copy(p);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.07, 32, 96), chrome);
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 32, 32),
        new THREE.MeshStandardMaterial({
          color: 0xa3c2f0,
          emissive: 0xa3c2f0,
          emissiveIntensity: 0.6,
          roughness: 0.3,
          metalness: 0.2,
        }),
      );
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 24, 24),
        new THREE.MeshBasicMaterial({
          color: 0xa3c2f0,
          transparent: true,
          opacity: 0.08,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      const glow = new THREE.PointLight(0xa3c2f0, 0, 6);
      g.add(ring, core, halo, glow);
      scene.add(g);
      return { g, ring, core, halo, glow, p, i };
    });

    // Ambient mercury droplets far back — brand continuity, never in the way.
    const sphereGeo = new THREE.SphereGeometry(1, 32, 32);
    const drops: { m: THREE.Mesh; b: THREE.Vector3; s: number; ph: number }[] = [];
    for (let i = 0; i < 14; i++) {
      const m = new THREE.Mesh(sphereGeo, chrome);
      m.scale.setScalar(0.1 + Math.random() * 0.3);
      m.position.set((Math.random() - 0.5) * 18, (Math.random() - 0.5) * 8 + 1, -4 - Math.random() * 8);
      drops.push({ m, b: m.position.clone(), s: 0.2 + Math.random() * 0.4, ph: Math.random() * 6 });
      scene.add(m);
    }

    // Dust.
    const COUNT = 600;
    const dp = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      dp[i * 3] = (Math.random() - 0.5) * 24;
      dp[i * 3 + 1] = (Math.random() - 0.5) * 12;
      dp[i * 3 + 2] = (Math.random() - 0.5) * 16 - 2;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dp, 3));
    scene.add(
      new THREE.Points(
        dustGeo,
        new THREE.PointsMaterial({
          color: 0xa3c2f0,
          size: 0.03,
          transparent: true,
          opacity: 0.45,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      ),
    );

    // ---- Camera choreography ----
    const pointer = new THREE.Vector2();
    const onMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("pointermove", onMove);
    const onResize = () => {
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    };
    window.addEventListener("resize", onResize);

    // For a given step: camera sits behind-and-above the node, looking past it
    // along the path so the next node is visible in the distance.
    const camFor = (i: number) => {
      const t = NODE_T[i];
      const p = curve.getPointAt(t);
      const ahead = curve.getPointAt(Math.min(1, t + 0.18));
      const dir = ahead.clone().sub(p).normalize();
      const pos = p.clone().sub(dir.clone().multiplyScalar(4.6));
      pos.y += 1.9;
      pos.x -= 1.2; // keep the node right of the hero copy
      const look = p.clone().add(dir.clone().multiplyScalar(1.2));
      return { pos, look };
    };
    // Intro: wide overview, then glide to step 0.
    const overview = { pos: new THREE.Vector3(-6, 4, 10), look: new THREE.Vector3(1, 0, -1) };
    camera.position.copy(overview.pos);
    const lookCur = overview.look.clone();

    const clock = new THREE.Clock();
    const tmp = new THREE.Vector3();
    let raf = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();
      const a = activeRef.current;

      // Camera glide (overview for the first second, then the active step).
      const target = t < 1.1 && !reduced ? overview : camFor(a);
      const ease = reduced ? 1 : 0.035;
      camera.position.lerp(
        tmp.copy(target.pos).add(new THREE.Vector3(pointer.x * 0.5, pointer.y * 0.3, 0)),
        ease,
      );
      lookCur.lerp(target.look, ease);
      camera.lookAt(lookCur);

      // Flow along the path.
      for (let i = 0; i < FLOW; i++) {
        flowT[i] = (flowT[i] + 0.0009 + (i % 7) * 0.00008) % 1;
        curve.getPointAt(flowT[i], tmp);
        flowPos[i * 3] = tmp.x + (Math.random() - 0.5) * 0.05;
        flowPos[i * 3 + 1] = tmp.y + (Math.random() - 0.5) * 0.05;
        flowPos[i * 3 + 2] = tmp.z + (Math.random() - 0.5) * 0.05;
      }
      (flowGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;

      // Nodes: rings spin, the active one blazes.
      nodes.forEach((n) => {
        n.ring.rotation.y = t * 0.6 + n.i;
        n.ring.rotation.x = Math.sin(t * 0.5 + n.i) * 0.4;
        const on = n.i === a;
        const mat = n.core.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity += ((on ? 2.6 : 0.5) - mat.emissiveIntensity) * 0.08;
        n.glow.intensity += ((on ? 9 : 0) - n.glow.intensity) * 0.08;
        (n.halo.material as THREE.MeshBasicMaterial).opacity = on
          ? 0.1 + Math.sin(t * 3) * 0.04
          : 0.05;
        const s = on ? 1.25 : 1;
        n.g.scale.lerp(new THREE.Vector3(s, s, s), 0.08);
      });

      drops.forEach((d) => {
        d.m.position.y = d.b.y + Math.sin(t * d.s + d.ph) * 0.3;
      });

      // Project each node into screen space and park its card above it.
      const w = host.clientWidth;
      const h = host.clientHeight;
      nodes.forEach((n) => {
        const el = cardRefs.current[n.i];
        if (!el) return;
        tmp.copy(n.p);
        tmp.y += 0.75;
        tmp.project(camera);
        const behind = tmp.z > 1;
        const x = (tmp.x * 0.5 + 0.5) * w;
        const y = (-tmp.y * 0.5 + 0.5) * h;
        const dist = camera.position.distanceTo(n.p);
        const scale = Math.max(0.45, Math.min(1, 5.2 / dist));
        const on = n.i === a;
        el.style.transform = `translate(-50%, -100%) translate(${x}px, ${y}px) scale(${on ? scale : scale * 0.82})`;
        el.style.opacity = behind ? "0" : on ? "1" : String(Math.max(0.25, scale * 0.8));
        el.style.zIndex = String(Math.round(1000 - dist * 10));
        el.style.pointerEvents = behind ? "none" : "auto";
      });

      renderer.render(scene, camera);
    };
    tick();
    setReady(true);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div ref={mount} aria-hidden className="absolute inset-0 [&>canvas]:h-full [&>canvas]:w-full" />
      {/* The step cards — real DOM, projected onto the nodes each frame. */}
      <div className={`absolute inset-0 transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}>
        {STEPS.map((s, i) => (
          <div
            key={s.title}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            onClick={() => onSelect(i)}
            className={`absolute left-0 top-0 w-56 cursor-pointer select-none rounded-2xl p-2.5 transition-[box-shadow,border-color] duration-500 ${
              i === active
                ? "glass-bright shadow-[0_0_60px_rgba(163,194,240,0.35)] sway"
                : "glass hover:border-accent/40 sway"
            }`}
            style={{ animationDelay: `${i * 0.7}s` }}
          >
            <CardVisual kind={s.visual} />
            <div className="px-1.5 pb-1 pt-2.5">
              <p className="text-[10px] font-bold tracking-widest text-accent">STEP {i + 1}</p>
              <p className="mt-0.5 text-sm font-semibold leading-tight">{s.title}</p>
              {i === active && (
                <p className="mt-1 text-xs leading-snug text-muted">{s.caption}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Each step's picture: real Opaque imagery where it makes sense, tiny UI
// vignettes where a screenshot would lie.
function CardVisual({ kind }: { kind: Step["visual"] }) {
  const frame = "relative h-28 w-full overflow-hidden rounded-xl bg-ink";
  switch (kind) {
    case "connect":
      return (
        <div className={`${frame} flex items-center justify-center gap-3`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/app-icon.png" alt="" className="h-12 w-12 rounded-xl" />
          <span className="mercury-text text-xl">⟷</span>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-[11px] font-black text-white ring-1 ring-stroke">
            TikTok
          </div>
        </div>
      );
    case "creator":
      return (
        <div className={frame}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/journey/creator.jpg" alt="" className="h-full w-full object-cover object-top" />
          <span className="absolute bottom-1.5 left-1.5 rounded-full bg-ink/80 px-2 py-0.5 text-[10px] font-semibold text-accent">
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
          <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded-full bg-ink/80 px-2 py-0.5 text-[10px] font-semibold text-accent">
            before → after
          </span>
        </div>
      );
    case "schedule":
      return (
        <div className={`${frame} grid grid-cols-7 gap-1 p-2.5`}>
          {Array.from({ length: 21 }, (_, i) => (
            <div
              key={i}
              className={`rounded-sm ${
                [2, 4, 8, 11, 13, 16, 18].includes(i) ? "bg-accent" : "bg-surface"
              }`}
            />
          ))}
          <span className="absolute bottom-1.5 right-1.5 rounded-full bg-ink/80 px-2 py-0.5 text-[10px] font-semibold text-accent">
            7 / week · 6 pm
          </span>
        </div>
      );
    case "post":
      return (
        <div className={frame}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/journey/post.jpg" alt="" className="h-full w-full object-cover object-[50%_38%]" />
          <span className="absolute bottom-1.5 left-1.5 rounded-full bg-ink/80 px-2 py-0.5 text-[10px] font-semibold text-green-400">
            ● posted
          </span>
        </div>
      );
  }
}
