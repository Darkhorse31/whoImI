"use client";

import { useRef, useEffect } from "react";

/* ══════════════════════════════════════════════════════════════
   Types
   ══════════════════════════════════════════════════════════════ */

interface LightningBolt {
  /** Screen-space points of the main trunk + branches */
  segments: { x1: number; y1: number; x2: number; y2: number; w: number }[];
  alpha: number;
  /** initial full alpha when born */
  maxAlpha: number;
  /** frames until it fades out */
  life: number;
  maxLife: number;
  /** horizontal distance travelled — used for sound delay */
  distancePx: number;
}

/* ══════════════════════════════════════════════════════════════
   Lightning generator
   (recursive midpoint displacement for natural branching)
   ══════════════════════════════════════════════════════════════ */

function buildBolt(
  x1: number, y1: number,
  x2: number, y2: number,
  depth: number,
  segments: LightningBolt["segments"],
  width: number,
  branchProb: number
) {
  if (depth === 0 || Math.hypot(x2 - x1, y2 - y1) < 4) {
    segments.push({ x1, y1, x2, y2, w: width });
    return;
  }

  const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * (Math.hypot(x2 - x1, y2 - y1) * 0.45);
  const my = (y1 + y2) / 2 + (Math.random() - 0.5) * 6;

  buildBolt(x1, y1, mx, my, depth - 1, segments, width, branchProb);
  buildBolt(mx, my, x2, y2, depth - 1, segments, width, branchProb);

  /* Spawn a branch at the midpoint */
  if (depth >= 3 && Math.random() < branchProb) {
    const branchAngle = (Math.random() - 0.5) * 0.9;
    const branchLen   = Math.hypot(x2 - x1, y2 - y1) * (0.3 + Math.random() * 0.4);
    const angle       = Math.atan2(y2 - y1, x2 - x1) + branchAngle;
    buildBolt(
      mx, my,
      mx + Math.cos(angle) * branchLen,
      my + Math.sin(angle) * branchLen,
      depth - 2,
      segments,
      width * 0.55,
      branchProb * 0.5
    );
  }
}

function createBolt(w: number, h: number): LightningBolt {
  /* Random origin near top portion, always visible */
  const sx = w * (0.1 + Math.random() * 0.8);
  const sy = h * (0.02 + Math.random() * 0.18);

  /* End somewhere in the lower half — occasionally off-screen */
  const ex = sx + (Math.random() - 0.5) * w * 0.5;
  const ey = h * (0.55 + Math.random() * 0.42);

  const segments: LightningBolt["segments"] = [];
  const trunkWidth = 1.4 + Math.random() * 1.4;
  buildBolt(sx, sy, ex, ey, 7, segments, trunkWidth, 0.45);

  const maxLife = 6 + Math.random() * 10;
  return {
    segments,
    alpha: 0,
    maxAlpha: 0.85 + Math.random() * 0.15,
    life: maxLife,
    maxLife,
    distancePx: Math.hypot(ex - sx, ey - sy),
  };
}

/* ══════════════════════════════════════════════════════════════
   Thunder Sound (Web Audio API)
   ══════════════════════════════════════════════════════════════ */

let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

