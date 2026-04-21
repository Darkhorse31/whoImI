"use client";

import { useRef, useEffect } from "react";

/* ══════════════════════════════════════════════════════════════
   Types
   ══════════════════════════════════════════════════════════════ */

interface Fish {
  x: number;
  y: number;             // baseline depth Y
  depth: number;         // 0 = surface, 1 = deep — affects color/alpha/size/speed
  len: number;
  baseSpeed: number;
  speed: number;
  dir: 1 | -1;
  phase: number;
  /* Swimming motion */
  swimTimer: number;
  bodyFlex: number;      // current body curvature
  tailFreq: number;      // tail wag frequency
  finPhase: number;
  /* Behaviour */
  turnTimer: number;     // frames until possible direction change
  driftVy: number;       // gentle vertical drift
  /* Jump */
  jumping: boolean;
  jumpVy: number;
  jumpY: number;
  jumpRot: number;
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

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

interface FoamParticle {
  x: number;
  y: number;
  r: number;
  alpha: number;
  vx: number;
  life: number;
}

interface Droplet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
}

/* ══════════════════════════════════════════════════════════════
   Helpers
   ══════════════════════════════════════════════════════════════ */

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

const GRAVITY = 0.16;
const TAU = Math.PI * 2;

/* ── Fixed realistic colors (not theme-dependent) ── */
/* Ocean water: deep teal-blue */
const W_R = 30, W_G = 90, W_B = 130;     // wave fill
const D_R = 10, D_G = 35, D_B = 65;      // deep water tint
const C_R = 70, C_G = 160, C_B = 210;    // caustic light

/* 4 natural fish colors — earthy, muted, realistic */
const FISH_PALETTE: [number, number, number][] = [
  [180, 140, 80],    // golden-olive (common freshwater tone)
  [120, 145, 110],   // sage-green (perch-like)
  [160, 120, 100],   // warm brown-copper
  [100, 130, 145],   // steel-blue-grey
];

/* ══════════════════════════════════════════════════════════════
   Draw a single realistic fish
   ══════════════════════════════════════════════════════════════ */

