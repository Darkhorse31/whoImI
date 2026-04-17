"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";
import { projects } from "@/lib/data";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function ProjectsPage() {
  return (
    <div className="page-enter pt-24 lg:pt-32">
      <section className="px-6 lg:px-12 pb-32">
        <div className="max-w-7xl mx-auto">
          <SectionHeading
            number="03"
            label="Projects"
            title="Selected Work"
            subtitle="Real-world applications I've built — from AI platforms to peer-to-peer marketplaces."
          />

          <div className="space-y-0 mt-16">
            {projects.map((project, index) => (
              <motion.div
                key={project.title}
                custom={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <div className="group py-12 lg:py-16 border-b border-border">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
                    {/* Left — Number + Title */}
                    <div className="lg:col-span-5">
                      <span className="font-display text-5xl lg:text-6xl italic text-muted/20 block mb-4">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h3 className="font-display text-3xl md:text-4xl font-medium text-text group-hover:text-white transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-muted text-base mt-3 leading-relaxed">
                        {project.description}
                      </p>

                      {/* Tech stack */}
                      <div className="flex flex-wrap gap-2 mt-6">
                        {project.tech.map((t) => (
                          <span key={t} className="skill-tag">{t}</span>
                        ))}
                      </div>
                    </div>

                    {/* Right — Highlights + Links */}
                    <div className="lg:col-span-7">
                      <p className="section-label mb-4">Key Achievements</p>
                      <ul className="space-y-4">
                        {project.highlights.map((h, i) => (
                          <li
                            key={i}
                            className="flex gap-4 text-muted text-sm leading-relaxed"
                          >
                            <span className="text-border font-mono text-xs mt-0.5 shrink-0">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="flex gap-4 mt-8">
                        {project.link && (
                          <a
                            href={project.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="arrow-link"
                          >
                            View Project <ArrowUpRight size={14} />
                          </a>
                        )}
                        {"links" in project && project.links && (
                          <>
                            <a
                              href={(project.links as { web: string; app: string }).web}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="arrow-link"
                            >
                              Web <ArrowUpRight size={14} />
                            </a>
                            <a
                              href={(project.links as { web: string; app: string }).app}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="arrow-link text-muted"
                            >
                              App <ArrowUpRight size={14} />
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
