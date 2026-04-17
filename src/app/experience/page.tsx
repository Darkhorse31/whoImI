"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import SectionHeading from "@/components/SectionHeading";
import { experience, personalData } from "@/lib/data";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function ExperiencePage() {
  return (
    <div className="page-enter pt-24 lg:pt-32">
      <section className="px-6 lg:px-12 pb-32">
        <div className="max-w-7xl mx-auto">
          <SectionHeading
            number="04"
            label="Experience"
            title="Career Journey"
            subtitle="Professional experience building scalable products across multiple industries."
          />

          {/* Timeline */}
          <div className="mt-16 space-y-0">
            {experience.map((job, index) => (
              <motion.div
                key={index}
                custom={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="border-b border-border"
              >
                <div className="py-12 lg:py-16">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
                    {/* Left — Meta */}
                    <div className="lg:col-span-4">
                      <span className="font-display text-5xl italic text-muted/20 block mb-4">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h3 className="font-display text-2xl md:text-3xl font-medium text-text">
                        {job.company}
                      </h3>
                      <p className="text-xs font-mono text-muted tracking-wider uppercase mt-2">
                        {job.role}
                      </p>
                      <div className="flex flex-wrap gap-4 mt-4 text-xs font-mono text-muted/60">
                        <span>{job.period}</span>
                        <span>{job.location}</span>
                      </div>
                    </div>

                    {/* Right — Highlights */}
                    <div className="lg:col-span-8">
                      <ul className="space-y-4">
                        {job.highlights.map((highlight, i) => (
                          <li
                            key={i}
                            className="flex gap-4 text-muted text-sm leading-relaxed group"
                          >
                            <span className="text-border font-mono text-xs mt-0.5 shrink-0">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <span className="group-hover:text-text transition-colors">
                              {highlight}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Impact */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mt-32"
          >
            <hr className="editorial-hr mb-16" />
            <h3 className="section-label mb-12">Impact at a Glance</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
              {personalData.stats.map((stat, i) => (
                <div key={stat.label}>
                  <span className="font-display text-xs text-muted/40 italic block mb-2">
                    0{i + 1}.
                  </span>
                  <div className="font-display text-3xl md:text-4xl font-medium text-text">
                    {stat.value}
                  </div>
                  <div className="text-xs font-mono text-muted tracking-wider uppercase mt-2">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Education */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mt-24"
          >
            <hr className="editorial-hr mb-12" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4">
                <span className="section-label">Education</span>
              </div>
              <div className="lg:col-span-8">
                <p className="font-display text-xl text-text">{personalData.education.degree}</p>
                <p className="text-sm text-muted font-mono mt-2">{personalData.education.institution}</p>
              </div>
            </div>
          </motion.div>

          <div className="mt-20 text-center">
            <Link href="/projects" className="arrow-link justify-center">
              See My Work <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