function drawRealisticFish(
  ctx: CanvasRenderingContext2D,
  len: number,
  alpha: number,
  bodyFlex: number,
  tailWag: number,
  finFlap: number,
  r: number, g: number, b: number,
  depth: number,          // 0–1, darkens deeper fish
  underwater: boolean,    // apply distortion tint when true
) {
  const W = len;
  const H = W * 0.36;
  const flex = bodyFlex * W * 0.04;

  /* Depth-based color darkening */
  const dk = 1 - depth * 0.35;
  const dr = Math.round(r * dk);
  const dg = Math.round(g * dk);
  const db = Math.round(b * dk);

  /* Underwater tint (slightly blue-shifted) */
  const fr = underwater ? Math.round(lerp(dr, dr * 0.7 + 30, 0.15)) : dr;
  const fg = underwater ? Math.round(lerp(dg, dg * 0.8 + 40, 0.15)) : dg;
  const fb = underwater ? Math.round(lerp(db, db * 0.8 + 55, 0.15)) : db;

  /* ── Tail (caudal fin) — drawn first so body overlaps ── */
  const tw = tailWag * W * 0.28;
  ctx.beginPath();
  ctx.moveTo(-W * 0.78 + flex * 2, -H * 0.15);
  ctx.bezierCurveTo(
    -W * 1.0 + tw * 0.4 + flex * 2.5, -H * 0.05,
    -W * 1.1 + tw * 0.7 + flex * 3, -H * 0.65,
    -W * 1.28 + tw + flex * 3, -H * 0.95,
  );
  ctx.bezierCurveTo(
    -W * 1.05 + tw * 0.5 + flex * 2.5, -H * 0.2,
    -W * 0.98 + tw * 0.4 + flex * 2, H * 0.15,
    -W * 0.82 + flex * 2, 0,
  );
  ctx.bezierCurveTo(
    -W * 0.98 + tw * 0.4 + flex * 2, H * 0.25,
    -W * 1.05 + tw * 0.5 + flex * 2.5, H * 0.45,
    -W * 1.28 + tw + flex * 3, H * 0.85,
  );
  ctx.bezierCurveTo(
    -W * 1.1 + tw * 0.7 + flex * 3, H * 0.55,
    -W * 1.0 + tw * 0.4 + flex * 2.5, H * 0.15,
    -W * 0.78 + flex * 2, H * 0.12,
  );
  ctx.closePath();
  const tailGrad = ctx.createLinearGradient(-W * 0.8, 0, -W * 1.3 + tw, 0);
  tailGrad.addColorStop(0, `rgba(${fr}, ${fg}, ${fb}, ${alpha * 0.65})`);
  tailGrad.addColorStop(1, `rgba(${fr}, ${fg}, ${fb}, ${alpha * 0.2})`);
  ctx.fillStyle = tailGrad;
  ctx.fill();

  /* ── Body — organic bezier silhouette ── */
  const bodyGrad = ctx.createLinearGradient(0, -H, 0, H * 1.1);
  bodyGrad.addColorStop(0, `rgba(${fr}, ${fg}, ${fb}, ${alpha * 0.9})`);
  bodyGrad.addColorStop(0.4, `rgba(${fr}, ${fg}, ${fb}, ${alpha})`);
  bodyGrad.addColorStop(0.6, `rgba(${Math.min(255, fr + 35)}, ${Math.min(255, fg + 35)}, ${Math.min(255, fb + 25)}, ${alpha})`);
  bodyGrad.addColorStop(1, `rgba(${Math.min(255, fr + 60)}, ${Math.min(255, fg + 55)}, ${Math.min(255, fb + 45)}, ${alpha * 0.85})`);

  ctx.beginPath();
  ctx.moveTo(W * 0.88, 0);
  /* Top: snout → forehead → dorsal → peduncle */
  ctx.bezierCurveTo(
    W * 0.82, -H * 0.3,
    W * 0.58, -H * 0.78,
    W * 0.18, -H * 0.96 + flex * 0.3,
  );
  ctx.bezierCurveTo(
    -W * 0.12, -H * 0.98 + flex * 0.8,
    -W * 0.48, -H * 0.72 + flex * 1.2,
    -W * 0.72, -H * 0.25 + flex * 1.8,
  );
  /* Bottom: peduncle → belly → jaw */
  ctx.bezierCurveTo(
    -W * 0.48, H * 0.6 + flex * 1.2,
    -W * 0.12, H * 0.88 + flex * 0.6,
    W * 0.16, H * 0.82,
  );
  ctx.bezierCurveTo(W * 0.48, H * 0.72, W * 0.76, H * 0.38, W * 0.88, 0);
  ctx.closePath();
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  /* Subtle body outline */
  ctx.strokeStyle = `rgba(${Math.max(0, fr - 40)}, ${Math.max(0, fg - 40)}, ${Math.max(0, fb - 40)}, ${alpha * 0.12})`;
  ctx.lineWidth = 0.5;
  ctx.stroke();

  /* ── Scales shimmer ── */
  ctx.save();
  ctx.globalAlpha = alpha * 0.045;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 5; col++) {
      const sx = W * 0.42 - col * W * 0.2 + flex * row * 0.3;
      const sy = -H * 0.25 + row * H * 0.3;
      ctx.beginPath();
      ctx.arc(sx, sy, W * 0.065, 0, Math.PI, false);
      ctx.strokeStyle = "rgba(255,255,255,1)";
      ctx.lineWidth = 0.35;
      ctx.stroke();
    }
  }
  ctx.restore();

  /* ── Lateral line ── */
  ctx.beginPath();
  ctx.moveTo(W * 0.6, -H * 0.04);
  ctx.quadraticCurveTo(W * 0.05, -H * 0.06 + flex * 0.4, -W * 0.55, -H * 0.01 + flex * 1.4);
  ctx.strokeStyle = `rgba(${Math.max(0, fr - 25)}, ${Math.max(0, fg - 25)}, ${Math.max(0, fb - 25)}, ${alpha * 0.15})`;
  ctx.lineWidth = 0.45;
  ctx.stroke();

  /* ── Dorsal fin ── */
  ctx.beginPath();
  ctx.moveTo(W * 0.12, -H * 0.88 + flex * 0.3);
  ctx.bezierCurveTo(
    W * 0.0, -H * 1.5 + flex * 0.5,
    -W * 0.22, -H * 1.45 + flex * 0.8,
    -W * 0.38, -H * 0.78 + flex * 1.0,
  );
  ctx.bezierCurveTo(-W * 0.28, -H * 0.76, -W * 0.05, -H * 0.8, W * 0.12, -H * 0.88 + flex * 0.3);
  ctx.closePath();
  ctx.fillStyle = `rgba(${fr}, ${fg}, ${fb}, ${alpha * 0.4})`;
  ctx.fill();
  /* Fin rays */
  ctx.strokeStyle = `rgba(255,255,255, ${alpha * 0.06})`;
  ctx.lineWidth = 0.25;
  for (let i = 0; i < 4; i++) {
    const fx = W * 0.08 - i * W * 0.11;
    ctx.beginPath();
    ctx.moveTo(fx, -H * 0.86 + flex * (0.3 + i * 0.15));
    ctx.lineTo(fx - W * 0.03, -H * 1.25 + i * H * 0.08 + flex * (0.4 + i * 0.1));
    ctx.stroke();
  }

  /* ── Pectoral fin ── */
  const pf = finFlap * H * 0.25;
  ctx.beginPath();
  ctx.moveTo(W * 0.22, H * 0.18);
  ctx.bezierCurveTo(W * 0.12, H * 0.55 + pf, -W * 0.06, H * 0.65 + pf, -W * 0.16, H * 0.38 + pf * 0.5);
  ctx.bezierCurveTo(-W * 0.04, H * 0.3, W * 0.1, H * 0.2, W * 0.22, H * 0.18);
  ctx.closePath();
  ctx.fillStyle = `rgba(${fr}, ${fg}, ${fb}, ${alpha * 0.28})`;
  ctx.fill();

  /* ── Anal fin ── */
  ctx.beginPath();
  ctx.moveTo(-W * 0.32, H * 0.65 + flex);
  ctx.bezierCurveTo(-W * 0.42, H * 1.0 + flex, -W * 0.56, H * 0.92 + flex, -W * 0.6, H * 0.55 + flex);
  ctx.bezierCurveTo(-W * 0.5, H * 0.58, -W * 0.38, H * 0.6, -W * 0.32, H * 0.65 + flex);
  ctx.closePath();
  ctx.fillStyle = `rgba(${fr}, ${fg}, ${fb}, ${alpha * 0.3})`;
  ctx.fill();

  /* ── Gill slit ── */
  ctx.beginPath();
  ctx.moveTo(W * 0.4, -H * 0.32);
  ctx.quadraticCurveTo(W * 0.36, 0, W * 0.42, H * 0.28);
  ctx.strokeStyle = `rgba(${Math.max(0, fr - 45)}, ${Math.max(0, fg - 45)}, ${Math.max(0, fb - 45)}, ${alpha * 0.14})`;
  ctx.lineWidth = 0.6;
  ctx.stroke();

  /* ── Eye ── */
  const eyeR = W * 0.09;
  ctx.beginPath();
  ctx.arc(W * 0.58, -H * 0.22, eyeR, 0, TAU);
  ctx.fillStyle = `rgba(240,240,245,${alpha * 0.95})`;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(W * 0.6, -H * 0.22, eyeR * 0.6, 0, TAU);
  ctx.fillStyle = `rgba(${Math.max(0, fr - 55)},${Math.max(0, fg - 35)},${Math.max(0, fb - 15)},${alpha})`;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(W * 0.615, -H * 0.22, eyeR * 0.32, 0, TAU);
  ctx.fillStyle = `rgba(8,8,18,${alpha})`;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(W * 0.595, -H * 0.27, eyeR * 0.16, 0, TAU);
  ctx.fillStyle = `rgba(255,255,255,${alpha * 0.85})`;
  ctx.fill();

  /* ── Mouth ── */
  ctx.beginPath();
  ctx.moveTo(W * 0.86, 0);
  ctx.quadraticCurveTo(W * 0.8, H * 0.07, W * 0.68, H * 0.04);
  ctx.strokeStyle = `rgba(${Math.max(0, fr - 35)},${Math.max(0, fg - 35)},${Math.max(0, fb - 35)},${alpha * 0.2})`;
  ctx.lineWidth = 0.4;
  ctx.stroke();
}

