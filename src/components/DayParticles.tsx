"use client";

import { useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useDayNight } from "@/context/DayNightContext";

/* ─── Particle definition ─── */
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  decay: number;
  color: string;
  glow: boolean;
}

/* Warm golden / soft-white palette matching the day sky */
const DAY_COLORS = [
  "rgba(255, 240, 140,",
  "rgba(255, 220, 80,",
  "rgba(255, 255, 210,",
  "rgba(255, 200, 60,",
  "rgba(255, 248, 180,",
  "rgba(200, 230, 255,",
];

function randomColor() {
  return DAY_COLORS[Math.floor(Math.random() * DAY_COLORS.length)];
}

/* Solar-flare colors matching the new realistic sun */
const FLARE_COLORS = [
  "rgba(255, 200, 60,",
  "rgba(255, 150, 20,",
  "rgba(255, 100, 10,",
  "rgba(255, 240, 120,",
  "rgba(255, 255, 200,",
  "rgba(240, 110, 10,",
  "rgba(255, 180, 40,",
];

function spawnSolarFlare(
  particles: Particle[],
  cx: number,
  cy: number,
  count: number,
) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.8 + Math.random() * 4.5;
    const r = 2.5 + Math.random() * 5.5;
    particles.push({
      x: cx + (Math.random() - 0.5) * 40,
      y: cy + (Math.random() - 0.5) * 40,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: r,
      alpha: 0.85 + Math.random() * 0.15,
      decay: 0.007 + Math.random() * 0.010,
      color: FLARE_COLORS[Math.floor(Math.random() * FLARE_COLORS.length)],
      glow: true,
    });
  }
}

function spawnBurst(
  particles: Particle[],
  cx: number,
  cy: number,
  count: number,
  spread = 60,
) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.6 + Math.random() * spread * 0.035;
    const r = 1.5 + Math.random() * 3;
    particles.push({
      x: cx + (Math.random() - 0.5) * 20,
      y: cy + (Math.random() - 0.5) * 20,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.2 - Math.random() * 1.5, // drift upward
      radius: r,
      alpha: 0.85 + Math.random() * 0.15,
      decay: 0.012 + Math.random() * 0.016,
      color: randomColor(),
      glow: Math.random() > 0.55,
    });
  }
}

function spawnHover(
  particles: Particle[],
  cx: number,
  cy: number,
) {
  const count = 4 + Math.floor(Math.random() * 4);
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI * 0.9;
    const speed = 0.4 + Math.random() * 1.4;
    particles.push({
      x: cx + (Math.random() - 0.5) * 16,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.5,
      radius: 1.2 + Math.random() * 2.2,
      alpha: 0.7 + Math.random() * 0.3,
      decay: 0.018 + Math.random() * 0.022,
      color: randomColor(),
      glow: Math.random() > 0.4,
    });
  }
}

export default function DayParticles() {
  const { mode } = useDayNight();
  const pathname = usePathname();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const prevPathRef = useRef<string>(pathname);

  /* ─── Resize handler ─── */
  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);
  }, []);

  /* ─── Animation loop ─── */
  useEffect(() => {
    if (mode !== "day") {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    resize();
    window.addEventListener("resize", resize, { passive: true });

    function loop() {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;

      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      const alive: Particle[] = [];
      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.018; // gentle gravity
        p.vx *= 0.992; // air drag
        p.alpha -= p.decay;

        if (p.alpha <= 0) continue;
        alive.push(p);

        ctx.save();
        if (p.glow) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.color + "0.9)";
        }
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color + p.alpha.toFixed(2) + ")";
        ctx.fill();
        ctx.restore();
      }
      particlesRef.current = alive;

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [mode, resize]);

  /* ─── Navigation burst ─── */
  useEffect(() => {
    if (mode !== "day") return;
    if (pathname === prevPathRef.current) return;
    prevPathRef.current = pathname;

    const w = window.innerWidth;
    const h = window.innerHeight;

    // Solar flare burst from the sun (matches sun position in DaySky)
    const sunX = w * 0.75;
    const sunY = h * 0.18;
    spawnSolarFlare(particlesRef.current, sunX, sunY, 80);

    // Burst along the bottom edge of the viewport (like ground sparkles)
    const segments = 6;
    for (let i = 0; i < segments; i++) {
      const cx = (w / segments) * (i + 0.5);
      const cy = h * (0.75 + Math.random() * 0.2);
      spawnBurst(particlesRef.current, cx, cy, 10 + Math.floor(Math.random() * 8), 70);
    }
    // Extra centre-screen burst
    spawnBurst(particlesRef.current, w * 0.5, h * 0.5, 22, 80);
  }, [pathname, mode]);

  /* ─── Hover sparkles on interactive elements ─── */
  useEffect(() => {
    if (mode !== "day") return;

    let throttleTimer: ReturnType<typeof setTimeout> | null = null;

    function onMouseMove(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const isInteractive =
        target.tagName === "A" ||
        target.tagName === "BUTTON" ||
        target.closest("a") !== null ||
        target.closest("button") !== null ||
        target.getAttribute("role") === "button" ||
        target.getAttribute("tabindex") !== null;

      if (!isInteractive) return;
      if (throttleTimer) return;

      throttleTimer = setTimeout(() => {
        throttleTimer = null;
      }, 60); // ~16fps throttle

      spawnHover(particlesRef.current, e.clientX, e.clientY);
    }

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [mode]);

  if (mode !== "day") return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-15"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
