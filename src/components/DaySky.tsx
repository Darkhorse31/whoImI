"use client";

import { useRef, useEffect, useCallback } from "react";

/* ─────────────────────── Cloud data ─────────────────────── */
interface Cloud {
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
  opacity: number;
}

function createClouds(w: number, h: number): Cloud[] {
  const clouds: Cloud[] = [];
  const count = 8 + Math.floor(Math.random() * 5);
  for (let i = 0; i < count; i++) {
    clouds.push({
      x: Math.random() * w * 1.4 - w * 0.2,
      y: h * 0.04 + Math.random() * h * 0.28,
      w: 180 + Math.random() * 280,
      h: 55 + Math.random() * 85,
      speed: 0.10 + Math.random() * 0.22,
      opacity: 0.55 + Math.random() * 0.35,
    });
  }
  return clouds;
}

/* ─────────────────────── Draw a realistic volumetric cloud ─────────────────────── */
function drawCloud(
  ctx: CanvasRenderingContext2D,
  cloud: Cloud,
) {
  ctx.save();
  const { x, y, w, h } = cloud;

  // Bottom depth shadow
  ctx.filter = 'blur(12px)';
  ctx.globalAlpha = cloud.opacity * 0.28;
  const shadowGrad = ctx.createRadialGradient(x, y + h * 0.55, 0, x, y + h * 0.55, w * 0.45);
  shadowGrad.addColorStop(0, 'rgba(155, 170, 200, 0.9)');
  shadowGrad.addColorStop(0.5, 'rgba(165, 180, 210, 0.5)');
  shadowGrad.addColorStop(1, 'rgba(175, 192, 218, 0)');
  ctx.beginPath();
  ctx.ellipse(x, y + h * 0.42, w * 0.42, h * 0.50, 0, 0, Math.PI * 2);
  ctx.fillStyle = shadowGrad;
  ctx.fill();

  // Fluffy blobs with radial gradients
  ctx.filter = 'blur(5px)';
  ctx.globalAlpha = cloud.opacity;

  const blobs = [
    { ox: 0,         oy: 0,         rx: w * 0.40, ry: h * 0.88 },
    { ox: w * 0.20,  oy: -h * 0.30, rx: w * 0.32, ry: h * 0.72 },
    { ox: -w * 0.18, oy: -h * 0.22, rx: w * 0.28, ry: h * 0.68 },
    { ox: w * 0.38,  oy:  h * 0.05, rx: w * 0.24, ry: h * 0.60 },
    { ox: -w * 0.36, oy:  h * 0.05, rx: w * 0.20, ry: h * 0.55 },
    { ox: w * 0.10,  oy: -h * 0.48, rx: w * 0.22, ry: h * 0.58 },
    { ox: -w * 0.08, oy:  h * 0.08, rx: w * 0.36, ry: h * 0.62 },
  ];

  for (const b of blobs) {
    const bx = x + b.ox;
    const by = y + b.oy;
    const r = Math.max(b.rx, b.ry);
    const grad = ctx.createRadialGradient(bx, by - b.ry * 0.18, 0, bx, by, r);
    grad.addColorStop(0,    'rgba(255, 255, 255, 0.98)');
    grad.addColorStop(0.35, 'rgba(252, 252, 255, 0.80)');
    grad.addColorStop(0.65, 'rgba(245, 248, 255, 0.45)');
    grad.addColorStop(0.88, 'rgba(235, 240, 252, 0.18)');
    grad.addColorStop(1,    'rgba(220, 232, 248, 0)');
    ctx.beginPath();
    ctx.ellipse(bx, by, b.rx, b.ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // Crisp bright highlight on the lit top
  ctx.filter = 'none';
  ctx.globalAlpha = cloud.opacity * 0.55;
  const hlGrad = ctx.createRadialGradient(x, y - h * 0.20, 0, x, y, w * 0.38);
  hlGrad.addColorStop(0,    'rgba(255, 255, 255, 0.95)');
  hlGrad.addColorStop(0.45, 'rgba(252, 252, 255, 0.55)');
  hlGrad.addColorStop(1,    'rgba(240, 245, 255, 0)');
  ctx.beginPath();
  ctx.ellipse(x, y - h * 0.08, w * 0.36, h * 0.50, 0, 0, Math.PI * 2);
  ctx.fillStyle = hlGrad;
  ctx.fill();

  ctx.filter = 'none';
  ctx.restore();
}

/* ─────────────────────── Main component ─────────────────────── */
export default function DaySky() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const cloudsRef = useRef<Cloud[]>([]);

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

    if (cloudsRef.current.length === 0) {
      cloudsRef.current = createClouds(w, h);
    }

    let time = 0;

    function animate() {
      time += 1;
      ctx.clearRect(0, 0, w, h);

      /* ── Sky gradient — cooler lavender-blue matching palette ── */
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0,    "#484b6a");  // dark navy-purple top
      skyGrad.addColorStop(0.25, "#6b6e8a");  // medium purple-grey
      skyGrad.addColorStop(0.55, "#9394a5");  // muted lavender-grey
      skyGrad.addColorStop(0.80, "#d2d3db");  // cool light grey horizon
      skyGrad.addColorStop(1,    "#fafafa");  // near-white at ground
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      /* ── Sun — soft warm white-yellow, harmonious with cool sky ── */
      const sunX = w * 0.75;
      const sunY = h * 0.18 + Math.sin(time * 0.008) * 5;
      const sunRadius = 45;

      // outer glow
      const glowRadius = sunRadius * 5;
      const sunGlow = ctx.createRadialGradient(
        sunX, sunY, sunRadius * 0.5,
        sunX, sunY, glowRadius
      );
      sunGlow.addColorStop(0, "rgba(255, 248, 220, 0.40)");
      sunGlow.addColorStop(0.3, "rgba(255, 240, 200, 0.18)");
      sunGlow.addColorStop(0.6, "rgba(255, 235, 180, 0.07)");
      sunGlow.addColorStop(1, "rgba(255, 230, 160, 0)");
      ctx.beginPath();
      ctx.arc(sunX, sunY, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = sunGlow;
      ctx.fill();

      // sun rays (rotating)
      ctx.save();
      ctx.translate(sunX, sunY);
      ctx.rotate(time * 0.003);
      const rayCount = 12;
      for (let i = 0; i < rayCount; i++) {
        const angle = (i / rayCount) * Math.PI * 2;
        ctx.save();
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, -sunRadius * 1.3);
        ctx.lineTo(-3, -sunRadius * 3);
        ctx.lineTo(3, -sunRadius * 3);
        ctx.closePath();
        ctx.fillStyle = `rgba(255, 240, 180, ${0.07 + Math.sin(time * 0.02 + i) * 0.03})`;
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();

      // sun disc — soft white-gold
      const discGrad = ctx.createRadialGradient(
        sunX, sunY, 0,
        sunX, sunY, sunRadius
      );
      discGrad.addColorStop(0,   "#fffff8");
      discGrad.addColorStop(0.6, "#fff5c0");
      discGrad.addColorStop(1,   "#ffe980");
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
      ctx.fillStyle = discGrad;
      ctx.fill();

      /* ── Clouds ── */
      for (const cloud of cloudsRef.current) {
        cloud.x += cloud.speed;
        if (cloud.x - cloud.w > w * 1.2) {
          cloud.x = -cloud.w * 1.5;
          cloud.y = h * 0.05 + Math.random() * h * 0.35;
        }
        drawCloud(ctx, cloud);
      }

      /* ── Light haze at bottom — cool grey-white ── */
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
      cloudsRef.current = [];
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