/* ══════════════════════════════════════════════════════════════
   Main component
   ══════════════════════════════════════════════════════════════ */

export default function OceanFishEffect() {
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

    /* ─────────────── Wave system (8 layers) ─────────────── */
    const SURFACE_Y_RATIO = 0.54;
    const mkWaves = () => Array.from({ length: 8 }, (_, i) => ({
      amp: 5 + i * 4.5,
      freq: 0.002 + i * 0.0008,
      speed: 0.006 + i * 0.003,
      yOff: h * SURFACE_Y_RATIO + i * 30,
      alpha: 0.055 - i * 0.006,
      /* secondary harmonic */
      amp2: 2 + i * 2,
      freq2: 0.005 + i * 0.001,
      speed2: 0.004 + i * 0.002,
    }));
    let waves = mkWaves();

    /** Combined wave Y at x for frame t (top 3 layers) */
    function surfaceY(x: number, frame: number): number {
      let y = 0;
      for (let i = 0; i < 3; i++) {
        const wv = waves[i];
        y += Math.sin(x * wv.freq + frame * wv.speed) * wv.amp * 0.5
           + Math.sin(x * wv.freq2 + frame * wv.speed2 + i) * wv.amp2 * 0.4;
      }
      return waves[0].yOff + y / 3;
    }

    /* ──────────── Fish (4 with varied depth) ──────────── */
    const FISH_CONFIGS: { len: number; speed: number; depth: number; yBand: number }[] = [
      { len: 24, speed: 0.55, depth: 0.15, yBand: 0.58 },   // near surface
      { len: 20, speed: 0.7,  depth: 0.35, yBand: 0.66 },
      { len: 28, speed: 0.4,  depth: 0.6,  yBand: 0.75 },   // deeper
      { len: 18, speed: 0.85, depth: 0.8,  yBand: 0.82 },   // deepest
    ];
    const fishes: Fish[] = FISH_CONFIGS.map((cfg, i) => ({
      x: w * (0.1 + i * 0.23) + (Math.random() - 0.5) * w * 0.1,
      y: h * cfg.yBand,
      depth: cfg.depth,
      len: cfg.len,
      baseSpeed: cfg.speed,
      speed: cfg.speed,
      dir: (i % 2 === 0 ? 1 : -1) as 1 | -1,
      phase: i * Math.PI * 0.6 + Math.random() * Math.PI,
      swimTimer: 0,
      bodyFlex: 0,
      tailFreq: 0.07 + i * 0.012,
      finPhase: i * 1.5,
      turnTimer: 400 + Math.floor(Math.random() * 600),
      driftVy: 0,
      jumping: false,
      jumpVy: 0,
      jumpY: 0,
      jumpRot: 0,
      jumpCooldown: 500 + Math.floor(Math.random() * 700),
      splashAlpha: 0,
      splashX: 0,
    }));

    /* ──────────── Bubbles ──────────── */
    const bubbles: Bubble[] = [];
    function spawnBubble(bx?: number, by?: number) {
      if (bubbles.length > 30) return;
      bubbles.push({
        x: bx ?? Math.random() * w,
        y: by ?? h + 4,
        r: 0.8 + Math.random() * 2.5,
        speed: 0.25 + Math.random() * 0.7,
        alpha: 0.12 + Math.random() * 0.18,
        wobble: Math.random() * TAU,
      });
    }

    /* ──────────── Ripples ──────────── */
    const ripples: Ripple[] = [];
    function spawnRipple(rx: number, ry: number, maxR?: number) {
      ripples.push({ x: rx, y: ry, radius: 2, maxRadius: maxR ?? 25 + Math.random() * 20, alpha: 0.25 });
    }

    /* ──────────── Foam particles ──────────── */
    const foam: FoamParticle[] = [];
    function spawnFoam(fx: number, fy: number, count: number) {
      for (let i = 0; i < count; i++) {
        foam.push({
          x: fx + (Math.random() - 0.5) * 20,
          y: fy + (Math.random() - 0.5) * 4,
          r: 0.8 + Math.random() * 2,
          alpha: 0.3 + Math.random() * 0.25,
          vx: (Math.random() - 0.5) * 0.6,
          life: 80 + Math.random() * 120,
        });
      }
    }

    /* ──────────── Droplets ──────────── */
    const droplets: Droplet[] = [];
    function spawnSplash(sx: number, sy: number) {
      const n = 5 + Math.floor(Math.random() * 5);
      for (let i = 0; i < n; i++) {
        const a = -Math.PI * 0.2 - Math.random() * Math.PI * 0.6;
        const spd = 1.5 + Math.random() * 2.5;
        droplets.push({
          x: sx + (Math.random() - 0.5) * 8,
          y: sy,
          vx: Math.cos(a) * spd * (Math.random() > 0.5 ? 1 : -1),
          vy: Math.sin(a) * spd - 0.8,
          r: 0.8 + Math.random() * 1.2,
          alpha: 0.45 + Math.random() * 0.25,
        });
      }
    }

    /* ──────────── Specular shimmer points ──────────── */
    interface Shimmer { x: number; phase: number; speed: number; size: number }
    const shimmers: Shimmer[] = Array.from({ length: 18 }, () => ({
      x: Math.random() * w,
      phase: Math.random() * TAU,
      speed: 0.01 + Math.random() * 0.02,
      size: 1 + Math.random() * 2,
    }));

    let animId: number;
    let t = 0;

    /* ═══════════════════ DRAW LOOP ═══════════════════ */
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      t++;

      /* Fixed realistic ocean colors */
      const aR = C_R, aG = C_G, aB = C_B;  // caustic/light color
      const wR = W_R, wG = W_G, wB = W_B;  // wave color

      /* ──── 1. Depth gradient (shallow → deep) ──── */
      const depthGrad = ctx.createLinearGradient(0, h * SURFACE_Y_RATIO - 10, 0, h);
      depthGrad.addColorStop(0, `rgba(${D_R}, ${D_G}, ${D_B}, 0)`);
      depthGrad.addColorStop(0.15, `rgba(${lerp(D_R, 15, 0.2)}, ${lerp(D_G, 55, 0.2)}, ${lerp(D_B, 90, 0.2)}, 0.05)`);
      depthGrad.addColorStop(0.5, `rgba(${lerp(D_R, 8, 0.35)}, ${lerp(D_G, 40, 0.35)}, ${lerp(D_B, 75, 0.35)}, 0.09)`);
      depthGrad.addColorStop(1, `rgba(${lerp(D_R, 5, 0.5)}, ${lerp(D_G, 20, 0.5)}, ${lerp(D_B, 50, 0.5)}, 0.15)`);
      ctx.fillStyle = depthGrad;
      ctx.fillRect(0, h * SURFACE_Y_RATIO - 10, w, h - h * SURFACE_Y_RATIO + 10);

      /* ──── 2. Caustic light beams ──── */
      for (let i = 0; i < 5; i++) {
        const rx = w * 0.12 + i * w * 0.2 + Math.sin(t * 0.005 + i * 1.8) * 55;
        const ry = h * SURFACE_Y_RATIO;
        const beamW = 18 + Math.sin(t * 0.008 + i) * 6;
        const rayGrad = ctx.createLinearGradient(rx, ry, rx + 10, h);
        rayGrad.addColorStop(0, `rgba(${aR}, ${aG}, ${aB}, ${0.02 + Math.sin(t * 0.01 + i * 2) * 0.008})`);
        rayGrad.addColorStop(0.5, `rgba(${aR}, ${aG}, ${aB}, 0.008)`);
        rayGrad.addColorStop(1, `rgba(${aR}, ${aG}, ${aB}, 0)`);
        ctx.beginPath();
        ctx.moveTo(rx - beamW, ry);
        ctx.lineTo(rx + beamW, ry);
        ctx.lineTo(rx + beamW * 2.5 + Math.sin(t * 0.007 + i) * 25, h);
        ctx.lineTo(rx - beamW * 1.5 + Math.sin(t * 0.007 + i) * 25, h);
        ctx.closePath();
        ctx.fillStyle = rayGrad;
        ctx.fill();
      }

      /* ──── 3. Underwater caustic pattern (moving light mesh) ──── */
      ctx.save();
      ctx.globalAlpha = 0.018;
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 12; i++) {
        const cx = (w * 0.08 * i + t * 0.3 + Math.sin(t * 0.004 + i) * 40) % (w + 80) - 40;
        const cy = h * SURFACE_Y_RATIO + 60 + i * 35 + Math.sin(t * 0.006 + i * 1.5) * 20;
        const cr = 30 + Math.sin(t * 0.009 + i * 2.3) * 10;
        const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
        cg.addColorStop(0, `rgba(${aR}, ${aG}, ${aB}, 0.6)`);
        cg.addColorStop(1, `rgba(${aR}, ${aG}, ${aB}, 0)`);
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, TAU);
        ctx.fill();
      }
      ctx.restore();

      /* ──── 4. Waves (8 layers with dual harmonics) ──── */
      for (let wi = 0; wi < waves.length; wi++) {
        const wv = waves[wi];
        ctx.beginPath();
        for (let x = 0; x <= w; x += 3) {
          const y = wv.yOff
            + Math.sin(x * wv.freq + t * wv.speed) * wv.amp
            + Math.sin(x * wv.freq2 + t * wv.speed2 + wi * 0.5) * wv.amp2
            + Math.sin(x * 0.008 + t * 0.003 + wi) * 2; // micro-ripple
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fillStyle = `rgba(${wR}, ${wG}, ${wB}, ${wv.alpha})`;
        ctx.fill();

        /* Foam / whitecap on top 2 wave layers */
        if (wi < 2) {
          ctx.save();
          ctx.globalAlpha = 0.04 - wi * 0.015;
          for (let x = 0; x < w; x += 6) {
            const y = wv.yOff
              + Math.sin(x * wv.freq + t * wv.speed) * wv.amp
              + Math.sin(x * wv.freq2 + t * wv.speed2 + wi * 0.5) * wv.amp2;
            const slope = Math.cos(x * wv.freq + t * wv.speed) * wv.amp * wv.freq;
            if (Math.abs(slope) > 0.015) {
              ctx.beginPath();
              ctx.arc(x, y - 1, 1.5 + Math.random() * 1.5, 0, TAU);
              ctx.fillStyle = "rgba(220, 235, 250, 1)";
              ctx.fill();
            }
          }
          ctx.restore();
        }
      }

      /* ──── 5. Specular highlights / shimmer ──── */
      for (const sh of shimmers) {
        const sy = surfaceY(sh.x, t);
        const intensity = (Math.sin(t * sh.speed + sh.phase) + 1) * 0.5;
        if (intensity > 0.6) {
          ctx.beginPath();
          ctx.arc(sh.x, sy - 2, sh.size * intensity, 0, TAU);
          ctx.fillStyle = `rgba(255, 255, 255, ${(intensity - 0.6) * 0.15})`;
          ctx.fill();
        }
        sh.x += Math.sin(t * 0.002 + sh.phase) * 0.15;
        if (sh.x < -10) sh.x = w + 10;
        if (sh.x > w + 10) sh.x = -10;
      }

      /* ──── 6. Fish (sorted by depth — deeper first) ──── */
      const sortedFish = [...fishes].sort((a, b) => b.depth - a.depth);

      for (const f of sortedFish) {
        f.swimTimer++;

        /* Natural speed variation */
        f.speed = f.baseSpeed + Math.sin(f.swimTimer * 0.003 + f.phase) * f.baseSpeed * 0.25;

        /* Gentle vertical drift */
        f.driftVy += (Math.random() - 0.5) * 0.005;
        f.driftVy = clamp(f.driftVy, -0.15, 0.15);
        f.driftVy *= 0.995; // dampen

        /* Occasional direction change */
        f.turnTimer--;
        if (f.turnTimer <= 0 && !f.jumping && Math.random() < 0.08) {
          f.dir = (f.dir * -1) as 1 | -1;
          f.turnTimer = 500 + Math.floor(Math.random() * 800);
        }

        /* Body flex — sinusoidal spine undulation */
        f.bodyFlex = Math.sin(f.swimTimer * 0.045 + f.phase) * (1.2 + f.speed * 0.3);

        const swimY = f.y + Math.sin(f.swimTimer * 0.012 + f.phase) * (10 + f.depth * 8) * 0.15;
        const sY = surfaceY(f.x, t);

        /* ── Jump logic (only near-surface fish) ── */
        f.jumpCooldown--;
        if (f.depth < 0.4 && !f.jumping && f.jumpCooldown <= 0 && Math.random() < 0.003) {
          f.jumping = true;
          f.jumpVy = -(3.0 + Math.random() * 2);
          f.jumpY = 0;
          f.splashX = f.x;
          f.splashAlpha = 0.55;
          spawnSplash(f.x, sY);
          spawnRipple(f.x, sY, 35);
          spawnFoam(f.x, sY, 4);
        }
        if (f.jumping) {
          f.jumpVy += GRAVITY;
          f.jumpY += f.jumpVy;
          f.jumpRot = Math.atan2(f.jumpVy, f.speed * 3) * f.dir;
          if (f.jumpY >= 0) {
            f.jumpY = 0;
            f.jumpVy = 0;
            f.jumping = false;
            f.jumpRot = 0;
            f.jumpCooldown = 600 + Math.floor(Math.random() * 800);
            f.splashX = f.x;
            f.splashAlpha = 0.45;
            spawnSplash(f.x, sY);
            spawnRipple(f.x, sY, 30);
            spawnFoam(f.x, sY, 3);
          }
        }

        /* Splash ring */
        if (f.splashAlpha > 0) {
          const splR = 10 + (0.55 - f.splashAlpha) * 35;
          ctx.beginPath();
          ctx.ellipse(f.splashX, sY, splR, splR * 0.2, 0, 0, TAU);
          ctx.strokeStyle = `rgba(200, 230, 255, ${f.splashAlpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
          f.splashAlpha -= 0.008;
        }

        /* Surface ripple when fish is near surface */
        if (!f.jumping && f.depth < 0.3 && t % 90 === 0) {
          spawnRipple(f.x + (Math.random() - 0.5) * f.len, sY, 15);
        }

        const renderY = f.jumping ? sY + f.jumpY : swimY;
        const tailWag = Math.sin(f.swimTimer * f.tailFreq + f.phase) * (f.jumping ? 0.7 : 0.32 + f.speed * 0.15);
        const finFlap = Math.sin(f.swimTimer * 0.04 + f.finPhase);
        const isUnderwater = !f.jumping;

        /* ── Shadow beneath fish ── */
        if (isUnderwater) {
          const shadowY = renderY + f.len * 0.5 + f.depth * 20;
          const shadowAlpha = (0.06 - f.depth * 0.03);
          ctx.beginPath();
          ctx.ellipse(f.x, shadowY, f.len * 0.7, f.len * 0.12, 0, 0, TAU);
          ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
          ctx.fill();
        }

        /* ── Draw fish ── */
        const depthScale = 1 - f.depth * 0.15;
        const depthAlpha = 0.85 - f.depth * 0.25;

        ctx.save();
        ctx.translate(f.x, renderY);
        ctx.rotate(f.jumpRot);
        ctx.scale(f.dir * depthScale, depthScale);

        /* Use fish's own natural color from palette */
        const fIdx = fishes.indexOf(f) % FISH_PALETTE.length;
        const [fishR, fishG, fishB] = FISH_PALETTE[fIdx];

        drawRealisticFish(
          ctx,
          f.len, depthAlpha,
          f.bodyFlex, tailWag, finFlap,
          fishR, fishG, fishB,
          f.depth,
          isUnderwater,
        );

        ctx.restore();

        /* ── Occasional fish bubble ── */
        if (isUnderwater && t % 120 === Math.floor(f.phase * 10) % 120) {
          spawnBubble(f.x + f.dir * f.len * 0.5, renderY - 3);
        }

        /* Movement */
        f.x += f.speed * f.dir;
        if (!f.jumping) {
          f.y += f.driftVy;
          const minY = h * (SURFACE_Y_RATIO + 0.04 + f.depth * 0.08);
          const maxY = h * (SURFACE_Y_RATIO + 0.12 + f.depth * 0.28);
          f.y = clamp(f.y, minY, maxY);
        }

        /* Wrap */
        if (f.dir === 1 && f.x > w + f.len * 2) { f.x = -f.len * 2; }
        if (f.dir === -1 && f.x < -f.len * 2) { f.x = w + f.len * 2; }
      }

      /* ──── 7. Ripples ──── */
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        ctx.beginPath();
        ctx.ellipse(rp.x, rp.y, rp.radius, rp.radius * 0.2, 0, 0, TAU);
        ctx.strokeStyle = `rgba(200, 230, 255, ${rp.alpha})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
        rp.radius += 0.5;
        rp.alpha -= 0.003;
        if (rp.radius >= rp.maxRadius || rp.alpha <= 0) ripples.splice(i, 1);
      }

      /* ──── 8. Foam ──── */
      for (let i = foam.length - 1; i >= 0; i--) {
        const fp = foam[i];
        ctx.beginPath();
        ctx.arc(fp.x, fp.y, fp.r, 0, TAU);
        ctx.fillStyle = `rgba(220, 235, 250, ${fp.alpha})`;
        ctx.fill();
        fp.x += fp.vx;
        fp.y += Math.sin(t * 0.02 + fp.x * 0.01) * 0.15;
        fp.life--;
        fp.alpha -= 0.002;
        if (fp.life <= 0 || fp.alpha <= 0) foam.splice(i, 1);
      }

      /* ──── 9. Droplets ──── */
      for (let i = droplets.length - 1; i >= 0; i--) {
        const d = droplets[i];
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, TAU);
        ctx.fillStyle = `rgba(200, 230, 255, ${d.alpha})`;
        ctx.fill();
        d.vy += GRAVITY * 0.55;
        d.x += d.vx;
        d.y += d.vy;
        d.alpha -= 0.007;
        if (d.alpha <= 0 || d.y > h) droplets.splice(i, 1);
      }

      /* ──── 10. Bubbles ──── */
      if (t % 16 === 0) spawnBubble();
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        /* Bubble body */
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, TAU);
        ctx.strokeStyle = `rgba(160, 210, 255, ${b.alpha})`;
        ctx.lineWidth = 0.4;
        ctx.stroke();
        /* Highlight */
        ctx.beginPath();
        ctx.arc(b.x - b.r * 0.28, b.y - b.r * 0.28, b.r * 0.22, 0, TAU);
        ctx.fillStyle = `rgba(230, 245, 255, ${b.alpha * 0.55})`;
        ctx.fill();
        b.y -= b.speed;
        b.x += Math.sin(b.wobble + t * 0.018) * 0.25;
        b.alpha -= 0.0008;
        /* Pop near surface */
        const bSurface = surfaceY(b.x, t);
        if (b.y < bSurface + 5) {
          spawnRipple(b.x, bSurface, 8);
          bubbles.splice(i, 1);
        } else if (b.alpha <= 0) {
          bubbles.splice(i, 1);
        }
      }

      /* ──── 11. Surface reflection line (subtle bright edge at waterline) ──── */
      ctx.save();
      ctx.globalAlpha = 0.035;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 3) {
        const y = surfaceY(x, t);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(255, 255, 255, 1)`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();

      animId = requestAnimationFrame(draw);
    };

    draw();

    const onResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      waves = mkWaves();
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
