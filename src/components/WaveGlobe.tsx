"use client";

import { useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";

/* ─── Sea Waves — 3D depth, boat, pointer-interactive, page-beat ─── */
export default function WaveGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: 0.5, y: 0.5 });
  const beat = useRef(0);
  const beatDecay = useRef(0);
  const pathname = usePathname();
  const prevPath = useRef(pathname);
  const animId = useRef(0);

  useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname;
      beat.current = 1;
    }
  }, [pathname]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mouse.current.x = e.clientX / window.innerWidth;
      mouse.current.y = e.clientY / window.innerHeight;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  /* ─── helper: compute wave Y at any x ─── */
  const waveY = (
    x: number,
    w: number,
    baseY: number,
    amp: number,
    freq: number,
    speed: number,
    time: number,
    pointerInfluence: number,
    beatAmp: number,
    mx: number,
    beatDecayVal: number
  ) => {
    const totalAmp = amp + beatAmp * (amp / 18);
    const wave1 =
      Math.sin(x * freq + time * speed + pointerInfluence * 10) * totalAmp;
    const wave2 =
      Math.sin(x * freq * 1.8 + time * speed * 0.6 + 2.1) * totalAmp * 0.4;
    const wave3 =
      Math.sin(x * freq * 3.2 + time * speed * 1.3 + 4.7) * totalAmp * 0.15;
    const dist = Math.abs(x / w - mx);
    const ripple =
      Math.exp(-dist * dist * 20) *
      Math.sin(time * 4 - dist * 30) *
      6 *
      (1 + beatDecayVal * 3);
    return baseY + wave1 + wave2 + wave3 + ripple;
  };

  /* ─── draw a boat ─── */
  const drawBoat = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    tilt: number,
    scale: number,
    alpha: number,
    time: number
  ) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(tilt);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;

    // Hull shadow
    ctx.beginPath();
    ctx.ellipse(0, 6, 34, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fill();

    // Hull
    ctx.beginPath();
    ctx.moveTo(-30, 0);
    ctx.quadraticCurveTo(-32, 10, -20, 14);
    ctx.lineTo(20, 14);
    ctx.quadraticCurveTo(32, 10, 35, 0);
    ctx.quadraticCurveTo(30, -2, 20, -3);
    ctx.lineTo(-20, -3);
    ctx.quadraticCurveTo(-30, -2, -30, 0);
    ctx.closePath();

    const hullGrad = ctx.createLinearGradient(0, -3, 0, 14);
    hullGrad.addColorStop(0, "rgba(180,150,120,0.9)");
    hullGrad.addColorStop(0.4, "rgba(140,110,80,0.85)");
    hullGrad.addColorStop(1, "rgba(90,70,50,0.8)");
    ctx.fillStyle = hullGrad;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 0.6;
    ctx.stroke();

    // Hull stripe
    ctx.beginPath();
    ctx.moveTo(-26, 5);
    ctx.quadraticCurveTo(0, 7, 30, 5);
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Mast
    ctx.beginPath();
    ctx.moveTo(2, -3);
    ctx.lineTo(0, -46);
    ctx.strokeStyle = "rgba(200,180,160,0.8)";
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Sail — main triangle with billow
    const sailBillow = Math.sin(time * 1.2) * 3 + 5;
    ctx.beginPath();
    ctx.moveTo(0, -44);
    ctx.quadraticCurveTo(16 + sailBillow, -28, 24 + sailBillow * 0.6, -6);
    ctx.lineTo(3, -6);
    ctx.closePath();

    const sailGrad = ctx.createLinearGradient(0, -44, 20, -6);
    sailGrad.addColorStop(0, "rgba(245,240,230,0.7)");
    sailGrad.addColorStop(0.5, "rgba(230,225,215,0.55)");
    sailGrad.addColorStop(1, "rgba(210,200,190,0.4)");
    ctx.fillStyle = sailGrad;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Jib (small front sail)
    const jibBillow = Math.sin(time * 1.5 + 1) * 2 + 3;
    ctx.beginPath();
    ctx.moveTo(0, -40);
    ctx.quadraticCurveTo(-10 - jibBillow, -24, -14 - jibBillow * 0.5, -6);
    ctx.lineTo(-1, -6);
    ctx.closePath();

    const jibGrad = ctx.createLinearGradient(0, -40, -12, -6);
    jibGrad.addColorStop(0, "rgba(240,235,225,0.5)");
    jibGrad.addColorStop(1, "rgba(210,200,190,0.3)");
    ctx.fillStyle = jibGrad;
    ctx.fill();

    // Flag at mast top
    const flagWave = Math.sin(time * 2.5) * 4;
    ctx.beginPath();
    ctx.moveTo(0, -46);
    ctx.quadraticCurveTo(-4 + flagWave, -50, -8 + flagWave * 0.8, -46);
    ctx.strokeStyle = "rgba(200,160,100,0.6)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Wake ripples behind boat
    ctx.globalAlpha = alpha * 0.3;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      const wakeX = -30 - i * 12;
      const wakeSpread = i * 5;
      ctx.moveTo(wakeX, 4 - wakeSpread);
      ctx.quadraticCurveTo(wakeX - 6, 4, wakeX, 4 + wakeSpread);
      ctx.strokeStyle = `rgba(255,255,255,${0.15 / i})`;
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }

    ctx.restore();
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    }

    ctx.clearRect(0, 0, w, h);

    const time = performance.now() * 0.001;
    const mx = mouse.current.x;

    if (beat.current > 0) {
      beat.current *= 0.93;
      if (beat.current < 0.005) beat.current = 0;
    }
    beatDecay.current += (beat.current - beatDecay.current) * 0.12;

    const beatAmp = beatDecay.current * 45;
    const pointerInfluence = (mx - 0.5) * 0.3;

    /* ─── Enhanced 3D wave layers with perspective depth ─── */
    const layers = [
      // Far back — small, faint, blurred feel (deep Z)
      {
        baseY: h * 0.32,
        amp: 55,
        freq: 0.004,
        speed: 0.12,
        stroke: "rgba(250,250,250,0.008)",
        fill: "rgba(250,250,250,0.003)",
        lineW: 0.3,
        shadow: 0,
      },
      {
        baseY: h * 0.38,
        amp: 48,
        freq: 0.005,
        speed: 0.18,
        stroke: "rgba(250,250,250,0.012)",
        fill: "rgba(250,250,250,0.004)",
        lineW: 0.4,
        shadow: 0,
      },
      {
        baseY: h * 0.44,
        amp: 42,
        freq: 0.006,
        speed: 0.25,
        stroke: "rgba(250,250,250,0.018)",
        fill: "rgba(250,250,250,0.006)",
        lineW: 0.5,
        shadow: 0,
      },
      // Mid layers — stronger presence
      {
        baseY: h * 0.51,
        amp: 36,
        freq: 0.008,
        speed: 0.35,
        stroke: "rgba(250,250,250,0.028)",
        fill: "rgba(250,250,250,0.009)",
        lineW: 0.6,
        shadow: 2,
      },
      {
        baseY: h * 0.58,
        amp: 30,
        freq: 0.011,
        speed: 0.5,
        stroke: "rgba(250,250,250,0.04)",
        fill: "rgba(250,250,250,0.014)",
        lineW: 0.7,
        shadow: 4,
      },
      {
        baseY: h * 0.65,
        amp: 24,
        freq: 0.015,
        speed: 0.65,
        stroke: "rgba(250,250,250,0.055)",
        fill: "rgba(250,250,250,0.02)",
        lineW: 0.8,
        shadow: 6,
      },
      // Near front — bold, thick, strong (close Z)
      {
        baseY: h * 0.73,
        amp: 20,
        freq: 0.02,
        speed: 0.85,
        stroke: "rgba(250,250,250,0.07)",
        fill: "rgba(250,250,250,0.025)",
        lineW: 1.0,
        shadow: 8,
      },
      {
        baseY: h * 0.81,
        amp: 15,
        freq: 0.027,
        speed: 1.05,
        stroke: "rgba(250,250,250,0.09)",
        fill: "rgba(250,250,250,0.032)",
        lineW: 1.2,
        shadow: 10,
      },
      {
        baseY: h * 0.89,
        amp: 10,
        freq: 0.035,
        speed: 1.3,
        stroke: "rgba(250,250,250,0.11)",
        fill: "rgba(250,250,250,0.04)",
        lineW: 1.5,
        shadow: 12,
      },
      {
        baseY: h * 0.95,
        amp: 6,
        freq: 0.045,
        speed: 1.6,
        stroke: "rgba(250,250,250,0.13)",
        fill: "rgba(250,250,250,0.05)",
        lineW: 1.8,
        shadow: 14,
      },
    ];

    /* ─── Draw depth gradient (dark at top → slightly lighter at bottom) ─── */
    const depthGrad = ctx.createLinearGradient(0, h * 0.3, 0, h);
    depthGrad.addColorStop(0, "rgba(0,0,0,0)");
    depthGrad.addColorStop(0.4, "rgba(15,25,40,0.03)");
    depthGrad.addColorStop(0.7, "rgba(20,35,55,0.06)");
    depthGrad.addColorStop(1, "rgba(25,45,70,0.08)");
    ctx.fillStyle = depthGrad;
    ctx.fillRect(0, h * 0.3, w, h * 0.7);

    /* ─── Draw wave layers ─── */
    for (let li = 0; li < layers.length; li++) {
      const layer = layers[li];
      const { baseY, amp, freq, speed, stroke, fill, lineW, shadow } = layer;
      const totalAmp = amp + beatAmp * (amp / 18);

      // Depth shadow under wave (gives Z-separation feel)
      if (shadow > 0) {
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.12)";
        ctx.shadowBlur = shadow;
        ctx.shadowOffsetY = shadow * 0.5;
      }

      // Fill area
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 2) {
        const y = waveY(
          x, w, baseY, amp, freq, speed, time,
          pointerInfluence, beatAmp, mx, beatDecay.current
        );
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      if (shadow > 0) ctx.restore();

      // Wave crest highlight — brighter line on upper sine curve
      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const y = waveY(
          x, w, baseY, amp, freq, speed, time,
          pointerInfluence, beatAmp, mx, beatDecay.current
        );
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineW;
      ctx.stroke();

      // Secondary highlight for front layers (glow effect)
      if (li >= layers.length - 4) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 3) {
          const y = waveY(
            x, w, baseY, amp, freq, speed, time,
            pointerInfluence, beatAmp, mx, beatDecay.current
          );
          if (x === 0) ctx.moveTo(x, y - 1);
          else ctx.lineTo(x, y - 1);
        }
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lineW * 2.5;
        ctx.filter = "blur(3px)";
        ctx.stroke();
        ctx.filter = "none";
        ctx.restore();
      }
    }

    /* ─── Boat on wave layer index 6 (mid-front) ─── */
    const boatLayer = layers[6];
    const boatXRatio = 0.7 + Math.sin(time * 0.1) * 0.02; // gentle drift
    const boatX = w * boatXRatio;
    const boatYBase = waveY(
      boatX, w, boatLayer.baseY, boatLayer.amp, boatLayer.freq,
      boatLayer.speed, time, pointerInfluence, beatAmp, mx, beatDecay.current
    );
    // Compute tilt from wave slope
    const dx = 4;
    const yLeft = waveY(
      boatX - dx, w, boatLayer.baseY, boatLayer.amp, boatLayer.freq,
      boatLayer.speed, time, pointerInfluence, beatAmp, mx, beatDecay.current
    );
    const yRight = waveY(
      boatX + dx, w, boatLayer.baseY, boatLayer.amp, boatLayer.freq,
      boatLayer.speed, time, pointerInfluence, beatAmp, mx, beatDecay.current
    );
    const boatTilt = Math.atan2(yRight - yLeft, dx * 2) * 0.7;
    const boatBob = Math.sin(time * 1.8) * 1.5;
    drawBoat(ctx, boatX, boatYBase - 6 + boatBob, boatTilt, 2.2, 0.75, time);

    // Second smaller boat further back (depth)
    const boat2Layer = layers[4];
    const boat2XRatio = 0.25 + Math.sin(time * 0.08 + 2) * 0.015;
    const boat2X = w * boat2XRatio;
    const boat2Y = waveY(
      boat2X, w, boat2Layer.baseY, boat2Layer.amp, boat2Layer.freq,
      boat2Layer.speed, time, pointerInfluence, beatAmp, mx, beatDecay.current
    );
    const b2yL = waveY(
      boat2X - dx, w, boat2Layer.baseY, boat2Layer.amp, boat2Layer.freq,
      boat2Layer.speed, time, pointerInfluence, beatAmp, mx, beatDecay.current
    );
    const b2yR = waveY(
      boat2X + dx, w, boat2Layer.baseY, boat2Layer.amp, boat2Layer.freq,
      boat2Layer.speed, time, pointerInfluence, beatAmp, mx, beatDecay.current
    );
    const boat2Tilt = Math.atan2(b2yR - b2yL, dx * 2) * 0.6;
    drawBoat(ctx, boat2X, boat2Y - 4, boat2Tilt, 1.2, 0.35, time);

    /* ─── Foam / spray particles ─── */
    const foamCount = 40 + Math.floor(beatDecay.current * 50);
    const frontLayer = layers[layers.length - 1];
    for (let i = 0; i < foamCount; i++) {
      const fx = (i * 137.5 + time * 20) % w;
      const fy =
        waveY(
          fx, w, frontLayer.baseY, frontLayer.amp, frontLayer.freq,
          frontLayer.speed, time, pointerInfluence, beatAmp, mx, beatDecay.current
        ) - 1 - Math.random() * 4;
      const alpha = 0.1 + Math.random() * 0.15 + beatDecay.current * 0.2;
      const radius = 0.5 + Math.random() * 1.5;
      ctx.beginPath();
      ctx.arc(fx, fy, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fill();
    }

    // Deeper foam on mid layers for depth
    const midLayer = layers[6];
    const deepFoamCount = 15;
    for (let i = 0; i < deepFoamCount; i++) {
      const fx = (i * 211.3 + time * 14) % w;
      const fy =
        waveY(
          fx, w, midLayer.baseY, midLayer.amp, midLayer.freq,
          midLayer.speed, time, pointerInfluence, beatAmp, mx, beatDecay.current
        ) - Math.random() * 3;
      const alpha = 0.06 + Math.random() * 0.08;
      const radius = 0.4 + Math.random() * 0.8;
      ctx.beginPath();
      ctx.arc(fx, fy, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fill();
    }

    animId.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    animId.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId.current);
  }, [draw]);

  const handleClick = useCallback(() => {
    beat.current = 1;
  }, []);

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      className="fixed bottom-0 left-0 w-full pointer-events-none"
      style={{ zIndex: 1, height: "75vh" }}
    />
  );
}
