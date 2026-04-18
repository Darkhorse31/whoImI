"use client";

import { useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";

/* ─── Sea Waves — bottom viewport, pointer-interactive, page-beat ─── */
export default function WaveGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: 0.5, y: 0.5 });
  const beat = useRef(0);
  const beatDecay = useRef(0);
  const pathname = usePathname();
  const prevPath = useRef(pathname);
  const animId = useRef(0);

  // Trigger beat on page navigation
  useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname;
      beat.current = 1;
    }
  }, [pathname]);

  // Pointer tracking
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mouse.current.x = e.clientX / window.innerWidth;
      mouse.current.y = e.clientY / window.innerHeight;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // Animation loop
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

    // Beat decay
    if (beat.current > 0) {
      beat.current *= 0.93;
      if (beat.current < 0.005) beat.current = 0;
    }
    beatDecay.current += (beat.current - beatDecay.current) * 0.12;

    // Wave layers — back to front (taller waves)
    const layers = [
      { baseY: h * 0.45, amp: 40, freq: 0.006, speed: 0.25, color: "rgba(250,250,250,0.015)", fill: "rgba(250,250,250,0.005)" },
      { baseY: h * 0.52, amp: 35, freq: 0.008, speed: 0.35, color: "rgba(250,250,250,0.025)", fill: "rgba(250,250,250,0.008)" },
      { baseY: h * 0.60, amp: 28, freq: 0.011, speed: 0.5,  color: "rgba(250,250,250,0.035)", fill: "rgba(250,250,250,0.012)" },
      { baseY: h * 0.68, amp: 22, freq: 0.016, speed: 0.7,  color: "rgba(250,250,250,0.05)", fill: "rgba(250,250,250,0.018)" },
      { baseY: h * 0.76, amp: 16, freq: 0.022, speed: 0.9,  color: "rgba(250,250,250,0.065)", fill: "rgba(250,250,250,0.022)" },
      { baseY: h * 0.84, amp: 12, freq: 0.030, speed: 1.2,  color: "rgba(250,250,250,0.08)", fill: "rgba(250,250,250,0.028)" },
      { baseY: h * 0.92, amp: 8,  freq: 0.040, speed: 1.5,  color: "rgba(250,250,250,0.10)", fill: "rgba(250,250,250,0.035)" },
    ];

    const beatAmp = beatDecay.current * 45;
    const pointerInfluence = (mx - 0.5) * 0.3;

    for (const layer of layers) {
      const { baseY, amp, freq, speed, color, fill } = layer;
      const totalAmp = amp + beatAmp * (amp / 18);

      ctx.beginPath();
      ctx.moveTo(0, h);

      for (let x = 0; x <= w; x += 2) {
        // Layered sine waves for organic sea motion
        const wave1 = Math.sin(x * freq + time * speed + pointerInfluence * 10) * totalAmp;
        const wave2 = Math.sin(x * freq * 1.8 + time * speed * 0.6 + 2.1) * totalAmp * 0.4;
        const wave3 = Math.sin(x * freq * 3.2 + time * speed * 1.3 + 4.7) * totalAmp * 0.15;

        // Pointer proximity ripple
        const dist = Math.abs(x / w - mx);
        const ripple = Math.exp(-dist * dist * 20) * Math.sin(time * 4 - dist * 30) * 6 * (1 + beatDecay.current * 3);

        const y = baseY + wave1 + wave2 + wave3 + ripple;
        ctx.lineTo(x, y);
      }

      ctx.lineTo(w, h);
      ctx.closePath();

      // Fill
      ctx.fillStyle = fill;
      ctx.fill();

      // Stroke the wave line
      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const wave1 = Math.sin(x * freq + time * speed + pointerInfluence * 10) * totalAmp;
        const wave2 = Math.sin(x * freq * 1.8 + time * speed * 0.6 + 2.1) * totalAmp * 0.4;
        const wave3 = Math.sin(x * freq * 3.2 + time * speed * 1.3 + 4.7) * totalAmp * 0.15;
        const dist = Math.abs(x / w - mx);
        const ripple = Math.exp(-dist * dist * 20) * Math.sin(time * 4 - dist * 30) * 6 * (1 + beatDecay.current * 3);
        const y = baseY + wave1 + wave2 + wave3 + ripple;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    // Foam particles along the front wave
    const foamCount = 30 + Math.floor(beatDecay.current * 40);
    const frontLayer = layers[layers.length - 1];
    for (let i = 0; i < foamCount; i++) {
      const fx = ((i * 137.5 + time * 20) % w);
      const fFreq = frontLayer.freq;
      const fSpeed = frontLayer.speed;
      const fAmp = frontLayer.amp + beatAmp * (frontLayer.amp / 18);
      const fy = frontLayer.baseY
        + Math.sin(fx * fFreq + time * fSpeed + pointerInfluence * 10) * fAmp
        + Math.sin(fx * fFreq * 1.8 + time * fSpeed * 0.6 + 2.1) * fAmp * 0.4
        - 1 - Math.random() * 4;

      const alpha = 0.1 + Math.random() * 0.15 + beatDecay.current * 0.2;
      const radius = 0.5 + Math.random() * 1.2;
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

  // Click to trigger beat
  const handleClick = useCallback(() => {
    beat.current = 1;
  }, []);

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      className="fixed bottom-0 left-0 w-full pointer-events-none"
      style={{ zIndex: 1, height: "65vh" }}
    />
  );
}
