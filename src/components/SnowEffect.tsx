"use client";

import { useRef, useEffect } from "react";
import { updateWeather, weatherState } from "@/lib/weatherState";

interface Flake {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  alpha: number;
  rotation: number;
  rotSpeed: number;
  layer: number;
  phase: number;
  windMul: number;
  drift: number;
  flickerSpeed: number;
  turbPhase: number;
  turbFreq: number;
  branchOffsets: number[]; // Pre-calculated branch offsets
}

interface SnowPile {
  heights: Float32Array;
  cols: number;
}

export default function SnowEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    let windAngle = 0;
    let windTarget = (Math.random() - 0.5) * 1.2;
    let windTimer = 0;
    let gustStrength = 0;
    let gustDecay = 0;

    const COLS = Math.max(Math.floor(w / 4), 100);
    const pile: SnowPile = { heights: new Float32Array(COLS), cols: COLS };

    // Reduced particle counts for better performance
    const LAYER_CFG: [number, number, number, number, number, number, number][] = [
      [0.04,  0.5, 1.3,  0.12, 0.45, 0.18, 0.38],  // Reduced from 0.07
      [0.035, 1.3, 2.4,  0.38, 0.85, 0.32, 0.58],  // Reduced from 0.055
      [0.02,  2.4, 4.8,  0.65, 1.50, 0.48, 0.78],  // Reduced from 0.032
    ];

    const flakes: Flake[] = [];

    function spawnFlakes() {
      flakes.length = 0;
      for (let layer = 0; layer < LAYER_CFG.length; layer++) {
        const [density, rMin, rMax, vyMin, vyMax, aMin, aMax] = LAYER_CFG[layer];
        const count = Math.min(
          Math.floor(w * density),
          layer === 0 ? 80 : layer === 1 ? 60 : 35  // Reduced max counts
        );
        for (let i = 0; i < count; i++) {
          // Pre-calculate branch offsets for snowflakes
          const branchOffsets: number[] = [];
          for (let b = 0; b < 6; b++) {
            branchOffsets.push(0.50 + Math.random() * 0.14);
          }
          flakes.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r: rMin + Math.random() * (rMax - rMin),
            vx: (Math.random() - 0.5) * 0.25,
            vy: vyMin + Math.random() * (vyMax - vyMin),
            alpha: aMin + Math.random() * (aMax - aMin),
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.025,
            layer,
            phase: Math.random() * Math.PI * 2,
            windMul: 0.5 + Math.random() * 0.9,
            drift: 0.18 + Math.random() * 0.65,
            flickerSpeed: 0.4 + Math.random() * 1.6,
            turbPhase: Math.random() * Math.PI * 2,
            turbFreq: 0.3 + Math.random() * 0.8,
            branchOffsets,
          });
        }
      }
    }
    spawnFlakes();

    let animId: number;
    let lastTime = performance.now();

    updateWeather({ isSnowing: true, snowIntensity: 0.6 });

    // Pre-create cached gradients (updated on resize)
    let pileGrad = ctx.createLinearGradient(0, h - 22, 0, h);
    pileGrad.addColorStop(0,    "rgba(228,238,252,0.28)");
    pileGrad.addColorStop(0.55, "rgba(218,230,248,0.15)");
    pileGrad.addColorStop(1,    "rgba(200,215,238,0.06)");

    let coldGrad = ctx.createLinearGradient(0, 0, 0, h);
    coldGrad.addColorStop(0, "rgba(140,172,220,0.016)");
    coldGrad.addColorStop(1, "rgba(180,205,235,0.007)");

    const draw = (now: number) => {
      const dt = Math.min((now - lastTime) / 16.67, 3);
      lastTime = now;
      const time = now * 0.001;

      ctx.clearRect(0, 0, w, h);

      /* Wind — enhanced by shared weather wind */
      const externalWind = weatherState.windStrength * 0.3;
      windTimer -= dt;
      if (windTimer <= 0) {
        windTarget = (Math.random() - 0.5) * 1.8 + externalWind;
        windTimer = 50 + Math.random() * 240;
        if (Math.random() < 0.28) {
          gustStrength = (Math.random() < 0.5 ? 1 : -1) * (0.5 + Math.random() * 1.1);
          gustDecay = 0.014 + Math.random() * 0.022;
        }
      }
      updateWeather({ snowIntensity: 0.6 + Math.abs(windAngle) * 0.2 });
      windAngle += (windTarget - windAngle) * 0.006 * dt;
      if (Math.abs(gustStrength) > 0.01) {
        windAngle += gustStrength * 0.04 * dt;
        gustStrength *= Math.pow(1 - gustDecay, dt);
      } else {
        gustStrength = 0;
      }

      const colW = w / pile.cols;

      /* Snow pile - simplified */
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let i = 0; i < pile.cols; i++) ctx.lineTo(i * colW, h - pile.heights[i]);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = pileGrad;
      ctx.fill();

      /* Flakes - optimized rendering */
      for (const f of flakes) {
        const primaryDrift = Math.sin(time * f.flickerSpeed + f.phase) * f.drift;
        const turbulence   = Math.sin(time * f.turbFreq * 2.3 + f.turbPhase) * 0.13;
        const alphaFlicker = Math.max(0, Math.min(1, f.alpha + Math.sin(time * 0.6 + f.phase) * 0.055));

        f.x += (f.vx + windAngle * f.windMul + primaryDrift + turbulence) * dt;
        f.y += f.vy * dt;
        f.rotation += f.rotSpeed * dt;

        // Simplified rendering - no per-flake gradients
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rotation);
        ctx.globalAlpha = alphaFlicker;

        if (f.r > 2.2) {
          // Larger snowflakes with simple arms (no shadows)
          ctx.strokeStyle = "rgba(255,255,255,0.92)";
          ctx.lineWidth = Math.max(0.4, f.r * 0.18);
          ctx.lineCap = "round";
          const armLen = f.r * 0.88;
          for (let a = 0; a < 6; a++) {
            const angle = (a / 6) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * armLen, Math.sin(angle) * armLen);
            ctx.stroke();
            // Use pre-calculated branch offset
            const bFrac = f.branchOffsets[a];
            const bx = Math.cos(angle) * armLen * bFrac;
            const by = Math.sin(angle) * armLen * bFrac;
            for (const sign of [-1, 1]) {
              ctx.beginPath();
              ctx.moveTo(bx, by);
              ctx.lineTo(
                bx + Math.cos(angle + sign * 0.62) * armLen * 0.28,
                by + Math.sin(angle + sign * 0.62) * armLen * 0.28
              );
              ctx.stroke();
            }
          }
          ctx.beginPath();
          ctx.arc(0, 0, f.r * 0.18, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.fill();
        } else {
          // Simple circles for small flakes
          ctx.beginPath();
          ctx.arc(0, 0, f.r, 0, Math.PI * 2);
          ctx.fillStyle = f.layer === 0 ? "rgba(210,225,245,0.85)" : "#fff";
          ctx.fill();
        }

        ctx.restore();

        // Update position and pile
        const col = Math.floor(Math.max(0, Math.min(f.x / colW, pile.cols - 1)));
        if (f.y > h - pile.heights[col] - 2) {
          pile.heights[col] = Math.min(pile.heights[col] + f.r * 0.045, 20);
          if (col > 0)            pile.heights[col - 1] += f.r * 0.012;
          if (col < pile.cols - 1) pile.heights[col + 1] += f.r * 0.012;
          f.y = -f.r * 2 - Math.random() * 90;
          f.x = Math.random() * w;
        }
        if (f.x > w + 12) f.x = -12;
        if (f.x < -12)    f.x = w + 12;
      }

      // Decay pile heights
      for (let i = 0; i < pile.cols; i++) {
        pile.heights[i] = Math.max(0, pile.heights[i] - 0.0008 * dt);
      }

      // Cold overlay
      ctx.fillStyle = coldGrad;
      ctx.fillRect(0, 0, w, h);

      /* Wind-blown snow wisps during strong gusts */
      if (Math.abs(gustStrength) > 0.3) {
        ctx.globalAlpha = Math.min(0.035, Math.abs(gustStrength) * 0.02);
        for (let i = 0; i < 3; i++) {
          const sy = h * 0.7 + Math.random() * h * 0.25;
          const sx = Math.random() * w;
          const streakLen = 30 + Math.random() * 60;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.quadraticCurveTo(
            sx + Math.sign(gustStrength) * streakLen * 0.5, sy - 3 - Math.random() * 5,
            sx + Math.sign(gustStrength) * streakLen, sy + Math.random() * 4 - 2
          );
          ctx.strokeStyle = "rgba(220,230,245,1)";
          ctx.lineWidth = 0.5;
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
      pile.heights = new Float32Array(Math.max(Math.floor(w / 4), 100));
      pile.cols = pile.heights.length;
      
      // Recreate gradients on resize
      pileGrad = ctx.createLinearGradient(0, h - 22, 0, h);
      pileGrad.addColorStop(0,    "rgba(228,238,252,0.28)");
      pileGrad.addColorStop(0.55, "rgba(218,230,248,0.15)");
      pileGrad.addColorStop(1,    "rgba(200,215,238,0.06)");

      coldGrad = ctx.createLinearGradient(0, 0, 0, h);
      coldGrad.addColorStop(0, "rgba(140,172,220,0.016)");
      coldGrad.addColorStop(1, "rgba(180,205,235,0.007)");

      spawnFlakes();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      updateWeather({ isSnowing: false, snowIntensity: 0 });
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9998 }}
      aria-hidden="true"
    />
  );
}
