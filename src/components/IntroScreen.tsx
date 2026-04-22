"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useEffect, useCallback, useState } from "react";

/* ── Bokeh particle type ── */
interface Particle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  size: number;
  color: string;
  alpha: number;
  targetAlpha: number;
  vx: number;
  vy: number;
  phase: number; // animation phase: 0=converge, 1=dissolve
  delay: number;
  speed: number;
  blur: number;
}

/* ── Bokeh colors matching the reference video ── */
const BOKEH_COLORS = [
  "rgba(255,255,255,",      // bright white
  "rgba(200,180,255,",      // lavender
  "rgba(255,160,200,",      // pink
  "rgba(180,140,220,",      // purple
  "rgba(120,180,255,",      // blue
  "rgba(160,220,255,",      // light cyan
  "rgba(255,200,160,",      // warm peach
  "rgba(220,180,255,",      // light purple
];

function createParticle(w: number, h: number): Particle {
  const cx = w / 2;
  const cy = h / 2;
  // Start position: random across the screen
  const angle = Math.random() * Math.PI * 2;
  const dist = 80 + Math.random() * Math.max(w, h) * 0.6;
  const startX = cx + Math.cos(angle) * dist;
  const startY = cy + Math.sin(angle) * dist;
  // Converge target: cluster near center with spread
  const spread = 60 + Math.random() * 120;
  const cAngle = Math.random() * Math.PI * 2;
  const targetX = cx + Math.cos(cAngle) * spread * (0.5 + Math.random());
  const targetY = cy + Math.sin(cAngle) * spread * 0.4; // flatter ellipse
  const size = 4 + Math.random() * 28;
  const colorBase = BOKEH_COLORS[Math.floor(Math.random() * BOKEH_COLORS.length)];

  return {
    x: startX,
    y: startY,
    targetX,
    targetY,
    size,
    color: colorBase,
    alpha: 0,
    targetAlpha: 0.3 + Math.random() * 0.7,
    vx: 0,
    vy: 0,
    phase: 0,
    delay: Math.random() * 0.4,
    speed: 0.015 + Math.random() * 0.025,
    blur: size > 15 ? 8 + Math.random() * 12 : 2 + Math.random() * 6,
  };
}

