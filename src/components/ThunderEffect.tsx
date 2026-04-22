"use client";

import { useRef, useEffect } from "react";
import { updateWeather } from "@/lib/weatherState";

/* ══════════════════════════════════════════════════════════════
   Types
   ══════════════════════════════════════════════════════════════ */

interface LightningBolt {
  segments: { x1: number; y1: number; x2: number; y2: number; w: number }[];
  alpha: number;
  maxAlpha: number;
  life: number;
  maxLife: number;
  distancePx: number;
  /** Intensity tier 0–2: subtle → medium → intense */
  intensity: number;
  /** Origin X for radial glow */
  originX: number;
  originY: number;
}

/* ══════════════════════════════════════════════════════════════
   Lightning generator — recursive midpoint displacement
   ══════════════════════════════════════════════════════════════ */

function buildBolt(
  x1: number, y1: number,
  x2: number, y2: number,
  depth: number,
  segments: LightningBolt["segments"],
  width: number,
  branchProb: number,
) {
  if (depth === 0 || Math.hypot(x2 - x1, y2 - y1) < 4) {
    segments.push({ x1, y1, x2, y2, w: width });
    return;
  }

  const dist = Math.hypot(x2 - x1, y2 - y1);
  const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * dist * 0.45;
  const my = (y1 + y2) / 2 + (Math.random() - 0.5) * 6;

  buildBolt(x1, y1, mx, my, depth - 1, segments, width, branchProb);
  buildBolt(mx, my, x2, y2, depth - 1, segments, width, branchProb);

  if (depth >= 3 && Math.random() < branchProb) {
    const branchAngle = (Math.random() - 0.5) * 0.9;
    const branchLen = dist * (0.3 + Math.random() * 0.4);
    const angle = Math.atan2(y2 - y1, x2 - x1) + branchAngle;
    buildBolt(
      mx, my,
      mx + Math.cos(angle) * branchLen,
      my + Math.sin(angle) * branchLen,
      depth - 2, segments, width * 0.55, branchProb * 0.5,
    );
  }
}

function createBolt(w: number, h: number): LightningBolt {
  const sx = w * (0.1 + Math.random() * 0.8);
  const sy = h * (0.02 + Math.random() * 0.18);
  const ex = sx + (Math.random() - 0.5) * w * 0.5;
  const ey = h * (0.55 + Math.random() * 0.42);

  const segments: LightningBolt["segments"] = [];
  const trunkWidth = 1.4 + Math.random() * 1.4;
  buildBolt(sx, sy, ex, ey, 5, segments, trunkWidth, 0.35);

  const maxLife = 6 + Math.random() * 10;
  const intensity = Math.random() < 0.2 ? 2 : Math.random() < 0.5 ? 1 : 0;

  return {
    segments,
    alpha: 0,
    maxAlpha: 0.85 + Math.random() * 0.15,
    life: maxLife,
    maxLife,
    distancePx: Math.hypot(ex - sx, ey - sy),
    intensity,
    originX: sx,
    originY: sy,
  };
}

/* ══════════════════════════════════════════════════════════════
   Thunder Sound — uses real MP3 file + synthesised rumble blend
   ══════════════════════════════════════════════════════════════ */

let audioCtx: AudioContext | null = null;
let thunderBuffer: AudioBuffer | null = null;
let bufferLoading = false;

function getAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch { return null; }
  }
  return audioCtx;
}

async function loadThunderBuffer(ac: AudioContext) {
  if (thunderBuffer || bufferLoading) return;
  bufferLoading = true;
  try {
    const resp = await fetch("/thunder.mp3");
    if (!resp.ok) return;
    const arrayBuf = await resp.arrayBuffer();
    thunderBuffer = await ac.decodeAudioData(arrayBuf);
  } catch {
    /* fallback to synth thunder */
  } finally {
    bufferLoading = false;
  }
}

