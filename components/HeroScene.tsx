"use client";
// The living hero: a Three.js field of chrome mercury droplets orbiting a
// spinning chrome "O", lit in the brand blues. Fully interactive:
//   · mouse orbit parallax
//   · drag horizontally to spin the O (with inertia)
//   · sweep the cursor through droplets — they scatter and spring home
//   · click a droplet to flick it
//   · scrolling adds rotation
// Plus the wireframe scan-line intro that materializes the scene bottom-up.
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export default function HeroScene() {
  const mount = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = mount.current;
    if (!host) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0c11);
    scene.fog = new THREE.FogExp2(0x0a0c11, 0.055);
    scene.environment = new THREE.PMREMGenerator(renderer).fromScene(
      new RoomEnvironment(),
      0.04,
    ).texture;

    const camera = new THREE.PerspectiveCamera(
      50,
      host.clientWidth / host.clientHeight,
      0.1,
      60,
    );
    camera.position.set(0, 0.4, 7);

    scene.add(new THREE.AmbientLight(0x223, 2));
    const keyLight = new THREE.PointLight(0xa3c2f0, 60, 40);
    keyLight.position.set(4, 5, 4);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0x547dcc, 50, 40);
    rimLight.position.set(-5, -3, 2);
    scene.add(rimLight);

    const chrome = new THREE.MeshStandardMaterial({
      color: 0xdfe6f2,
      metalness: 1,
      roughness: 0.08,
    });
    const wire = new THREE.MeshBasicMaterial({
      color: 0xa3c2f0,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });

    // The composition sits right of center so the hero copy owns the left.
    const X_OFF = window.innerWidth > 768 ? 1.6 : 0;

    // The "O": a chrome torus, slightly tilted, spinning slowly.
    const torus = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.34, 64, 128), wire);
    torus.rotation.x = 0.45;
    torus.position.x = X_OFF;
    scene.add(torus);

    // Mercury droplets: bobbing homes + spring physics so they scatter on
    // touch and glide back.
    type Drop = {
      mesh: THREE.Mesh;
      base: THREE.Vector3;
      vel: THREE.Vector3;
      speed: number;
      phase: number;
      amp: number;
    };
    const drops: Drop[] = [];
    const sphereGeo = new THREE.SphereGeometry(1, 48, 48);
    for (let i = 0; i < 22; i++) {
      const r = 0.09 + Math.pow(Math.random(), 2) * 0.42;
      const mesh = new THREE.Mesh(sphereGeo, wire);
      mesh.scale.setScalar(r);
      const angle = Math.random() * Math.PI * 2;
      const dist = 2.2 + Math.random() * 3.4;
      mesh.position.set(
        X_OFF + Math.cos(angle) * dist,
        (Math.random() - 0.5) * 3.4,
        (Math.random() - 0.5) * 3 - 0.5,
      );
      // Foreground drops that would sit over the hero copy get pushed back.
      if (mesh.position.x < 0.2 && mesh.position.z > 0) mesh.position.z -= 2.2;
      drops.push({
        mesh,
        base: mesh.position.clone(),
        vel: new THREE.Vector3(),
        speed: 0.2 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        amp: 0.15 + Math.random() * 0.35,
      });
      scene.add(mesh);
    }

    // Pointer dust: gentler pull than before so it trails, never clumps.
    const COUNT = 500;
    const positions = new Float32Array(COUNT * 3);
    const velocities = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const dust = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({
        color: 0xa3c2f0,
        size: 0.035,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    scene.add(dust);

    // Intro scan line.
    const scan = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 0.035),
      new THREE.MeshBasicMaterial({
        color: 0xa3c2f0,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    scan.position.z = 0.5;
    scene.add(scan);

    // ---- Interaction state ----
    const pointer = new THREE.Vector2(0, 0);
    const raycaster = new THREE.Raycaster();
    const closest = new THREE.Vector3();
    let spinAcc = 0; // accumulated drag spin on the O
    let spinVel = 0;
    let dragging = false;
    let lastX = 0;

    const onMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
      if (dragging) {
        spinVel += (e.clientX - lastX) * 0.00022;
        lastX = e.clientX;
      }
    };
    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      host.style.cursor = "grabbing";
      // Click a droplet → flick it along the view ray.
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(drops.map((d) => d.mesh))[0];
      if (hit) {
        const drop = drops.find((d) => d.mesh === hit.object);
        drop?.vel.addScaledVector(raycaster.ray.direction, 0.5);
      }
    };
    const onUp = () => {
      dragging = false;
      host.style.cursor = "grab";
    };
    window.addEventListener("pointermove", onMove);
    host.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);

    const onResize = () => {
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    };
    window.addEventListener("resize", onResize);

    const clock = new THREE.Clock();
    const SCAN_SECONDS = 2.2;
    let materialized = 0;
    const meshes: THREE.Mesh[] = [torus, ...drops.map((d) => d.mesh)];
    let raf = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();

      const scanY = reduced ? 10 : -4 + (t / SCAN_SECONDS) * 9;
      if (materialized < meshes.length) {
        for (const m of meshes) {
          if (m.material === wire && m.position.y < scanY) {
            m.material = chrome;
            materialized++;
          }
        }
        scan.position.y = scanY;
        (scan.material as THREE.MeshBasicMaterial).opacity =
          scanY > 5 ? Math.max(0, 0.9 - (scanY - 5)) : 0.9;
      } else {
        scan.visible = false;
      }

      // O rotation: idle spin + drag inertia + a touch of scroll.
      spinAcc += spinVel;
      spinVel *= 0.95;
      torus.rotation.y = t * 0.25 + spinAcc + window.scrollY * 0.0035;
      torus.rotation.x = 0.45 + Math.sin(t * 0.3) * 0.08;

      // Droplets: spring toward their bobbing home; the cursor's view ray
      // shoves any drop it grazes.
      raycaster.setFromCamera(pointer, camera);
      for (const d of drops) {
        const home = d.base.clone();
        home.y += Math.sin(t * d.speed + d.phase) * d.amp;
        home.x += Math.cos(t * d.speed * 0.7 + d.phase) * d.amp * 0.5;
        raycaster.ray.closestPointToPoint(d.mesh.position, closest);
        const reach = d.mesh.scale.x + 0.55;
        const dist = closest.distanceTo(d.mesh.position);
        if (dist < reach) {
          const push = d.mesh.position.clone().sub(closest).normalize();
          d.vel.addScaledVector(push, (reach - dist) * 0.045);
        }
        d.vel.addScaledVector(home.sub(d.mesh.position), 0.018);
        d.vel.multiplyScalar(0.92);
        d.mesh.position.add(d.vel);
      }

      // Dust drift + soft pointer pull (clamped so it never clots).
      const px = pointer.x * 5;
      const py = pointer.y * 3;
      const pos = dustGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < COUNT; i++) {
        const ix = i * 3;
        const dx = px - positions[ix];
        const dy = py - positions[ix + 1];
        const dsq = dx * dx + dy * dy + 1.5;
        velocities[ix] += (dx / dsq) * 0.0009 + (Math.random() - 0.5) * 0.0004;
        velocities[ix + 1] += (dy / dsq) * 0.0009 + (Math.random() - 0.5) * 0.0004;
        velocities[ix] = Math.max(-0.02, Math.min(0.02, velocities[ix] * 0.985));
        velocities[ix + 1] = Math.max(-0.02, Math.min(0.02, velocities[ix + 1] * 0.985));
        positions[ix] += velocities[ix];
        positions[ix + 1] += velocities[ix + 1];
      }
      pos.needsUpdate = true;

      if (!reduced) {
        camera.position.x += (pointer.x * 1.6 - camera.position.x) * 0.04;
        camera.position.y += (0.4 + pointer.y * 0.9 - camera.position.y) * 0.04;
      }
      camera.lookAt(X_OFF * 0.2, 0, 0);

      renderer.render(scene, camera);
    };
    tick();

    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else {
        clock.start();
        tick();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      sphereGeo.dispose();
      dustGeo.dispose();
      host.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mount}
      aria-hidden
      // Interactive: drag to spin, click droplets to flick. touch-pan-y keeps
      // vertical scrolling alive on phones; the hero copy sits above (z-10)
      // so links and buttons stay clickable.
      className="absolute inset-0 cursor-grab touch-pan-y [&>canvas]:h-full [&>canvas]:w-full"
    />
  );
}
