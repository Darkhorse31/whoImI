"use client";

import { useRef, useEffect } from "react";

interface Drop {
  x: number;
  y: number;
  len: number;
  speed: number;
  alpha: number;
  width: number;
}

export default function RainEffect() {
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

    const COUNT = Math.min(Math.floor(w * 0.18), 260);
    const drops: Drop[] = [];

    for (let i = 0; i < COUNT; i++) {
      drops.push({
        x: Math.random() * w,
        y: Math.random() * h * -1, // start above screen
        len: 12 + Math.random() * 22,
        speed: 6 + Math.random() * 10,
        alpha: 0.15 + Math.random() * 0.25,
        width: 0.5 + Math.random() * 1,
      });
    }

    /* Splash pool — tiny circles at landing */
    interface Splash {
      x: number;
      y: number;
      r: number;
      alpha: number;
    }
    const splashes: Splash[] = [];

    let animId: number;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      /* Rain streaks */
      for (const d of drops) {
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + 0.5, d.y + d.len);
        ctx.strokeStyle = `rgba(174, 194, 224, ${d.alpha})`;
        ctx.lineWidth = d.width;
        ctx.lineCap = "round";
        ctx.stroke();

        d.y += d.speed;
        d.x += 0.4; // slight wind drift

        if (d.y > h) {
          /* spawn splash */
          splashes.push({
            x: d.x,
            y: h - 2,
            r: 1.5 + Math.random() * 2,
            alpha: 0.35,
          });
          d.y = -d.len - Math.random() * 100;
          d.x = Math.random() * w;
        }
      }

      /* Splashes */
      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i];
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI, true);
        ctx.strokeStyle = `rgba(174, 194, 224, ${s.alpha})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        s.r += 0.3;
        s.alpha -= 0.02;
        if (s.alpha <= 0) splashes.splice(i, 1);
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
      style={{ zIndex: 9997 }}
      aria-hidden="true"
    />
  );
}
