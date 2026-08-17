"use client";
// The living hero: a Three.js field of chrome mercury droplets orbiting a
// spinning chrome "O", lit in the brand blues. Mouse orbit parallax, particles
// drawn to the pointer, and a wireframe scan-line intro that materializes the
// scene bottom-to-top. Renders behind the hero copy; pointer-events stay off.
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

    // Lights: dim ambient plus the two brand hues.
    scene.add(new THREE.AmbientLight(0x223, 2));
    const keyLight = new THREE.PointLight(0xa3c2f0, 60, 40);
    keyLight.position.set(4, 5, 4);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0x547dcc, 50, 40);
    rimLight.position.set(-5, -3, 2);
    scene.add(rimLight);

    // Chrome material used everywhere (wireframe twin for the intro scan).
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

    // Mercury droplets drifting around it.
    type Drop = {
      mesh: THREE.Mesh;
      base: THREE.Vector3;
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
        speed: 0.2 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        amp: 0.15 + Math.random() * 0.35,
      });
      scene.add(mesh);
    }

    // Pointer particles: a drifting dust field, gently pulled toward the cursor.
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

    // The intro scan line: a thin glowing plane sweeping bottom → top;
    // everything below it materializes from wireframe to chrome.
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

    const pointer = new THREE.Vector2(0, 0);
    const pointerWorld = new THREE.Vector3(0, 0, 0);
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

    const clock = new THREE.Clock();
    const SCAN_SECONDS = 2.2;
    let materialized = 0; // how many meshes have flipped to chrome
    const meshes: THREE.Mesh[] = [torus, ...drops.map((d) => d.mesh)];
    let raf = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();

      // Intro scan (skipped for reduced motion).
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

      torus.rotation.y = t * 0.25;
      torus.rotation.x = 0.45 + Math.sin(t * 0.3) * 0.08;

      for (const d of drops) {
        d.mesh.position.y = d.base.y + Math.sin(t * d.speed + d.phase) * d.amp;
        d.mesh.position.x = d.base.x + Math.cos(t * d.speed * 0.7 + d.phase) * d.amp * 0.5;
      }

      // Dust drift + pointer pull.
      pointerWorld.set(pointer.x * 5, pointer.y * 3, 1);
      const pos = dustGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < COUNT; i++) {
        const ix = i * 3;
        const dx = pointerWorld.x - positions[ix];
        const dy = pointerWorld.y - positions[ix + 1];
        const dsq = dx * dx + dy * dy + 0.5;
        velocities[ix] += (dx / dsq) * 0.0016 + (Math.random() - 0.5) * 0.0004;
        velocities[ix + 1] += (dy / dsq) * 0.0016 + (Math.random() - 0.5) * 0.0004;
        velocities[ix] *= 0.985;
        velocities[ix + 1] *= 0.985;
        positions[ix] += velocities[ix];
        positions[ix + 1] += velocities[ix + 1];
      }
      pos.needsUpdate = true;

      // Orbit parallax: the camera leans toward the pointer and keeps looking
      // at the O.
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
      className="pointer-events-none absolute inset-0 [&>canvas]:h-full [&>canvas]:w-full"
    />
  );
}
