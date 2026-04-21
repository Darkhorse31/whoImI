"use client";

import { useRef, useEffect } from "react";
import { useCustomization } from "@/context/CustomizationContext";

/* ─── Types ─── */
interface Fish {
  x: number;
  y: number;
  len: number;
  speed: number;
  amplitude: number;
  frequency: number;
  phase: number;
  dir: 1 | -1;
  alpha: number;
  /* Spine undulation */
  spinePhase: number;
  /* Jump physics */
  jumping: boolean;
  jumpVy: number;
  jumpY: number;
  jumpRotation: number;
  jumpCooldown: number;
  splashAlpha: number;
  splashX: number;
}

interface Bubble {
  x: number;
  y: number;
  r: number;
  speed: number;
  alpha: number;
  wobble: number;
}

interface Droplet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
}

/* ─── Helpers ─── */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map(c => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const GRAVITY = 0.18;

/* ─── Realistic fish body drawing ─── */
function drawFish(
  ctx: CanvasRenderingContext2D,
  len: number,
  alpha: number,
  tailWag: number,
  spineWave: number,
  r: number, g: number, b: number,
) {
  /* All coordinates relative to center of fish, facing right.
     We draw: body outline via bezier, lateral line, dorsal fin,
     pectoral fin, anal fin, tail (caudal), eye, gill slit, scales hint */

  const W = len;          // half-length of body
  const H = W * 0.38;    // half-height at widest

  /* ── Body silhouette (top half + bottom half via bezier) ── */
  const bodyGrad = ctx.createLinearGradient(-W, -H * 0.5, -W, H * 0.8);
  bodyGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha * 0.95})`);
  bodyGrad.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, ${alpha})`);
  bodyGrad.addColorStop(0.55, `rgba(${Math.min(255, r + 40)}, ${Math.min(255, g + 40)}, ${Math.min(255, b + 30)}, ${alpha})`);
  bodyGrad.addColorStop(1, `rgba(${Math.min(255, r + 70)}, ${Math.min(255, g + 70)}, ${Math.min(255, b + 55)}, ${alpha * 0.85})`);

  ctx.beginPath();
  /* Snout → dorsal curve → caudal peduncle (top half) */
  ctx.moveTo(W * 0.9, 0);                                                  // nose tip
  ctx.bezierCurveTo(W * 0.85, -H * 0.25, W * 0.6, -H * 0.7, W * 0.2, -H * 0.95);   // forehead
  ctx.bezierCurveTo(-W * 0.1, -H * 1.0, -W * 0.5, -H * 0.75, -W * 0.75, -H * 0.3 + spineWave * 2); // back arch
  ctx.lineTo(-W * 0.85, spineWave * 3);                                    // peduncle

  /* Caudal peduncle → belly → snout (bottom half) */
  ctx.bezierCurveTo(-W * 0.5, H * 0.65 + spineWave * 1.5, -W * 0.15, H * 0.9, W * 0.15, H * 0.85);  // belly curve
  ctx.bezierCurveTo(W * 0.45, H * 0.75, W * 0.75, H * 0.4, W * 0.9, 0);  // jaw back to nose
  ctx.closePath();
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  /* Subtle outline */
  ctx.strokeStyle = `rgba(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)}, ${alpha * 0.15})`;
  ctx.lineWidth = 0.6;
  ctx.stroke();

  /* ── Scales shimmer (3 rows of faint arcs) ── */
  ctx.save();
  ctx.globalAlpha = alpha * 0.06;
  for (let row = 0; row < 3; row++) {
    const sy = -H * 0.3 + row * H * 0.32;
    for (let col = 0; col < 6; col++) {
      const sx = W * 0.5 - col * W * 0.2;
      ctx.beginPath();
      ctx.arc(sx, sy, W * 0.08, 0, Math.PI, false);
      ctx.strokeStyle = `rgba(255, 255, 255, 1)`;
      ctx.lineWidth = 0.4;
      ctx.stroke();
    }
  }
  ctx.restore();

  /* ── Lateral line ── */
  ctx.beginPath();
  ctx.moveTo(W * 0.65, -H * 0.05);
  ctx.quadraticCurveTo(W * 0.1, -H * 0.08, -W * 0.6, -H * 0.02 + spineWave * 1.5);
  ctx.strokeStyle = `rgba(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)}, ${alpha * 0.2})`;
  ctx.lineWidth = 0.5;
  ctx.stroke();

  /* ── Dorsal fin (tall, spiny) ── */
  ctx.beginPath();
  ctx.moveTo(W * 0.15, -H * 0.9);
  ctx.bezierCurveTo(W * 0.05, -H * 1.6, -W * 0.25, -H * 1.55, -W * 0.4, -H * 0.85 + spineWave);
  ctx.bezierCurveTo(-W * 0.35, -H * 0.75, -W * 0.05, -H * 0.82, W * 0.15, -H * 0.9);
  ctx.closePath();
  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.45})`;
  ctx.fill();
  /* Fin rays */
  ctx.strokeStyle = `rgba(${Math.max(0, r - 20)}, ${Math.max(0, g - 20)}, ${Math.max(0, b - 20)}, ${alpha * 0.12})`;
  ctx.lineWidth = 0.3;
  for (let i = 0; i < 4; i++) {
    const fx = W * 0.1 - i * W * 0.12;
    ctx.beginPath();
    ctx.moveTo(fx, -H * 0.88 + i * 0.5);
    ctx.lineTo(fx - W * 0.04, -H * 1.3 + i * H * 0.1 + spineWave * 0.5);
    ctx.stroke();
  }

  /* ── Caudal fin (tail) — forked, with wag ── */
  const tw = tailWag * W * 0.25;
  ctx.beginPath();
  ctx.moveTo(-W * 0.82, -H * 0.2 + spineWave * 2.5);
  ctx.bezierCurveTo(
    -W * 1.05 + tw * 0.3, -H * 0.1 + spineWave * 3,
    -W * 1.15 + tw * 0.6, -H * 0.7 + spineWave * 3,
    -W * 1.3 + tw, -H * 1.0 + spineWave * 3.5,    // top fork tip
  );
  ctx.bezierCurveTo(
    -W * 1.1 + tw * 0.5, -H * 0.35 + spineWave * 3,
    -W * 1.0 + tw * 0.4, H * 0.1 + spineWave * 2.5,
    -W * 0.85, spineWave * 2.5,                     // middle notch
  );
  ctx.bezierCurveTo(
    -W * 1.0 + tw * 0.4, H * 0.2 + spineWave * 2,
    -W * 1.1 + tw * 0.5, H * 0.55 + spineWave * 2,
    -W * 1.3 + tw, H * 0.9 + spineWave * 2.5,      // bottom fork tip
  );
  ctx.bezierCurveTo(
    -W * 1.15 + tw * 0.6, H * 0.5 + spineWave * 2,
    -W * 1.0 + tw * 0.3, H * 0.3 + spineWave * 1.5,
    -W * 0.82, H * 0.15 + spineWave * 2,
  );
  ctx.closePath();
  const tailGrad = ctx.createLinearGradient(-W * 0.85, 0, -W * 1.3 + tw, 0);
  tailGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha * 0.7})`);
  tailGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${alpha * 0.3})`);
  ctx.fillStyle = tailGrad;
  ctx.fill();

  /* ── Pectoral fin (side fin, with gentle flap) ── */
  const pectoralFlap = Math.sin(spineWave * 0.8) * H * 0.2;
  ctx.beginPath();
  ctx.moveTo(W * 0.25, H * 0.15);
  ctx.bezierCurveTo(
    W * 0.15, H * 0.6 + pectoralFlap,
    -W * 0.05, H * 0.7 + pectoralFlap,
    -W * 0.15, H * 0.4 + pectoralFlap * 0.5,
  );
  ctx.bezierCurveTo(-W * 0.05, H * 0.35, W * 0.1, H * 0.2, W * 0.25, H * 0.15);
  ctx.closePath();
  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.3})`;
  ctx.fill();

  /* ── Anal fin (small, bottom-rear) ── */
  ctx.beginPath();
  ctx.moveTo(-W * 0.35, H * 0.7 + spineWave);
  ctx.bezierCurveTo(-W * 0.45, H * 1.1 + spineWave, -W * 0.6, H * 1.0 + spineWave, -W * 0.65, H * 0.6 + spineWave);
  ctx.bezierCurveTo(-W * 0.55, H * 0.62 + spineWave, -W * 0.4, H * 0.65 + spineWave, -W * 0.35, H * 0.7 + spineWave);
  ctx.closePath();
  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.35})`;
  ctx.fill();

  /* ── Gill slit ── */
  ctx.beginPath();
  ctx.moveTo(W * 0.42, -H * 0.35);
  ctx.quadraticCurveTo(W * 0.38, 0, W * 0.44, H * 0.3);
  ctx.strokeStyle = `rgba(${Math.max(0, r - 50)}, ${Math.max(0, g - 50)}, ${Math.max(0, b - 50)}, ${alpha * 0.18})`;
  ctx.lineWidth = 0.7;
  ctx.stroke();

  /* ── Eye ── */
  /* Sclera */
  ctx.beginPath();
  ctx.arc(W * 0.6, -H * 0.2, W * 0.1, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(240, 240, 245, ${alpha * 0.95})`;
  ctx.fill();
  /* Iris */
  ctx.beginPath();
  ctx.arc(W * 0.62, -H * 0.2, W * 0.065, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${Math.max(0, r - 60)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 20)}, ${alpha})`;
  ctx.fill();
  /* Pupil */
  ctx.beginPath();
  ctx.arc(W * 0.635, -H * 0.2, W * 0.035, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(10, 10, 20, ${alpha})`;
  ctx.fill();
  /* Glint */
  ctx.beginPath();
  ctx.arc(W * 0.615, -H * 0.25, W * 0.018, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
  ctx.fill();

  /* ── Mouth line ── */
  ctx.beginPath();
  ctx.moveTo(W * 0.88, 0);
  ctx.quadraticCurveTo(W * 0.82, H * 0.08, W * 0.72, H * 0.05);
  ctx.strokeStyle = `rgba(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)}, ${alpha * 0.25})`;
  ctx.lineWidth = 0.5;
  ctx.stroke();
}