function playThunder(delayMs: number, distancePx: number, viewportW: number) {
  const ac = getAudioCtx();
  if (!ac) return;

  const dist = Math.min(1, distancePx / (viewportW * 1.4));
  const scheduledAt = ac.currentTime + delayMs / 1000;

  /* ── Try real MP3 first ── */
  if (thunderBuffer) {
    const src = ac.createBufferSource();
    src.buffer = thunderBuffer;
    src.playbackRate.value = 0.8 + Math.random() * 0.4; // pitch variation

    const lpf = ac.createBiquadFilter();
    lpf.type = "lowpass";
    lpf.frequency.value = dist > 0.5 ? 200 + (1 - dist) * 400 : 600;
    lpf.Q.value = 0.5;

    const gainNode = ac.createGain();
    const vol = dist < 0.3 ? 0.7 + Math.random() * 0.15 : 0.25 + (1 - dist) * 0.35;
    gainNode.gain.setValueAtTime(0, scheduledAt);
    gainNode.gain.linearRampToValueAtTime(vol, scheduledAt + 0.05);

    src.connect(lpf).connect(gainNode).connect(ac.destination);
    src.start(scheduledAt);
    return;
  }

  /* ── Fallback: synthesised rumble ── */
  const bufLen = Math.min(ac.sampleRate * 2, Math.floor(ac.sampleRate * (1.2 + dist * 2.2 + Math.random() * 0.8)));
  const buffer = ac.createBuffer(1, bufLen, ac.sampleRate);
  const data = buffer.getChannelData(0);

  let lastOut = 0;
  for (let i = 0; i < bufLen; i++) {
    const white = Math.random() * 2 - 1;
    lastOut = (lastOut + 0.02 * white) / 1.02;
    const env = i < 400
      ? i / 400
      : Math.exp(-((i - 400) / (bufLen * (0.35 + dist * 0.45))));
    data[i] = lastOut * 2.5 * env;
  }

  const src = ac.createBufferSource();
  src.buffer = buffer;

  const lpf = ac.createBiquadFilter();
  lpf.type = "lowpass";
  lpf.frequency.value = dist > 0.5 ? 180 + (1 - dist) * 300 : 500 + dist * 400;
  lpf.Q.value = 0.6;

  const eq = ac.createBiquadFilter();
  eq.type = "peaking";
  eq.frequency.value = 60;
  eq.gain.value = dist < 0.4 ? 6 : 2;
  eq.Q.value = 0.8;

  const gainNode = ac.createGain();
  const vol = dist < 0.3 ? 0.9 + Math.random() * 0.1 : 0.4 + (1 - dist) * 0.5;
  gainNode.gain.setValueAtTime(0, scheduledAt);
  gainNode.gain.linearRampToValueAtTime(vol, scheduledAt + 0.04);
  gainNode.gain.exponentialRampToValueAtTime(0.001, scheduledAt + (bufLen / ac.sampleRate) * 0.95);

  src.connect(lpf).connect(eq).connect(gainNode).connect(ac.destination);
  src.start(scheduledAt);
}

/* ══════════════════════════════════════════════════════════════
   Component
   ══════════════════════════════════════════════════════════════ */

