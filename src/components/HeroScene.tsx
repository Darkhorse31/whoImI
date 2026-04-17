"use client";

import { useRef, useEffect, useCallback } from "react";

export default function HeroScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    let time = 0;

    // Wave configs using lavender palette
    const waves = [
      { amplitude: 40, frequency: 0.003, speed: 0.02, yOffset: 0, color: "rgba(180, 160, 220, 0.25)", lineWidth: 1.5 },
      { amplitude: 30, frequency: 0.004, speed: 0.015, yOffset: 15, color: "rgba(200, 180, 235, 0.18)", lineWidth: 1.3 },
      { amplitude: 50, frequency: 0.002, speed: 0.025, yOffset: -10, color: "rgba(160, 140, 200, 0.15)", lineWidth: 1.2 },
      { amplitude: 25, frequency: 0.005, speed: 0.018, yOffset: 30, color: "rgba(190, 170, 225, 0.12)", lineWidth: 1 },
      { amplitude: 35, frequency: 0.0035, speed: 0.022, yOffset: -25, color: "rgba(170, 150, 210, 0.10)", lineWidth: 0.8 },
    ];

    function animate() {
      time += 1;
      ctx.clearRect(0, 0, w, h);

      // Draw waves at bottom
      const baseY = h * 0.82;

      for (const wave of waves) {
        ctx.beginPath();
        ctx.moveTo(0, baseY + wave.yOffset);

        for (let x = 0; x <= w; x += 2) {
          const y =
            baseY +
            wave.yOffset +
            Math.sin(x * wave.frequency + time * wave.speed) * wave.amplitude +
            Math.sin(x * wave.frequency * 1.5 + time * wave.speed * 0.7) * (wave.amplitude * 0.4) +
            Math.cos(x * wave.frequency * 0.5 + time * wave.speed * 1.3) * (wave.amplitude * 0.2);
          ctx.lineTo(x, y);
        }

        ctx.strokeStyle = wave.color;
        ctx.lineWidth = wave.lineWidth;
        ctx.stroke();
      }

      // Soft fill below the main wave
      const mainWave = waves[0];
      ctx.beginPath();
      ctx.moveTo(0, baseY + mainWave.yOffset);
      for (let x = 0; x <= w; x += 2) {
        const y =
          baseY +
          mainWave.yOffset +
          Math.sin(x * mainWave.frequency + time * mainWave.speed) * mainWave.amplitude +
          Math.sin(x * mainWave.frequency * 1.5 + time * mainWave.speed * 0.7) * (mainWave.amplitude * 0.4) +
          Math.cos(x * mainWave.frequency * 0.5 + time * mainWave.speed * 1.3) * (mainWave.amplitude * 0.2);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, baseY - 40, 0, h);
      grad.addColorStop(0, "rgba(136, 186, 200, 0.04)");
      grad.addColorStop(0.5, "rgba(77, 134, 155, 0.02)");
      grad.addColorStop(1, "rgba(10, 10, 11, 0)");
      ctx.fillStyle = grad;
      ctx.fill();

      animRef.current = requestAnimationFrame(animate);
    }

    animate();
  }, []);

  useEffect(() => {
    draw();
    const onResize = () => {
      cancelAnimationFrame(animRef.current);
      draw();
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, [draw]);

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: "block" }}
      />
    </div>
  );
}
