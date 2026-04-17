"use client";

import { motion } from "framer-motion";

interface SectionHeadingProps {
  label: string;
  title: string;
  subtitle?: string;
  number?: string;
}

export default function SectionHeading({ label, title, subtitle, number }: SectionHeadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="mb-20"
    >
      <div className="flex items-center gap-4 mb-6">
        {number && (
          <span className="font-display text-5xl italic text-muted/30">{number}</span>
        )}
        <span className="section-label">{label}</span>
      </div>
      <h2 className="font-display text-4xl md:text-6xl lg:text-7xl font-medium text-text leading-[1.05] tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-6 text-muted text-base max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      )}
      <hr className="editorial-hr mt-10" />
    </motion.div>
  );
}
