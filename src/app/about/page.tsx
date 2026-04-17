"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import SectionHeading from "@/components/SectionHeading";
import { personalData, skills } from "@/lib/data";

const skillGroups = [
  { title: "Languages", items: skills.languages },
  { title: "Frontend", items: skills.frontend },
  { title: "Backend", items: skills.backend },
  { title: "Data & Storage", items: skills.dataStorage },
  { title: "Cloud / DevOps", items: skills.cloudDevops },
  { title: "Observability", items: skills.observability },
  { title: "AI / LLM", items: skills.aiLlm },
  { title: "Integrations", items: skills.integrations },
  { title: "Tooling", items: skills.tooling },
];

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function AboutPage() {
  return (
    <div className="page-enter pt-24 lg:pt-32">
      {/* Hero */}
      <section className="px-6 lg:px-12 pb-32">
        <div className="max-w-7xl mx-auto">
          <SectionHeading
            number="01"
            label="About"
            title="Who I Am"
            subtitle="A full-stack engineer passionate about building scalable systems that connect users to infrastructure."
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mt-16">
            {/* Left — Bio */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="lg:col-span-4"
            >
              <div className="sticky top-28 space-y-8">
                {/* Initials */}
                <div className="w-20 h-20 border border-border flex items-center justify-center">
                  <span className="font-display text-2xl italic text-muted">PK</span>
                </div>

                <div>
                  <h3 className="font-display text-xl text-text">{personalData.name}</h3>
                  <p className="text-xs font-mono text-muted mt-1 tracking-wider uppercase">
                    {personalData.title} · {personalData.role}
                  </p>
                </div>

                <div className="space-y-3 text-sm text-muted">
                  <p>{personalData.location}</p>
                  <p>{personalData.experience} Experience</p>
                  <p>{personalData.education.degree}</p>
                  <p className="text-muted/60">{personalData.education.institution}</p>
                </div>

                <div className="pt-4">
                  <span className="inline-flex items-center gap-2 text-xs font-mono text-success tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    Open to Opportunities
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Right — Profile + Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="lg:col-span-8"
            >
              <p className="font-display text-2xl md:text-3xl font-medium text-text leading-[1.35] mb-10">
                I focus on the parts that connect UI to infrastructure — building
                real-time systems, optimizing data pipelines, and shipping features
                that make a measurable difference.
              </p>

              <p className="text-muted text-base leading-relaxed mb-16">
                {personalData.profile}
              </p>

              {/* Stats */}
              <hr className="editorial-hr mb-12" />
              <div className="grid grid-cols-2 gap-10">
                {personalData.stats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    custom={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                  >
                    <div className="font-display text-3xl md:text-4xl font-medium text-text">
                      {stat.value}
                    </div>
                    <div className="text-xs font-mono text-muted tracking-wider uppercase mt-2">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Skills */}
      <section className="px-6 lg:px-12 py-32 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <SectionHeading
            number="02"
            label="Skills"
            title="Technical Arsenal"
            subtitle="Technologies and tools I work with across the full stack."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
            {skillGroups.map((group, i) => (
              <motion.div
                key={group.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="glass-card p-6"
              >
                <h3 className="section-label mb-4">{group.title}</h3>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span key={item} className="skill-tag">{item}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

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
