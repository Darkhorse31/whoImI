"use client";

import { useRef, useEffect, useCallback } from "react";

/* ─────────────────────── Main component ─────────────────────── */
export default function DaySky() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const maybeCtx = canvas.getContext("2d");
    if (!maybeCtx) return;
    const ctx = maybeCtx;

    const dpr = Math.min(window.devicePixelRatio, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.scale(dpr, dpr);

    let time = 0;

    function animate() {
      time += 1;
      ctx.clearRect(0, 0, w, h);

      /* ── Sky gradient ── */
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0,    "#484b6a");
      skyGrad.addColorStop(0.25, "#6b6e8a");
      skyGrad.addColorStop(0.55, "#9394a5");
      skyGrad.addColorStop(0.80, "#d2d3db");
      skyGrad.addColorStop(1,    "#fafafa");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      /* ── Light haze at bottom ── */
      const hazeGrad = ctx.createLinearGradient(0, h * 0.7, 0, h);
      hazeGrad.addColorStop(0, "rgba(250, 250, 250, 0)");
      hazeGrad.addColorStop(1, "rgba(250, 250, 250, 0.20)");
      ctx.fillStyle = hazeGrad;
      ctx.fillRect(0, h * 0.7, w, h * 0.3);

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
    <div className="fixed inset-0 z-0 pointer-events-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: "block" }}
      />
    </div>
  );
}
