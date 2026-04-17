import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { personalData } from "@/lib/data";

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-screen flex items-end pb-24 lg:pb-32 overflow-hidden">
        <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-12 w-full">
          {/* Overline */}
          <div className="mb-8">
            <span className="section-label">Full Stack Developer</span>
          </div>

          {/* Name */}
          <h1 className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-[9rem] font-medium leading-[0.9] tracking-tight text-text mb-8">
            <span className="block">Prateek</span>
            <span className="block italic text-muted">Kumar</span>
          </h1>

          {/* Tagline */}
          <div className="max-w-xl mb-12">
            <p className="text-base text-muted leading-relaxed">
              {personalData.tagline}. SDE-2 with {personalData.experience} building
              scalable real-time systems, APIs, and cloud infrastructure.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-8">
            <Link href="/projects" className="arrow-link">
              View Works <ArrowRight size={14} />
            </Link>
            <Link href="/contact" className="arrow-link text-muted">
              Get in Touch <ArrowRight size={14} />
            </Link>
          </div>

          {/* Scroll line */}
          <div className="absolute bottom-8 left-6 lg:left-12 flex items-center gap-4">
            <div className="w-px h-16 bg-border" />
            <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-muted rotate-0">
              Scroll
            </span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-32 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <hr className="editorial-hr mb-16" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
            {personalData.stats.map((stat, i) => (
              <div key={stat.label} className="group">
                <span className="font-display text-xs text-muted/40 italic block mb-3">
                  0{i + 1}.
                </span>
                <div className="font-display text-4xl md:text-5xl font-medium text-text mb-2">
                  {stat.value}
                </div>
                <div className="text-xs text-muted font-mono tracking-wider uppercase">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Excerpt */}
      <section className="py-32 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-4">
              <span className="section-label">01. About</span>
            </div>
            <div className="lg:col-span-8">
              <p className="font-display text-2xl md:text-3xl lg:text-4xl font-medium text-text leading-[1.3] mb-10">
                I build the parts that connect UI to infrastructure — real-time
                messaging, data pipelines, and APIs that scale.
              </p>
              <p className="text-muted text-base leading-relaxed max-w-2xl mb-10">
                {personalData.profile}
              </p>
              <Link href="/about" className="arrow-link">
                More About Me <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto text-center">
          <hr className="editorial-hr mb-20" />
          <h2 className="font-display text-4xl md:text-6xl lg:text-7xl font-medium text-text mb-6">
            Let&apos;s Build<br />
            <span className="italic text-muted">Something Together</span>
          </h2>
          <p className="text-muted text-base max-w-lg mx-auto mb-10">
            Open to new opportunities. Let&apos;s discuss how I can contribute to your team.
          </p>
          <Link href="/contact" className="arrow-link justify-center">
            Get in Touch <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
}