export default function ThunderEffect() {
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

    // Lazy-load thunder audio
    const ac = getAudioCtx();
    if (ac) loadThunderBuffer(ac);

    const bolts: LightningBolt[] = [];
    let flashAlpha = 0;
    let nextStrike = 60 + Math.random() * 180;
    let flashCount = 0;
    let flashRepeat = 0;
    let flashDelay = 0;

    /* Camera shake state */
    let shakeX = 0;
    let shakeY = 0;
    let shakeIntensity = 0;

    /* Light scattering glow spots (persist briefly after flash) */
    const glowSpots: { x: number; y: number; r: number; alpha: number; decay: number }[] = [];

    let animId: number;
    let lastTime = performance.now();

    updateWeather({ isThundering: true });

    const draw = (now: number) => {
      const dt = Math.min((now - lastTime) / 16.67, 3);
      lastTime = now;

      ctx.clearRect(0, 0, w, h);

      /* ── Camera shake ── */
      if (shakeIntensity > 0.01) {
        shakeX = (Math.random() - 0.5) * shakeIntensity * 6;
        shakeY = (Math.random() - 0.5) * shakeIntensity * 4;
        shakeIntensity *= Math.pow(0.92, dt);
        ctx.save();
        ctx.translate(shakeX, shakeY);
        updateWeather({ cameraShake: shakeIntensity });
      } else {
        shakeIntensity = 0;
        updateWeather({ cameraShake: 0 });
      }

      /* ── Strike scheduler ── */
      nextStrike -= dt;

      if (nextStrike <= 0) {
        flashRepeat = 1 + Math.floor(Math.random() * 2.5);
        flashCount = 0;
        flashDelay = 0;
        // Vary timing: 3–13s between strikes (natural randomness)
        nextStrike = 180 + Math.random() * 600 + Math.random() * 200;
      }

      if (flashRepeat > 0) {
        flashDelay -= dt;
        if (flashDelay <= 0) {
          const bolt = createBolt(w, h);
          bolts.push(bolt);
          flashAlpha = bolt.maxAlpha;

          /* Camera shake based on intensity */
          const shakeForce = bolt.intensity === 2 ? 1.0 : bolt.intensity === 1 ? 0.5 : 0.2;
          shakeIntensity = Math.max(shakeIntensity, shakeForce);

          /* Light scattering glow at bolt origin */
          glowSpots.push({
            x: bolt.originX,
            y: bolt.originY,
            r: 80 + bolt.intensity * 60 + Math.random() * 40,
            alpha: 0.5 + bolt.intensity * 0.2,
            decay: 0.03 + bolt.intensity * 0.01,
          });

          /* Sound with distance-based delay */
          const soundDelayMs = 200 + (bolt.distancePx / w) * 1800 + Math.random() * 300;
          playThunder(soundDelayMs, bolt.distancePx, w);

          flashRepeat--;
          flashDelay = flashRepeat > 0 ? 3 + Math.random() * 8 : 0;
          flashCount++;
        }
      }

      /* ── Update shared weather state ── */
      updateWeather({
        flashIntensity: flashAlpha,
        stormIntensity: Math.min(1, flashAlpha * 1.2 + (bolts.length > 0 ? 0.3 : 0)),
      });

      /* ── Scene illumination flash ── */
      if (flashAlpha > 0) {
        // Multi-layer radial flash for realism
        const flashGrad = ctx.createRadialGradient(w / 2, 0, 0, w / 2, h / 3, Math.max(w, h) * 1.1);
        flashGrad.addColorStop(0, `rgba(220,235,255,${flashAlpha * 0.6})`);
        flashGrad.addColorStop(0.25, `rgba(200,220,255,${flashAlpha * 0.35})`);
        flashGrad.addColorStop(0.5, `rgba(180,200,255,${flashAlpha * 0.18})`);
        flashGrad.addColorStop(1, `rgba(140,165,220,0)`);
        ctx.fillStyle = flashGrad;
        ctx.fillRect(0, 0, w, h);

        // Ground-level reflection bounce
        const groundGrad = ctx.createLinearGradient(0, h * 0.7, 0, h);
        groundGrad.addColorStop(0, `rgba(180,200,240,0)`);
        groundGrad.addColorStop(1, `rgba(180,200,240,${flashAlpha * 0.12})`);
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, h * 0.7, w, h * 0.3);

        flashAlpha = Math.max(0, flashAlpha - 0.08 * dt);
      }

      /* ── Light scattering glow spots ── */
      for (let i = glowSpots.length - 1; i >= 0; i--) {
        const gs = glowSpots[i];
        const grd = ctx.createRadialGradient(gs.x, gs.y, 0, gs.x, gs.y, gs.r);
        grd.addColorStop(0, `rgba(200,220,255,${gs.alpha * 0.25})`);
        grd.addColorStop(0.5, `rgba(180,200,255,${gs.alpha * 0.08})`);
        grd.addColorStop(1, `rgba(160,180,240,0)`);
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(gs.x, gs.y, gs.r, 0, Math.PI * 2);
        ctx.fill();
        gs.alpha -= gs.decay * dt;
        gs.r += 1.5 * dt;
        if (gs.alpha <= 0) glowSpots.splice(i, 1);
      }

      /* ── Draw bolts ── */
      for (let bi = bolts.length - 1; bi >= 0; bi--) {
        const bolt = bolts[bi];
        bolt.life -= dt;

        const t = 1 - bolt.life / bolt.maxLife;
        bolt.alpha = t < 0.15
          ? (t / 0.15) * bolt.maxAlpha
          : bolt.maxAlpha * Math.pow(1 - (t - 0.15) / 0.85, 1.8);

        if (bolt.life <= 0) { bolts.splice(bi, 1); continue; }

        // Intensity-based glow multiplier
        const glowMul = 1 + bolt.intensity * 0.6;

        /* Build a single path for all segments at each width, then stroke once.
           This avoids per-segment beginPath/stroke calls with shadowBlur. */
        const wideLw = 5 * glowMul;
        const midLw = 2.5 * glowMul;

        /* Wide glow pass — no shadowBlur, just thick translucent stroke */
        ctx.beginPath();
        for (const seg of bolt.segments) {
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
        }
        ctx.strokeStyle = `rgba(160,195,255,${bolt.alpha * 0.3})`;
        ctx.lineWidth = wideLw;
        ctx.lineCap = "round";
        ctx.stroke();

        /* Medium glow — single batched stroke */
        ctx.beginPath();
        for (const seg of bolt.segments) {
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
        }
        ctx.strokeStyle = `rgba(190,215,255,${bolt.alpha * 0.5})`;
        ctx.lineWidth = midLw;
        ctx.stroke();

        /* Core bright pass — single batched stroke */
        ctx.beginPath();
        for (const seg of bolt.segments) {
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
        }
        ctx.strokeStyle = `rgba(240,248,255,${bolt.alpha})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      /* ── Storm cloud overlay (darkens sky between flashes) ── */
      const cloudAlpha = bolts.length > 0 || flashAlpha > 0 ? 0 : 0.02;
      if (cloudAlpha > 0) {
        ctx.fillStyle = `rgba(15,20,35,${cloudAlpha})`;
        ctx.fillRect(0, 0, w, h * 0.3);
      }

      if (shakeIntensity > 0.01) {
        ctx.restore();
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

    const resumeAudio = () => {
      const ac = getAudioCtx();
      if (ac && ac.state === "suspended") ac.resume();
    };
    window.addEventListener("click", resumeAudio, { once: true });
    window.addEventListener("touchstart", resumeAudio, { once: true });
    window.addEventListener("keydown", resumeAudio, { once: true });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      updateWeather({ isThundering: false, flashIntensity: 0, stormIntensity: 0, cameraShake: 0 });
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
