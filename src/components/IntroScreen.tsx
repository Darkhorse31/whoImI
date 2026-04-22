"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function IntroScreen() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Intro screen fades out as user scrolls through the container
  const introOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const introScale = useTransform(scrollYProgress, [0, 0.6], [1, 0.92]);
  const introY = useTransform(scrollYProgress, [0, 0.6], [0, -80]);
  const introBlur = useTransform(scrollYProgress, [0, 0.5], [0, 10]);

  // Content fades in as intro fades out
  const contentOpacity = useTransform(scrollYProgress, [0.3, 0.7], [0, 1]);
  const contentY = useTransform(scrollYProgress, [0.3, 0.7], [60, 0]);

  return (
    <div ref={containerRef} className="relative" style={{ height: "200vh" }}>
      {/* Intro / Presentation Screen — pinned to viewport */}
      <motion.div
        className="sticky top-0 z-30 flex items-center justify-center h-screen overflow-hidden"
        style={{
          opacity: introOpacity,
          scale: introScale,
          y: introY,
          filter: useTransform(introBlur, (v) => `blur(${v}px)`),
        }}
      >
        <div className="text-center px-6">
          {/* Decorative line */}
          <motion.div
            className="w-12 h-px bg-accent mx-auto mb-8"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          />

          {/* Overline */}
          <motion.p
            className="font-mono text-[0.65rem] tracking-[0.25em] uppercase text-muted/60 mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Portfolio — 2024
          </motion.p>

          {/* Name */}
          <motion.h1
            className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-medium leading-[0.9] tracking-tight text-text"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <span className="block">Prateek</span>
            <span className="block italic text-muted/70">Kumar</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="mt-6 font-mono text-xs tracking-[0.15em] uppercase text-muted/50"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            Full Stack Developer &bull; SDE-2
          </motion.p>

          {/* Scroll indicator */}
          <motion.div
            className="mt-14 flex flex-col items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            <span className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-muted/40">
              Scroll to explore
            </span>
            <motion.div
              className="w-px h-8 bg-muted/30"
              animate={{ scaleY: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformOrigin: "top" }}
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Content reveal layer — also pinned, appears as intro fades */}
      <motion.div
        className="sticky top-0 z-20 h-screen pointer-events-none"
        style={{ opacity: contentOpacity, y: contentY }}
      />
    </div>
  );
}
