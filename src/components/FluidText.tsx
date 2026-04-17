"use client";

import { useRef, useEffect, useCallback } from "react";

interface FluidTextProps {
  text: string;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
}

export default function FluidText({ text, className = "" }: FluidTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lettersRef = useRef<HTMLSpanElement[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999, active: false });
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  const initParticles = useCallback(() => {
    particlesRef.current = lettersRef.current.map(() => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      mass: 0.8 + Math.random() * 0.4,
    }));
  }, []);

  useEffect(() => {
    initParticles();

    const onMouseMove = (e: MouseEvent) => {
      prevMouseRef.current = { ...mouseRef.current };
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    };
    const onMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);

    const SPRING = 0.045;
    const DAMPING = 0.88;
    const REPULSION = 60;
    const REPULSION_RADIUS = 180;
    const NEIGHBOR_COUPLING = 0.15;

    const animate = () => {
      const letters = lettersRef.current;
      const particles = particlesRef.current;
      const mouse = mouseRef.current;

      const mouseVx = mouse.x - prevMouseRef.current.x;
      const mouseVy = mouse.y - prevMouseRef.current.y;
      const mouseSpeed = Math.sqrt(mouseVx * mouseVx + mouseVy * mouseVy);

      for (let i = 0; i < letters.length; i++) {
        const el = letters[i];
        const p = particles[i];
        if (!el || !p) continue;

        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2 - p.x;
        const centerY = rect.top + rect.height / 2 - p.y;

        let fx = 0;
        let fy = 0;

        // Mouse repulsion
        if (mouse.active) {
          const dx = centerX - mouse.x;
          const dy = centerY - mouse.y;
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq);

          if (dist < REPULSION_RADIUS && dist > 1) {
            const strength = REPULSION / (distSq / 200 + 10);
            const impact = 1 + mouseSpeed * 0.05;
            fx += (dx / dist) * strength * impact / p.mass;
            fy += (dy / dist) * strength * impact / p.mass;
          }
        }

        // Spring back to origin
        fx -= p.x * SPRING;
        fy -= p.y * SPRING;

        // Neighbor coupling
        if (i > 0 && particles[i - 1]) {
          const prev = particles[i - 1];
          fx += (prev.x - p.x) * NEIGHBOR_COUPLING;
          fy += (prev.y - p.y) * NEIGHBOR_COUPLING;
        }
        if (i < particles.length - 1 && particles[i + 1]) {
          const next = particles[i + 1];
          fx += (next.x - p.x) * NEIGHBOR_COUPLING;
          fy += (next.y - p.y) * NEIGHBOR_COUPLING;
        }

        // Integrate
        p.vx = (p.vx + fx) * DAMPING;
        p.vy = (p.vy + fy) * DAMPING;
        p.x += p.vx;
        p.y += p.vy;

        // Render
        const rotation = p.vx * 0.6;
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const glow = Math.min(speed * 0.15, 1);

        el.style.transform = `translate(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px) rotate(${rotation.toFixed(2)}deg)`;

        if (glow > 0.05) {
          el.style.textShadow = `0 0 ${8 + glow * 25}px rgba(77,134,155,${glow * 0.6}), 0 0 ${4 + glow * 15}px rgba(136,186,200,${glow * 0.4})`;
        } else {
          el.style.textShadow = "";
        }
      }

      prevMouseRef.current = { x: mouse.x, y: mouse.y };
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      cancelAnimationFrame(animRef.current);
    };
  }, [initParticles]);

  const setLetterRef = useCallback((el: HTMLSpanElement | null, index: number) => {
    if (el) lettersRef.current[index] = el;
  }, []);

  return (
    <div ref={containerRef} className={`inline-block ${className}`}>
      {text.split("").map((char, i) => (
        <span
          key={i}
          ref={(el) => setLetterRef(el, i)}
          className={`inline-block will-change-transform ${
            char === " " ? "w-[0.3em]" : ""
          }`}
          style={{ display: "inline-block", cursor: "default" }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </div>
  );
}
