"use client";

import { motion, type Variants } from "framer-motion";
import { ReactNode } from "react";

type AnimationType = "fade-in" | "slide-up" | "slide-down" | "slide-left" | "slide-right" | "scale" | "fade-scale";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  /** Animation style. Default: "fade-in" */
  animation?: AnimationType;
  /** Duration in seconds. Default: 0.6 */
  duration?: number;
  /** Delay in seconds. Default: 0 */
  delay?: number;
  /** If true, animation plays only once. Default: true */
  once?: boolean;
  /** Viewport margin for triggering earlier/later. Default: "-80px" */
  viewportMargin?: string;
  /** Amount of element visible before triggering (0–1). Default: 0.15 */
  threshold?: number;
}

const variants: Record<AnimationType, Variants> = {
  "fade-in": {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  "slide-up": {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0 },
  },
  "slide-down": {
    hidden: { opacity: 0, y: -60 },
    visible: { opacity: 1, y: 0 },
  },
  "slide-left": {
    hidden: { opacity: 0, x: -60 },
    visible: { opacity: 1, x: 0 },
  },
  "slide-right": {
    hidden: { opacity: 0, x: 60 },
    visible: { opacity: 1, x: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.85 },
    visible: { opacity: 1, scale: 1 },
  },
  "fade-scale": {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
  },
};

export default function ScrollReveal({
  children,
  className,
  animation = "fade-in",
  duration = 0.6,
  delay = 0,
  once = true,
  viewportMargin = "-80px",
  threshold = 0.15,
}: ScrollRevealProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: viewportMargin, amount: threshold }}
      variants={variants[animation]}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={className}
      style={{ willChange: "opacity, transform" }}
    >
      {children}
    </motion.div>
  );
}

/* ── Staggered children wrapper ── */

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  /** Stagger delay between children. Default: 0.1 */
  stagger?: number;
  once?: boolean;
  viewportMargin?: string;
}

export function StaggerContainer({
  children,
  className,
  stagger = 0.1,
  once = true,
  viewportMargin = "-80px",
}: StaggerContainerProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: viewportMargin }}
      variants={{
        visible: {
          transition: { staggerChildren: stagger },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  animation?: AnimationType;
  duration?: number;
}

export function StaggerItem({
  children,
  className,
  animation = "slide-up",
  duration = 0.5,
}: StaggerItemProps) {
  return (
    <motion.div
      variants={variants[animation]}
      transition={{ duration, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
      style={{ willChange: "opacity, transform" }}
    >
      {children}
    </motion.div>
  );
}
