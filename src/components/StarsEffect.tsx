"use client";

import { useRef, useEffect } from "react";

interface Star {
  x: number;
  y: number;
  r: number;
  alpha: number;
  targetAlpha: number;
  speed: number; // twinkle speed
  hue: number;
}

export default function StarsEffect() {
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

    const COUNT = Math.min(Math.floor(w * 0.15), 220);
    const stars: Star[] = [];

    for (let i = 0; i < COUNT; i++) {
      const alpha = 0.2 + Math.random() * 0.7;
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.4 + Math.random() * 1.8,
        alpha,
        targetAlpha: alpha,
        speed: 0.003 + Math.random() * 0.012,
        hue: Math.random() < 0.3 ? 40 + Math.random() * 30 : 210 + Math.random() * 40,
      });
    }

    let animId: number;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      for (const s of stars) {
        /* Twinkle — drift alpha toward random target */
        const diff = s.targetAlpha - s.alpha;
        s.alpha += diff * s.speed * 3;
        if (Math.abs(diff) < 0.02) {
          s.targetAlpha = 0.15 + Math.random() * 0.75;
        }

        /* Glow layer */
        const glow = s.r * 4;
        const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glow);
        grad.addColorStop(0, `hsla(${s.hue}, 60%, 85%, ${s.alpha * 0.4})`);
        grad.addColorStop(1, `hsla(${s.hue}, 60%, 85%, 0)`);
        ctx.beginPath();
        ctx.arc(s.x, s.y, glow, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        /* Core */
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${s.hue}, 40%, 92%, ${s.alpha})`;
        ctx.fill();
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
      style={{ zIndex: 1 }}
      aria-hidden="true"
    />
  );
}
