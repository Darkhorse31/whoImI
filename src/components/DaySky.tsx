"use client";

import { useRef, useEffect, useCallback } from "react";
import { weatherState } from "@/lib/weatherState";

/* ── Colour helpers ── */
function lerpColor(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const r = Math.round(((pa >> 16) & 0xff) * (1 - t) + ((pb >> 16) & 0xff) * t);
  const g = Math.round(((pa >> 8) & 0xff) * (1 - t) + ((pb >> 8) & 0xff) * t);
  const bl = Math.round((pa & 0xff) * (1 - t) + (pb & 0xff) * t);
  return `rgb(${r},${g},${bl})`;
}

/* Sky palettes for each weather state */
const CLEAR_SKY = ["#484b6a", "#6b6e8a", "#9394a5", "#d2d3db", "#fafafa"];
const STORM_SKY = ["#1e2030", "#2a2d45", "#3e4158", "#585b72", "#7a7d90"];
const RAIN_SKY  = ["#2e3248", "#454860", "#606378", "#8a8c9e", "#b5b7c4"];
const SNOW_SKY  = ["#556080", "#6e7898", "#8892ab", "#b0b5c8", "#d5d8e4"];

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
    /* Smooth weather blend targets */
    let stormBlend = 0;
    let rainBlend = 0;
    let snowBlend = 0;
    let flashGlow = 0;

    /* Animated cloud state */
    const clouds: { x: number; y: number; w: number; h: number; speed: number; alpha: number }[] = [];
    for (let i = 0; i < 6; i++) {
      clouds.push({
        x: Math.random() * w,
        y: h * (0.05 + Math.random() * 0.25),
        w: 120 + Math.random() * 200,
        h: 30 + Math.random() * 40,
        speed: 0.08 + Math.random() * 0.15,
        alpha: 0,
      });
    }

    function animate() {
      time += 1;
      ctx.clearRect(0, 0, w, h);

      /* ── Smoothly blend towards weather state ── */
      const targetStorm = weatherState.isThundering ? 1 : 0;
      const targetRain = weatherState.isRaining ? 1 : 0;
      const targetSnow = weatherState.isSnowing ? 1 : 0;
      stormBlend += (targetStorm - stormBlend) * 0.008;
      rainBlend += (targetRain - rainBlend) * 0.008;
      snowBlend += (targetSnow - snowBlend) * 0.008;

      /* Flash response — fast in, slow out */
      const targetFlash = weatherState.flashIntensity;
      if (targetFlash > flashGlow) {
        flashGlow += (targetFlash - flashGlow) * 0.5;
      } else {
        flashGlow *= 0.92;
      }

      /* ── Determine blended sky palette ── */
      const weatherWeight = Math.min(1, stormBlend + rainBlend * 0.6 + snowBlend * 0.3);
      let targetPalette = CLEAR_SKY;
      if (stormBlend > 0.3) targetPalette = STORM_SKY;
      else if (rainBlend > 0.3) targetPalette = RAIN_SKY;
      else if (snowBlend > 0.3) targetPalette = SNOW_SKY;

      const palette = CLEAR_SKY.map((c, i) => lerpColor(c, targetPalette[i], weatherWeight));

      /* ── Sky gradient ── */
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, palette[0]);
      skyGrad.addColorStop(0.25, palette[1]);
      skyGrad.addColorStop(0.55, palette[2]);
      skyGrad.addColorStop(0.80, palette[3]);
      skyGrad.addColorStop(1, palette[4]);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      /* ── Lightning flash overlay ── */
      if (flashGlow > 0.02) {
        const fGrad = ctx.createRadialGradient(w * 0.5, h * 0.15, 0, w * 0.5, h * 0.3, Math.max(w, h));
        fGrad.addColorStop(0, `rgba(220,235,255,${flashGlow * 0.45})`);
        fGrad.addColorStop(0.3, `rgba(200,215,250,${flashGlow * 0.2})`);
        fGrad.addColorStop(1, `rgba(180,195,240,0)`);
        ctx.fillStyle = fGrad;
        ctx.fillRect(0, 0, w, h);
      }

      /* ── Storm clouds (visible when stormy/rainy) ── */
      const cloudAlpha = stormBlend * 0.25 + rainBlend * 0.15;
      if (cloudAlpha > 0.01) {
        for (const c of clouds) {
          c.x += c.speed;
          if (c.x > w + c.w) c.x = -c.w;
          c.alpha += (cloudAlpha - c.alpha) * 0.01;

          ctx.save();
          ctx.globalAlpha = c.alpha;
          const cg = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.w * 0.5);
          cg.addColorStop(0, "rgba(40,45,65,0.6)");
          cg.addColorStop(0.5, "rgba(50,55,75,0.3)");
          cg.addColorStop(1, "rgba(60,65,85,0)");
          ctx.fillStyle = cg;
          ctx.beginPath();
          ctx.ellipse(c.x, c.y, c.w * 0.5, c.h * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();

          /* Secondary lobe */
          ctx.beginPath();
          ctx.ellipse(c.x + c.w * 0.25, c.y - c.h * 0.15, c.w * 0.35, c.h * 0.4, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      /* ── Snow haze overlay ── */
      if (snowBlend > 0.05) {
        const sGrad = ctx.createLinearGradient(0, 0, 0, h);
        sGrad.addColorStop(0, `rgba(180,190,210,${snowBlend * 0.04})`);
        sGrad.addColorStop(1, `rgba(200,210,225,${snowBlend * 0.02})`);
        ctx.fillStyle = sGrad;
        ctx.fillRect(0, 0, w, h);
      }

      /* ── Light haze at bottom ── */
      const hazeAlpha = 0.20 * (1 - stormBlend * 0.6);
      const hazeGrad = ctx.createLinearGradient(0, h * 0.7, 0, h);
      hazeGrad.addColorStop(0, "rgba(250, 250, 250, 0)");
      hazeGrad.addColorStop(1, `rgba(250, 250, 250, ${hazeAlpha})`);
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
