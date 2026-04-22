"use client";

import { useRef, useEffect } from "react";
import { updateWeather, weatherState } from "@/lib/weatherState";

interface Drop {
  x: number;
  y: number;
  len: number;
  speed: number;
  alpha: number;
  width: number;
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

interface Puddle {
  x: number;
  y: number;
  rx: number;
  ry: number;
  alpha: number;
  rippleTimer: number;
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

    /* Wind — reacts to thunder storm intensity */
    let windAngle = 0.08 + Math.random() * 0.08;
    let windTarget = windAngle;
    let windTimer = 0;
    let gustStrength = 0;
    let gustTarget = 0;

    /* Rain intensity (0..1) */
    let intensity = 0.45 + Math.random() * 0.35;
    let intensityTarget = intensity;
    let intensityTimer = 0;

    function targetCount() {
      return Math.min(250, Math.max(40, Math.floor(w * 0.18 * intensity)));
    }

    const drops: Drop[] = [];
    const splashes: Splash[] = [];
    const ripples: Ripple[] = [];
    const puddles: Puddle[] = [];

    /* Create some puddles at the bottom */
    for (let i = 0; i < Math.floor(w / 200); i++) {
      puddles.push({
        x: 60 + Math.random() * (w - 120),
        y: h - 4 - Math.random() * 8,
        rx: 30 + Math.random() * 50,
        ry: 3 + Math.random() * 4,
        alpha: 0,
        rippleTimer: 0,
      });
    }

    function spawnDrop(startAbove = false): Drop {
      return {
        x: Math.random() * (w + 200) - 100,
        y: startAbove ? -Math.random() * h : Math.random() * h,
        len: 14 + Math.random() * 28,
        speed: 8 + Math.random() * 14,
        alpha: 0.12 + Math.random() * 0.28,
        width: 0.4 + Math.random() * 0.9,
        windOffsetX: 0.7 + Math.random() * 0.6,
      };
    }

    for (let i = 0; i < targetCount(); i++) drops.push(spawnDrop(false));

    let animId: number;
    let lastTime = performance.now();

    updateWeather({ isRaining: true });

