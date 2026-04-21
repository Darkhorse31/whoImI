"use client";

import { useRef, useEffect } from "react";

/**
 * Floating gradient orbs that drift slowly across the viewport.
 * Creates an ambient, animated background layer.
 */

interface Orb {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  hue: number;
  saturation: number;
  lightness: number;
  alpha: number;
}

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    const ORB_COUNT = 5;
    const orbs: Orb[] = [];

    for (let i = 0; i < ORB_COUNT; i++) {
      orbs.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 120 + Math.random() * 200,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        hue: Math.random() * 360,
        saturation: 50 + Math.random() * 30,
        lightness: 30 + Math.random() * 20,
        alpha: 0.04 + Math.random() * 0.04,
      });
    }

    let animId: number;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      for (const o of orbs) {
        /* Radial gradient orb */
        const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        grad.addColorStop(
          0,
          `hsla(${o.hue}, ${o.saturation}%, ${o.lightness}%, ${o.alpha})`,
        );
        grad.addColorStop(1, `hsla(${o.hue}, ${o.saturation}%, ${o.lightness}%, 0)`);

        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        /* Move & bounce */
        o.x += o.vx;
        o.y += o.vy;
        o.hue = (o.hue + 0.02) % 360; // slow hue rotation

        if (o.x - o.r > w + 50) o.x = -o.r;
        if (o.x + o.r < -50) o.x = w + o.r;
        if (o.y - o.r > h + 50) o.y = -o.r;
        if (o.y + o.r < -50) o.y = h + o.r;
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    const onResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