function playThunder(delayMs: number, distancePx: number, viewportW: number) {
  const ac = getAudioCtx();
  if (!ac) return;

  /* Normalise distance: 0 = very close, 1 = far */
  const dist = Math.min(1, distancePx / (viewportW * 1.4));

  const scheduledAt = ac.currentTime + delayMs / 1000;

  /* Brown-noise burst via AudioBufferSourceNode */
  const bufLen = Math.floor(ac.sampleRate * (1.2 + dist * 2.2 + Math.random() * 0.8));
  const buffer = ac.createBuffer(1, bufLen, ac.sampleRate);
  const data   = buffer.getChannelData(0);

  /* Generate pink-ish noise with exponential decay envelope */
  let lastOut = 0;
  for (let i = 0; i < bufLen; i++) {
    const white = Math.random() * 2 - 1;
    lastOut = (lastOut + 0.02 * white) / 1.02;
    /* Envelope: sharp attack, long rumble decay */
    const env = i < 400
      ? i / 400
      : Math.exp(-((i - 400) / (bufLen * (0.35 + dist * 0.45))));
    data[i] = lastOut * 2.5 * env;
  }

  const src = ac.createBufferSource();
  src.buffer = buffer;

  /* Low-pass filter for distant rumble */
  const lpf = ac.createBiquadFilter();
  lpf.type            = "lowpass";
  lpf.frequency.value = dist > 0.5 ? 180 + (1 - dist) * 300 : 500 + dist * 400;
  lpf.Q.value         = 0.6;

  /* Slight sub-bass boost */
  const eq = ac.createBiquadFilter();
  eq.type            = "peaking";
  eq.frequency.value = 60;
  eq.gain.value      = dist < 0.4 ? 6 : 2;
  eq.Q.value         = 0.8;

  /* Gain */
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

    const bolts: LightningBolt[] = [];

    /* Screen flash state */
    let flashAlpha = 0;

    /* Next strike timer (in frames) */
    let nextStrike = 60 + Math.random() * 180;

    /* Whether a multi-flash sequence is in progress */
    let flashCount  = 0;
    let flashRepeat = 0;
    let flashDelay  = 0;

    let animId: number;
    let lastTime = performance.now();

    const draw = (now: number) => {
      const dt = Math.min((now - lastTime) / 16.67, 3);
      lastTime = now;

      ctx.clearRect(0, 0, w, h);

      /* ── Strike scheduler ── */
      nextStrike -= dt;

      if (nextStrike <= 0) {
        /* Spawn 1–3 bolts in quick succession */
        flashRepeat = 1 + Math.floor(Math.random() * 2.5);
        flashCount  = 0;
        flashDelay  = 0;
        nextStrike  = 200 + Math.random() * 600;   // 3–10s until next event
      }

      if (flashRepeat > 0) {
        flashDelay -= dt;
        if (flashDelay <= 0) {
          const bolt = createBolt(w, h);
          bolts.push(bolt);
          flashAlpha = bolt.maxAlpha;

          /* Sound: slightly delayed based on simulated distance */
          const soundDelayMs = 200 + (bolt.distancePx / w) * 1800 + Math.random() * 300;
          playThunder(soundDelayMs, bolt.distancePx, w);

          flashRepeat--;
          flashDelay = flashRepeat > 0 ? 3 + Math.random() * 8 : 0;
        }
      }

      /* ── Screen flash ── */
      if (flashAlpha > 0) {
        const flashGrad = ctx.createRadialGradient(w / 2, 0, 0, w / 2, h / 3, Math.max(w, h) * 1.1);
        flashGrad.addColorStop(0,   `rgba(200,220,255,${flashAlpha * 0.55})`);
        flashGrad.addColorStop(0.4, `rgba(180,200,255,${flashAlpha * 0.25})`);
        flashGrad.addColorStop(1,   `rgba(140,165,220,0)`);
        ctx.fillStyle = flashGrad;
        ctx.fillRect(0, 0, w, h);
        flashAlpha = Math.max(0, flashAlpha - 0.08 * dt);
      }

      /* ── Draw bolts ── */
      for (let bi = bolts.length - 1; bi >= 0; bi--) {
        const bolt = bolts[bi];
        bolt.life -= dt;

        /* Quick flash-in, slow decay */
        const t = 1 - bolt.life / bolt.maxLife;
        bolt.alpha = t < 0.15
          ? (t / 0.15) * bolt.maxAlpha
          : bolt.maxAlpha * Math.pow(1 - (t - 0.15) / 0.85, 1.8);

        if (bolt.life <= 0) { bolts.splice(bi, 1); continue; }

        for (const seg of bolt.segments) {
          /* Glow pass */
          ctx.beginPath();
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
          ctx.strokeStyle = `rgba(160,195,255,${bolt.alpha * 0.35})`;
          ctx.lineWidth   = seg.w * 4;
          ctx.lineCap     = "round";
          ctx.shadowBlur  = 18;
          ctx.shadowColor = "rgba(140,180,255,0.7)";
          ctx.stroke();

          /* Core pass */
          ctx.beginPath();
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
          ctx.strokeStyle = `rgba(230,240,255,${bolt.alpha})`;
          ctx.lineWidth   = seg.w;
          ctx.shadowBlur  = 6;
          ctx.shadowColor = "rgba(200,220,255,0.9)";
          ctx.stroke();

          ctx.shadowBlur  = 0;
          ctx.shadowColor = "transparent";
        }
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

    /* Resume AudioContext on first user interaction */
    const resumeAudio = () => {
      const ac = getAudioCtx();
      if (ac && ac.state === "suspended") ac.resume();
    };
    window.addEventListener("click",      resumeAudio, { once: true });
    window.addEventListener("touchstart", resumeAudio, { once: true });
    window.addEventListener("keydown",    resumeAudio, { once: true });

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
