"use client";

import { useRef, useEffect } from "react";

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
    const ctx = canvas.getContext("2d");
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

    const LAYER_CFG: [number, number, number, number, number, number, number][] = [
      [0.07,  0.5, 1.3,  0.12, 0.45, 0.18, 0.38],
      [0.055, 1.3, 2.4,  0.38, 0.85, 0.32, 0.58],
      [0.032, 2.4, 4.8,  0.65, 1.50, 0.48, 0.78],
    ];

    const flakes: Flake[] = [];

    function spawnFlakes() {
      flakes.length = 0;
      for (let layer = 0; layer < LAYER_CFG.length; layer++) {
        const [density, rMin, rMax, vyMin, vyMax, aMin, aMax] = LAYER_CFG[layer];
        const count = Math.min(
          Math.floor(w * density),
          layer === 0 ? 140 : layer === 1 ? 100 : 55
        );
        for (let i = 0; i < count; i++) {
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
          });
        }
      }
    }
    spawnFlakes();

    let animId: number;
    let lastTime = performance.now();

    const draw = (now: number) => {
      const dt = Math.min((now - lastTime) / 16.67, 3);
      lastTime = now;
      const time = now * 0.001;

      ctx.clearRect(0, 0, w, h);

      /* Wind */
      windTimer -= dt;
      if (windTimer <= 0) {
        windTarget = (Math.random() - 0.5) * 1.8;
        windTimer = 50 + Math.random() * 240;
        if (Math.random() < 0.28) {
          gustStrength = (Math.random() < 0.5 ? 1 : -1) * (0.5 + Math.random() * 1.1);
          gustDecay = 0.014 + Math.random() * 0.022;
        }
      }
      windAngle += (windTarget - windAngle) * 0.006 * dt;
      if (Math.abs(gustStrength) > 0.01) {
        windAngle += gustStrength * 0.04 * dt;
        gustStrength *= Math.pow(1 - gustDecay, dt);
      } else {
        gustStrength = 0;
      }

      const colW = w / pile.cols;

      /* Snow pile */
      const pileGrad = ctx.createLinearGradient(0, h - 22, 0, h);
      pileGrad.addColorStop(0,    "rgba(228,238,252,0.28)");
      pileGrad.addColorStop(0.55, "rgba(218,230,248,0.15)");
      pileGrad.addColorStop(1,    "rgba(200,215,238,0.06)");
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let i = 0; i < pile.cols; i++) ctx.lineTo(i * colW, h - pile.heights[i]);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = pileGrad;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, h - pile.heights[0]);
      for (let i = 1; i < pile.cols; i++) ctx.lineTo(i * colW, h - pile.heights[i]);
      ctx.strokeStyle = "rgba(255,255,255,0.19)";
      ctx.lineWidth = 0.9;
      ctx.stroke();

      /* Flakes */
      for (const f of flakes) {
        const primaryDrift = Math.sin(time * f.flickerSpeed + f.phase) * f.drift;
        const turbulence   = Math.sin(time * f.turbFreq * 2.3 + f.turbPhase) * 0.13;
        const alphaFlicker = Math.max(0, Math.min(1, f.alpha + Math.sin(time * 0.6 + f.phase) * 0.055));

        f.x += (f.vx + windAngle * f.windMul + primaryDrift + turbulence) * dt;
        f.y += f.vy * dt;
        f.rotation += f.rotSpeed * dt;

        if (f.layer === 2) {
          const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 2.2);
          grad.addColorStop(0,   `rgba(255,255,255,${alphaFlicker * 0.7})`);
          grad.addColorStop(0.5, `rgba(220,235,255,${alphaFlicker * 0.35})`);
          grad.addColorStop(1,   "rgba(220,235,255,0)");
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.r * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }

        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rotation);
        ctx.globalAlpha = alphaFlicker;

        if (f.layer === 2) {
          ctx.shadowBlur  = f.r * 3;
          ctx.shadowColor = "rgba(210,230,255,0.7)";
        }

        if (f.r > 2.2) {
          ctx.strokeStyle = "rgba(255,255,255,0.92)";
          ctx.lineWidth   = Math.max(0.4, f.r * 0.18);
          ctx.lineCap     = "round";
          for (let a = 0; a < 6; a++) {
            const angle  = (a / 6) * Math.PI * 2;
            const armLen = f.r * 0.88;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * armLen, Math.sin(angle) * armLen);
            ctx.stroke();
            for (const sign of [-1, 1]) {
              const bFrac = 0.50 + Math.random() * 0.14;
              const bx    = Math.cos(angle) * armLen * bFrac;
              const by    = Math.sin(angle) * armLen * bFrac;
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
          ctx.beginPath();
          ctx.arc(0, 0, f.r, 0, Math.PI * 2);
          ctx.fillStyle = f.layer === 0 ? "rgba(210,225,245,0.85)" : "#fff";
          ctx.fill();
        }

        ctx.globalAlpha = 1;
        ctx.shadowBlur  = 0;
        ctx.restore();

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

      for (let i = 0; i < pile.cols; i++) {
        pile.heights[i] = Math.max(0, pile.heights[i] - 0.0008 * dt);
      }

      const coldGrad = ctx.createLinearGradient(0, 0, 0, h);
      coldGrad.addColorStop(0, "rgba(140,172,220,0.016)");
      coldGrad.addColorStop(1, "rgba(180,205,235,0.007)");
      ctx.fillStyle = coldGrad;
      ctx.fillRect(0, 0, w, h);

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
      spawnFlakes();
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
      style={{ zIndex: 9998 }}
      aria-hidden="true"
    />
  );
}