export default function OceanFishEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { customColors } = useCustomization();
  const colorsRef = useRef(customColors);
  colorsRef.current = customColors;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    /* ─── Wave parameters ─── */
    const WAVE_COUNT = 4;
    const waves = Array.from({ length: WAVE_COUNT }, (_, i) => ({
      amplitude: 8 + i * 6,
      frequency: 0.003 + i * 0.001,
      speed: 0.008 + i * 0.004,
      yOffset: h * 0.55 + i * 45,
      alpha: 0.06 - i * 0.012,
    }));

    function waveYAt(x: number, frame: number): number {
      const wv = waves[0];
      return (
        wv.yOffset +
        Math.sin(x * wv.frequency + frame * wv.speed) * wv.amplitude +
        Math.sin(x * wv.frequency * 0.5 + frame * wv.speed * 1.3) * wv.amplitude * 0.5
      );
    }

    /* ─── 4 Fish (all same color — accent) ─── */
    const fishes: Fish[] = [];
    const sizes = [22, 28, 18, 24];
    const speeds = [0.65, 0.45, 0.8, 0.55];
    for (let i = 0; i < 4; i++) {
      const dir: 1 | -1 = i % 2 === 0 ? 1 : -1;
      fishes.push({
        x: w * 0.12 + i * w * 0.23,
        y: h * 0.62 + i * 28,
        len: sizes[i],
        speed: speeds[i],
        amplitude: 16 + i * 7,
        frequency: 0.014 + i * 0.003,
        phase: i * Math.PI * 0.55,
        dir,
        alpha: 0.75 + i * 0.04,
        spinePhase: i * 1.2,
        jumping: false,
        jumpVy: 0,
        jumpY: 0,
        jumpRotation: 0,
        jumpCooldown: 250 + Math.floor(Math.random() * 450),
        splashAlpha: 0,
        splashX: 0,
      });
    }

    /* ─── Bubbles ─── */
    const MAX_BUBBLES = 25;
    const bubbles: Bubble[] = [];
    function spawnBubble() {
      if (bubbles.length >= MAX_BUBBLES) return;
      bubbles.push({
        x: Math.random() * w,
        y: h + 5,
        r: 1 + Math.random() * 3,
        speed: 0.3 + Math.random() * 0.8,
        alpha: 0.15 + Math.random() * 0.2,
        wobble: Math.random() * Math.PI * 2,
      });
    }

    /* ─── Droplets ─── */
    const droplets: Droplet[] = [];
    function spawnSplash(sx: number, sy: number) {
      const count = 6 + Math.floor(Math.random() * 5);
      for (let i = 0; i < count; i++) {
        const angle = -Math.PI * 0.15 - Math.random() * Math.PI * 0.7;
        const spd = 1.5 + Math.random() * 3;
        droplets.push({
          x: sx + (Math.random() - 0.5) * 10,
          y: sy,
          vx: Math.cos(angle) * spd * (Math.random() > 0.5 ? 1 : -1),
          vy: Math.sin(angle) * spd - 1,
          r: 1 + Math.random() * 1.5,
          alpha: 0.5 + Math.random() * 0.3,
        });
      }
    }

    let animId: number;
    let t = 0;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      t++;

      /* Single fish color from theme accent */
      const [fR, fG, fB] = hexToRgb(colorsRef.current.accent);
      const waveColor = `rgba(${fR}, ${fG}, ${fB}, `;

      /* ─── Water tint ─── */
      const [abr, abg, abb] = hexToRgb(colorsRef.current.bg);
      const waterGrad = ctx.createLinearGradient(0, h * 0.5, 0, h);
      waterGrad.addColorStop(0, `rgba(${abr}, ${abg}, ${abb}, 0)`);
      waterGrad.addColorStop(0.4, `rgba(${abr}, ${abg}, ${abb}, 0.04)`);
      waterGrad.addColorStop(1, `rgba(${abr}, ${abg}, ${abb}, 0.10)`);
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, h * 0.5, w, h * 0.5);

      /* ─── Waves ─── */
      for (let wi = 0; wi < waves.length; wi++) {
        const wave = waves[wi];
        ctx.beginPath();
        for (let x = 0; x <= w; x += 4) {
          const y =
            wave.yOffset +
            Math.sin(x * wave.frequency + t * wave.speed) * wave.amplitude +
            Math.sin(x * wave.frequency * 0.5 + t * wave.speed * 1.3) * wave.amplitude * 0.5;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fillStyle = `${waveColor}${wave.alpha})`;
        ctx.fill();
      }

      /* ─── Fish ─── */
      for (let fi = 0; fi < fishes.length; fi++) {
        const f = fishes[fi];

        const swimY = f.y + Math.sin(t * f.frequency + f.phase) * f.amplitude * 0.15;
        const surfaceY = waveYAt(f.x, t);

        /* Jump logic */
        f.jumpCooldown--;
        if (!f.jumping && f.jumpCooldown <= 0) {
          f.jumping = true;
          f.jumpVy = -(3.5 + Math.random() * 2.5);
          f.jumpY = 0;
          f.splashX = f.x;
          f.splashAlpha = 0.6;
          spawnSplash(f.x, surfaceY);
        }
        if (f.jumping) {
          f.jumpVy += GRAVITY;
          f.jumpY += f.jumpVy;
          f.jumpRotation = Math.atan2(f.jumpVy, f.speed * 3) * f.dir;
          if (f.jumpY >= 0) {
            f.jumpY = 0;
            f.jumpVy = 0;
            f.jumping = false;
            f.jumpRotation = 0;
            f.jumpCooldown = 350 + Math.floor(Math.random() * 500);
            f.splashX = f.x;
            f.splashAlpha = 0.5;
            spawnSplash(f.x, surfaceY);
          }
        }

        /* Splash ring */
        if (f.splashAlpha > 0) {
          ctx.beginPath();
          ctx.ellipse(f.splashX, surfaceY, 12 + (0.6 - f.splashAlpha) * 30, 3, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(200, 230, 255, ${f.splashAlpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
          f.splashAlpha -= 0.012;
        }

        const renderY = f.jumping ? surfaceY + f.jumpY : swimY;
        const tailWag = Math.sin(t * (f.jumping ? 0.2 : 0.08) + f.phase) * (f.jumping ? 0.7 : 0.35);
        const spineWave = Math.sin(t * 0.05 + f.spinePhase) * 1.5;

        ctx.save();
        ctx.translate(f.x, renderY);
        ctx.rotate(f.jumpRotation);
        ctx.scale(f.dir, 1);

        drawFish(ctx, f.len, f.alpha, tailWag, spineWave, fR, fG, fB);

        ctx.restore();

        /* Move */
        f.x += f.speed * f.dir;
        if (!f.jumping) f.y += Math.sin(t * 0.005 + f.phase) * 0.12;

        if (f.dir === 1 && f.x > w + f.len * 2) {
          f.x = -f.len * 2;
          f.y = h * 0.58 + Math.random() * h * 0.3;
        }
        if (f.dir === -1 && f.x < -f.len * 2) {
          f.x = w + f.len * 2;
          f.y = h * 0.58 + Math.random() * h * 0.3;
        }
      }

      /* ─── Droplets ─── */
      for (let i = droplets.length - 1; i >= 0; i--) {
        const d = droplets[i];
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 230, 255, ${d.alpha})`;
        ctx.fill();
        d.vy += GRAVITY * 0.6;
        d.x += d.vx;
        d.y += d.vy;
        d.alpha -= 0.008;
        if (d.alpha <= 0 || d.y > h) droplets.splice(i, 1);
      }

      /* ─── Bubbles ─── */
      if (t % 14 === 0) spawnBubble();
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(140, 200, 255, ${b.alpha})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220, 240, 255, ${b.alpha * 0.6})`;
        ctx.fill();
        b.y -= b.speed;
        b.x += Math.sin(b.wobble + t * 0.02) * 0.3;
        b.alpha -= 0.001;
        if (b.y < h * 0.45 || b.alpha <= 0) bubbles.splice(i, 1);
      }

      /* ─── Caustic light rays ─── */
      for (let i = 0; i < 3; i++) {
        const rx = w * 0.2 + i * w * 0.3 + Math.sin(t * 0.006 + i * 2) * 60;
        const ry = h * 0.55;
        const rayGrad = ctx.createLinearGradient(rx, ry, rx + 20, h);
        rayGrad.addColorStop(0, `rgba(${fR}, ${fG}, ${fB}, 0.025)`);
        rayGrad.addColorStop(1, `rgba(${fR}, ${fG}, ${fB}, 0)`);
        ctx.beginPath();
        ctx.moveTo(rx - 15, ry);
        ctx.lineTo(rx + 15, ry);
        ctx.lineTo(rx + 40 + Math.sin(t * 0.01 + i) * 20, h);
        ctx.lineTo(rx - 40 + Math.sin(t * 0.01 + i) * 20, h);
        ctx.closePath();
        ctx.fillStyle = rayGrad;
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
      waves.forEach((wave, i) => { wave.yOffset = h * 0.55 + i * 45; });
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
      style={{ zIndex: 9996 }}
      aria-hidden="true"
    />
  );
}