/* ── Canvas-based bokeh particle system ── */
function BokehCanvas({
  onDissolveComplete,
}: {
  onDissolveComplete: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const phaseRef = useRef(0); // 0=converge, 1=hold, 2=dissolve
  const timerRef = useRef(0);
  const lensFlareRef = useRef(0); // lens flare intensity
  const centerGlowRef = useRef(0); // center bright glow
  const dissolvedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let w = window.innerWidth;
    let h = window.innerHeight;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Create particles
    const count = Math.min(90, Math.floor((w * h) / 12000));
    particlesRef.current = Array.from({ length: count }, () =>
      createParticle(w, h)
    );

    let frame = 0;
    let startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      ctx.clearRect(0, 0, w, h);

      const particles = particlesRef.current;
      const cx = w / 2;
      const cy = h / 2;

      // Phase progression
      if (phaseRef.current === 0 && elapsed > 1.8) {
        phaseRef.current = 1; // hold
      }
      if (phaseRef.current === 1 && elapsed > 2.8) {
        phaseRef.current = 2; // dissolve
      }

      // Lens flare intensity
      if (elapsed < 1.0) {
        lensFlareRef.current = Math.min(1, elapsed / 0.8);
      } else if (elapsed < 2.8) {
        lensFlareRef.current = 1;
      } else {
        lensFlareRef.current = Math.max(0, 1 - (elapsed - 2.8) / 1.2);
      }

      // Center glow
      if (elapsed < 0.8) {
        centerGlowRef.current = elapsed / 0.8;
      } else if (elapsed < 2.5) {
        centerGlowRef.current = 1;
      } else {
        centerGlowRef.current = Math.max(0, 1 - (elapsed - 2.5) / 1.0);
      }

      // ── Draw center glow ──
      const cg = centerGlowRef.current;
      if (cg > 0) {
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 180);
        grad.addColorStop(0, `rgba(255,255,255,${0.5 * cg})`);
        grad.addColorStop(0.2, `rgba(200,180,255,${0.2 * cg})`);
        grad.addColorStop(0.5, `rgba(140,160,255,${0.06 * cg})`);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      // ── Draw horizontal lens flare ──
      const lf = lensFlareRef.current;
      if (lf > 0) {
        // Main streak
        const streakGrad = ctx.createLinearGradient(0, cy, w, cy);
        streakGrad.addColorStop(0, "rgba(100,140,255,0)");
        streakGrad.addColorStop(0.15, `rgba(100,140,255,${0.04 * lf})`);
        streakGrad.addColorStop(0.4, `rgba(180,200,255,${0.12 * lf})`);
        streakGrad.addColorStop(0.5, `rgba(255,255,255,${0.25 * lf})`);
        streakGrad.addColorStop(0.6, `rgba(180,200,255,${0.12 * lf})`);
        streakGrad.addColorStop(0.85, `rgba(100,140,255,${0.04 * lf})`);
        streakGrad.addColorStop(1, "rgba(100,140,255,0)");
        ctx.fillStyle = streakGrad;
        ctx.fillRect(0, cy - 2, w, 4);

        // Broader glow streak
        const broadGrad = ctx.createLinearGradient(0, cy, w, cy);
        broadGrad.addColorStop(0, "rgba(100,140,255,0)");
        broadGrad.addColorStop(0.3, `rgba(140,160,255,${0.03 * lf})`);
        broadGrad.addColorStop(0.5, `rgba(200,210,255,${0.08 * lf})`);
        broadGrad.addColorStop(0.7, `rgba(140,160,255,${0.03 * lf})`);
        broadGrad.addColorStop(1, "rgba(100,140,255,0)");
        ctx.fillStyle = broadGrad;
        ctx.fillRect(0, cy - 20, w, 40);
      }

      // ── Update & draw particles ──
      let allDone = true;
      for (const p of particles) {
        const pElapsed = Math.max(0, elapsed - p.delay);

        if (phaseRef.current === 0) {
          // Converge toward center
          const t = Math.min(1, pElapsed * p.speed * 40);
          const ease = 1 - Math.pow(1 - t, 3); // ease-out cubic
          p.x = p.x + (p.targetX - p.x) * ease * 0.08;
          p.y = p.y + (p.targetY - p.y) * ease * 0.08;
          p.alpha = Math.min(p.targetAlpha, p.alpha + 0.03);
        } else if (phaseRef.current === 1) {
          // Hold with gentle float
          p.x += Math.sin(elapsed * 1.5 + p.delay * 10) * 0.3;
          p.y += Math.cos(elapsed * 1.2 + p.delay * 8) * 0.2;
        } else {
          // Dissolve outward
          if (p.phase !== 2) {
            p.phase = 2;
            const angle = Math.atan2(p.y - cy, p.x - cx) + (Math.random() - 0.5) * 1.2;
            const force = 1.5 + Math.random() * 3;
            p.vx = Math.cos(angle) * force;
            p.vy = Math.sin(angle) * force;
          }
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.985;
          p.vy *= 0.985;
          p.alpha = Math.max(0, p.alpha - 0.008 - Math.random() * 0.005);

          if (p.alpha > 0.01) allDone = false;
        }

        if (p.alpha <= 0) continue;

        // Draw bokeh circle with glow
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.filter = `blur(${p.blur}px)`;

        // Outer glow
        const glowGrad = ctx.createRadialGradient(
          p.x, p.y, 0,
          p.x, p.y, p.size * 1.5
        );
        glowGrad.addColorStop(0, p.color + "0.8)");
        glowGrad.addColorStop(0.4, p.color + "0.3)");
        glowGrad.addColorStop(1, p.color + "0)");
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Inner bright core
        ctx.filter = "none";
        ctx.globalAlpha = p.alpha * 0.9;
        const coreGrad = ctx.createRadialGradient(
          p.x, p.y, 0,
          p.x, p.y, p.size * 0.5
        );
        coreGrad.addColorStop(0, "rgba(255,255,255,0.95)");
        coreGrad.addColorStop(0.5, p.color + "0.4)");
        coreGrad.addColorStop(1, p.color + "0)");
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // Check if dissolve is complete
      if (phaseRef.current === 2 && allDone && !dissolvedRef.current) {
        dissolvedRef.current = true;
        onDissolveComplete();
      }

      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [onDissolveComplete]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-30 pointer-events-none"
    />
  );
}

/* ── Visible one-by-one letter reveal ── */
function CharReveal({
  text,
  delay = 0,
  className = "",
  stagger = 0.12,
}: {
  text: string;
  delay?: number;
  className?: string;
  stagger?: number;
}) {
  return (
    <span className={`inline-block ${className}`}>
      {text.split("").map((char, i) => (
        <span key={i} className="inline-block overflow-hidden">
          <motion.span
            className="inline-block will-change-transform"
            initial={{
              y: "110%",
              opacity: 0,
              filter: "blur(8px)",
              scale: 0.7,
            }}
            animate={{
              y: "0%",
              opacity: 1,
              filter: "blur(0px)",
              scale: 1,
            }}
            transition={{
              duration: 0.6,
              delay: delay + i * stagger,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

export default function IntroScreen() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [textRevealed, setTextRevealed] = useState(false);

  const onDissolveComplete = useCallback(() => {
    setTextRevealed(true);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Scroll-out transforms
  const introOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const introScale = useTransform(scrollYProgress, [0, 0.6], [1, 0.92]);
  const introY = useTransform(scrollYProgress, [0, 0.6], [0, -100]);
  const introBlur = useTransform(scrollYProgress, [0, 0.5], [0, 12]);
  const introFilter = useTransform(introBlur, (v) => `blur(${v}px)`);

  // Content reveal
  const contentOp = useTransform(scrollYProgress, [0.35, 0.75], [0, 1]);
  const contentY = useTransform(scrollYProgress, [0.35, 0.75], [50, 0]);

  return (
    <div ref={containerRef} className="relative" style={{ height: "200vh" }}>
      {/* Sticky viewport container */}
      <motion.div
        className="sticky top-0 z-30 h-screen overflow-hidden bg-[#1a1a2e]"
        style={{
          opacity: introOpacity,
          scale: introScale,
          y: introY,
          filter: introFilter,
        }}
      >
        {/* Dark gradient background (matching video) */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 50%, #2a2a45 0%, #1a1a2e 40%, #0f0f1e 100%)",
          }}
        />

        {/* Vignette */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background:
              "radial-gradient(ellipse 65% 55% at 50% 50%, transparent 20%, rgba(0,0,0,0.6) 100%)",
          }}
        />

        {/* Bokeh particle canvas */}
        <BokehCanvas onDissolveComplete={onDissolveComplete} />

        {/* Text content — revealed after particles dissolve */}
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="text-center px-6">
            {/* Accent line */}
            <motion.div
              className="h-px bg-accent/60 mx-auto mb-8"
              initial={{ width: 0, opacity: 0 }}
              animate={
                textRevealed ? { width: 48, opacity: 1 } : {}
              }
              transition={{
                duration: 1,
                delay: 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
            />

            {/* Overline */}
            <motion.p
              className="font-mono text-[0.65rem] tracking-[0.3em] uppercase text-white/40 mb-6"
              initial={{ opacity: 0, filter: "blur(8px)" }}
              animate={
                textRevealed
                  ? { opacity: 1, filter: "blur(0px)" }
                  : {}
              }
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Portfolio — 2024
            </motion.p>

            {/* Name — character dissolve reveal */}
            <h1 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-medium leading-[0.9] tracking-tight text-white">
              <span className="block">
                {textRevealed && (
                  <CharReveal text="Prateek" delay={0.3} />
                )}
              </span>
              <span className="block text-white/60">
                {textRevealed && (
                  <CharReveal
                    text="Kumar"
                    delay={0.65}
                    className="italic"
                  />
                )}
              </span>
            </h1>

            {/* Role */}
            <motion.p
              className="mt-7 font-mono text-xs tracking-[0.2em] uppercase text-white/35"
              initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
              animate={
                textRevealed
                  ? { opacity: 1, y: 0, filter: "blur(0px)" }
                  : {}
              }
              transition={{ duration: 0.9, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
            >
              Full Stack Developer &bull; SDE-2
            </motion.p>

            {/* Scroll indicator */}
            <motion.div
              className="mt-14 flex flex-col items-center gap-3"
              initial={{ opacity: 0 }}
              animate={textRevealed ? { opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 1.8 }}
            >
              <motion.span
                className="font-mono text-[0.6rem] tracking-[0.25em] uppercase text-white/20"
                animate={
                  textRevealed
                    ? { opacity: [0.2, 0.5, 0.2] }
                    : {}
                }
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 2.2,
                }}
              >
                Scroll to explore
              </motion.span>
              <motion.div
                className="w-px h-8 origin-top"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(255,255,255,0.25), transparent)",
                }}
                initial={{ scaleY: 0 }}
                animate={textRevealed ? { scaleY: 1 } : {}}
                transition={{ duration: 0.6, delay: 2.0 }}
              >
                <motion.div
                  className="w-full h-full origin-top"
                  animate={{ scaleY: [1, 0.3, 1] }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{
                    background:
                      "linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)",
                  }}
                />
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Fade from black on mount */}
        <motion.div
          className="absolute inset-0 bg-black z-40 pointer-events-none"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </motion.div>

      {/* Content reveal layer */}
      <motion.div
        className="sticky top-0 z-20 h-screen pointer-events-none"
        style={{ opacity: contentOp, y: contentY }}
      />
    </div>
  );
}
