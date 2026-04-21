"use client";

import { useRef, useEffect } from "react";

interface Drop {
  x: number;
  y: number;
  len: number;
  speed: number;
  alpha: number;
  width: number;
  /** wind angle in radians from vertical */
  windOffsetX: number;
}

interface Splash {
  x: number;
  y: number;
  r: number;
  alpha: number;
  vx: number;
}

interface Ripple {
  x: number;
  y: number;
  rx: number;
  ry: number;
  alpha: number;
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

    /* Wind */
    let windAngle = 0.08 + Math.random() * 0.08;     // radians from vertical
    let windTarget = windAngle;
    let windTimer = 0;

    /* Rain intensity (0..1) — drifts naturally over time */
    let intensity = 0.45 + Math.random() * 0.35;
    let intensityTarget = intensity;
    let intensityTimer = 0;

    function targetCount() {
      return Math.max(40, Math.floor(w * 0.22 * intensity));
    }

    const drops: Drop[] = [];
    const splashes: Splash[] = [];
    const ripples: Ripple[] = [];

    function spawnDrop(startAbove = false): Drop {
      return {
        x:            Math.random() * (w + 200) - 100,
        y:            startAbove ? -Math.random() * h : Math.random() * h,
        len:          14 + Math.random() * 28,
        speed:        8 + Math.random() * 14,
        alpha:        0.12 + Math.random() * 0.28,
        width:        0.4 + Math.random() * 0.9,
        windOffsetX:  (0.7 + Math.random() * 0.6),
      };
    }

    for (let i = 0; i < targetCount(); i++) drops.push(spawnDrop(false));

    let animId: number;
    let lastTime = performance.now();

    const draw = (now: number) => {
      const dt = Math.min((now - lastTime) / 16.67, 3);
      lastTime = now;

      ctx.clearRect(0, 0, w, h);

      /* Wind update */
      windTimer -= dt;
      if (windTimer <= 0) {
        windTarget = 0.04 + Math.random() * 0.22;
        windTimer  = 80 + Math.random() * 300;
      }
      windAngle += (windTarget - windAngle) * 0.004 * dt;

      /* Intensity drift */
      intensityTimer -= dt;
      if (intensityTimer <= 0) {
        intensityTarget = 0.2 + Math.random() * 0.8;
        intensityTimer  = 120 + Math.random() * 400;
      }
      intensity += (intensityTarget - intensity) * 0.002 * dt;

      /* Adjust pool size */
      const target = targetCount();
      while (drops.length < target) drops.push(spawnDrop(true));
      while (drops.length > target + 20) drops.splice(Math.floor(Math.random() * drops.length), 1);

      const sinW = Math.sin(windAngle);
      const cosW = Math.cos(windAngle);

      /* Draw drops */
      for (const d of drops) {
        const vx = sinW * d.speed * d.windOffsetX;
        const vy = cosW * d.speed;

        const tailX = d.x - sinW * d.len * d.windOffsetX;
        const tailY = d.y - cosW * d.len;

        /* Motion-blur streak */
        const grad = ctx.createLinearGradient(tailX, tailY, d.x, d.y);
        grad.addColorStop(0,   `rgba(174,194,224,0)`);
        grad.addColorStop(0.4, `rgba(174,194,224,${d.alpha * 0.5})`);
        grad.addColorStop(1,   `rgba(200,218,240,${d.alpha})`);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(d.x, d.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = d.width;
        ctx.lineCap = "round";
        ctx.stroke();

        d.x += vx * dt;
        d.y += vy * dt;

        if (d.y > h + d.len) {
          /* Splash on floor */
          splashes.push({
            x:     d.x,
            y:     h - 2,
            r:     0,
            alpha: 0.38 + Math.random() * 0.22,
            vx:    (Math.random() - 0.5) * 1.2,
          });
          splashes.push({
            x:     d.x + (Math.random() - 0.5) * 6,
            y:     h - 2,
            r:     0,
            alpha: 0.2 + Math.random() * 0.15,
            vx:    (Math.random() - 0.5) * 2.0,
          });
          /* Ripple */
          ripples.push({
            x:     d.x,
            y:     h - 1,
            rx:    0,
            ry:    0,
            alpha: 0.3 + Math.random() * 0.2,
          });

          Object.assign(d, spawnDrop(true));
        }
        if (d.x > w + 100) d.x -= w + 200;
        if (d.x < -100)    d.x += w + 200;
      }

      /* Splashes */
      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i];
        ctx.beginPath();
        ctx.arc(s.x + s.vx * s.r, s.y - s.r * 0.8, Math.max(0.1, s.r * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(174,194,224,${s.alpha})`;
        ctx.fill();
        s.r     += 0.45 * dt;
        s.alpha -= 0.022 * dt;
        if (s.alpha <= 0) splashes.splice(i, 1);
      }

      /* Ripples — elliptical at grazing angle */
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, r.rx, r.ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(174,194,224,${r.alpha})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
        r.rx    += 1.4 * dt;
        r.ry    += 0.5 * dt;
        r.alpha -= 0.018 * dt;
        if (r.alpha <= 0) ripples.splice(i, 1);
      }

      /* Subtle wet-surface darkening overlay */
      const wetGrad = ctx.createLinearGradient(0, h * 0.75, 0, h);
      wetGrad.addColorStop(0, "rgba(20,30,50,0)");
      wetGrad.addColorStop(1, `rgba(10,18,35,${0.04 * intensity})`);
      ctx.fillStyle = wetGrad;
      ctx.fillRect(0, 0, w, h);

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

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