    const draw = (now: number) => {
      const dt = Math.min((now - lastTime) / 16.67, 3);
      lastTime = now;

      ctx.clearRect(0, 0, w, h);

      /* ── React to thunder — intensify during storms ── */
      const stormBoost = weatherState.isThundering ? 0.3 : 0;
      const flashBoost = weatherState.flashIntensity;

      /* Wind update — gusts intensify during thunder */
      windTimer -= dt;
      if (windTimer <= 0) {
        const stormWind = weatherState.isThundering ? 0.15 : 0;
        windTarget = 0.04 + Math.random() * 0.22 + stormWind;
        windTimer = 80 + Math.random() * 300;

        if (weatherState.isThundering && Math.random() < 0.4) {
          gustTarget = (Math.random() < 0.5 ? 1 : -1) * (0.3 + Math.random() * 0.8);
        }
      }
      windAngle += (windTarget - windAngle) * 0.004 * dt;
      gustStrength += (gustTarget - gustStrength) * 0.02 * dt;
      gustTarget *= 0.995;

      /* Intensity drift — storms push intensity higher */
      intensityTimer -= dt;
      if (intensityTimer <= 0) {
        intensityTarget = Math.min(1, 0.2 + Math.random() * 0.8 + stormBoost);
        intensityTimer = 120 + Math.random() * 400;
      }
      intensity += (intensityTarget - intensity) * 0.002 * dt;

      updateWeather({
        rainIntensity: intensity,
        windStrength: Math.abs(windAngle + gustStrength),
        windAngle: windAngle,
      });

      /* Adjust pool size */
      const target = targetCount();
      while (drops.length < target) drops.push(spawnDrop(true));
      while (drops.length > target + 20) drops.splice(Math.floor(Math.random() * drops.length), 1);

      const sinW = Math.sin(windAngle + gustStrength * 0.3);
      const cosW = Math.cos(windAngle);

      /* ── Lightning flash brightens rain ── */
      if (flashBoost > 0.1) {
        const flashGrad = ctx.createRadialGradient(w / 2, h * 0.3, 0, w / 2, h * 0.3, Math.max(w, h));
        flashGrad.addColorStop(0, `rgba(200,220,255,${flashBoost * 0.08})`);
        flashGrad.addColorStop(1, `rgba(180,200,240,0)`);
        ctx.fillStyle = flashGrad;
        ctx.fillRect(0, 0, w, h);
      }

      /* ── Draw drops ── */
      ctx.lineCap = "round";
      for (const d of drops) {
        const vx = sinW * d.speed * d.windOffsetX + gustStrength * d.windOffsetX * 2;
        const vy = cosW * d.speed;

        const tailX = d.x - sinW * d.len * d.windOffsetX;
        const tailY = d.y - cosW * d.len;

        const illumination = flashBoost > 0.2 ? 1 + flashBoost * 0.4 : 1;
        const baseAlpha = d.alpha * illumination;

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(d.x, d.y);
        ctx.strokeStyle = `rgba(190,210,235,${baseAlpha})`;
        ctx.lineWidth = d.width;
        ctx.stroke();

        d.x += vx * dt;
        d.y += vy * dt;

        if (d.y > h + d.len) {
          if (splashes.length < 120) {
            splashes.push({
              x: d.x,
              y: h - 2,
              r: 0,
              alpha: 0.38 + Math.random() * 0.22,
              vx: (Math.random() - 0.5) * 1.2 + gustStrength * 0.5,
            });
            splashes.push({
              x: d.x + (Math.random() - 0.5) * 6,
              y: h - 2,
              r: 0,
              alpha: 0.2 + Math.random() * 0.15,
              vx: (Math.random() - 0.5) * 2.0 + gustStrength * 0.3,
            });
          }
          if (ripples.length < 80) {
            ripples.push({
              x: d.x,
              y: h - 1,
              rx: 0,
              ry: 0,
              alpha: 0.3 + Math.random() * 0.2,
            });
          }

          Object.assign(d, spawnDrop(true));
        }
        if (d.x > w + 100) d.x -= w + 200;
        if (d.x < -100) d.x += w + 200;
      }

      /* ── Splashes ── */
      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i];
        ctx.beginPath();
        ctx.arc(s.x + s.vx * s.r, s.y - s.r * 0.8, Math.max(0.1, s.r * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(174,194,224,${s.alpha})`;
        ctx.fill();
        s.r += 0.45 * dt;
        s.alpha -= 0.022 * dt;
        if (s.alpha <= 0) splashes.splice(i, 1);
      }

      /* ── Ripples ── */
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, r.rx, r.ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(174,194,224,${r.alpha})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
        r.rx += 1.4 * dt;
        r.ry += 0.5 * dt;
        r.alpha -= 0.018 * dt;
        if (r.alpha <= 0) ripples.splice(i, 1);
      }

      /* ── Puddles ── */
      for (const p of puddles) {
        p.alpha = Math.min(0.08, p.alpha + 0.0002 * dt * intensity);
        p.rippleTimer -= dt;

        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(160,185,220,${p.alpha})`;
        ctx.fill();

        if (flashBoost > 0.15) {
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.rx * 0.7, p.ry * 0.5, 0, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(200,220,255,${flashBoost * 0.06})`;
          ctx.fill();
        }

        if (p.rippleTimer <= 0) {
          const rx = p.x + (Math.random() - 0.5) * p.rx * 1.6;
          ripples.push({
            x: rx, y: p.y, rx: 0, ry: 0,
            alpha: 0.2 + Math.random() * 0.15,
          });
          p.rippleTimer = (8 + Math.random() * 20) / intensity;
        }
      }

      /* ── Mist layer during heavy rain ── */
      if (intensity > 0.5) {
        const mistAlpha = (intensity - 0.5) * 0.06;
        const mistGrad = ctx.createLinearGradient(0, h * 0.85, 0, h);
        mistGrad.addColorStop(0, "rgba(180,200,230,0)");
        mistGrad.addColorStop(0.5, `rgba(180,200,230,${mistAlpha * 0.5})`);
        mistGrad.addColorStop(1, `rgba(180,200,230,${mistAlpha})`);
        ctx.fillStyle = mistGrad;
        ctx.fillRect(0, 0, w, h);
      }

      /* ── Wet-surface darkening ── */
      const wetGrad = ctx.createLinearGradient(0, h * 0.75, 0, h);
      wetGrad.addColorStop(0, "rgba(20,30,50,0)");
      wetGrad.addColorStop(1, `rgba(10,18,35,${0.04 * intensity})`);
      ctx.fillStyle = wetGrad;
      ctx.fillRect(0, 0, w, h);

      /* ── Wind streaks during gusts ── */
      if (Math.abs(gustStrength) > 0.15) {
        ctx.globalAlpha = Math.min(0.04, Math.abs(gustStrength) * 0.03);
        for (let i = 0; i < 5; i++) {
          const sy = Math.random() * h;
          const sx = Math.random() * w;
          const streakLen = 40 + Math.random() * 80;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + Math.sign(gustStrength) * streakLen, sy + Math.random() * 4 - 2);
          ctx.strokeStyle = "rgba(200,215,235,1)";
          ctx.lineWidth = 0.3;
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

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
      updateWeather({ isRaining: false, rainIntensity: 0 });
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
