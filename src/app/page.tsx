import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { personalData } from "@/lib/data";
import IntroScreen from "@/components/IntroScreen";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ScrollReveal";

export default function HomePage() {
  return (
    <div>
      {/* Intro / Presentation Screen — scrolls away to reveal content */}
      <IntroScreen />

      {/* Hero */}
      <section className="relative min-h-screen flex items-end pb-24 lg:pb-32 overflow-hidden">
        <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-12 w-full">
          {/* Overline */}
          <ScrollReveal animation="fade-in" delay={0.1}>
            <div className="mb-8">
              <span className="hero-label font-mono">Full Stack Developer</span>
            </div>
          </ScrollReveal>

          {/* Name */}
          <ScrollReveal animation="slide-up" duration={0.8}>
            <h1 className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-[9rem] font-medium leading-[0.9] tracking-tight mb-8">
              <span className="block hero-title">Prateek</span>
              <span className="block italic hero-title-muted">Kumar</span>
            </h1>
          </ScrollReveal>

          {/* Tagline */}
          <ScrollReveal animation="fade-in" delay={0.2} duration={0.7}>
            <div className="max-w-xl mb-12">
              <p className="text-base hero-tagline leading-relaxed">
                {personalData.tagline}. SDE-2 with {personalData.experience} building
                scalable real-time systems, APIs, and cloud infrastructure.
              </p>
            </div>
          </ScrollReveal>

          {/* CTAs */}
          <ScrollReveal animation="slide-up" delay={0.3}>
            <div className="flex items-center gap-8">
              <Link href="/projects" className="arrow-link hero-title">
                View Works <ArrowRight size={14} />
              </Link>
              <Link href="/contact" className="arrow-link hero-title-muted">
                Get in Touch <ArrowRight size={14} />
              </Link>
            </div>
          </ScrollReveal>

          {/* Scroll line */}
          <div className="absolute bottom-8 left-6 lg:left-12 flex items-center gap-4">
            <div className="w-px h-16 bg-white/40" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-32 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal animation="fade-in">
            <hr className="editorial-hr mb-16" />
          </ScrollReveal>
          <StaggerContainer stagger={0.12} className="grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
            {personalData.stats.map((stat, i) => (
              <StaggerItem key={stat.label} animation="slide-up">
                <div className="group">
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
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* About Excerpt */}
      <section className="py-32 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <ScrollReveal animation="fade-in" className="lg:col-span-4">
              <span className="section-label">01. About</span>
            </ScrollReveal>
            <div className="lg:col-span-8">
              <ScrollReveal animation="slide-up" duration={0.7}>
                <p className="font-display text-2xl md:text-3xl lg:text-4xl font-medium text-text leading-[1.3] mb-10">
                  I build the parts that connect UI to infrastructure — real-time
                  messaging, data pipelines, and APIs that scale.
                </p>
              </ScrollReveal>
              <ScrollReveal animation="fade-in" delay={0.15}>
                <p className="text-muted text-base leading-relaxed max-w-2xl mb-10">
                  {personalData.profile}
                </p>
              </ScrollReveal>
              <ScrollReveal animation="slide-left" delay={0.25}>
                <Link href="/about" className="arrow-link">
                  More About Me <ArrowRight size={14} />
                </Link>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto text-center">
          <ScrollReveal animation="fade-in">
            <hr className="editorial-hr mb-20" />
          </ScrollReveal>
          <ScrollReveal animation="fade-scale" duration={0.8}>
            <h2 className="font-display text-4xl md:text-6xl lg:text-7xl font-medium text-text mb-6">
              Let&apos;s Build<br />
              <span className="italic text-muted">Something Together</span>
            </h2>
          </ScrollReveal>
          <ScrollReveal animation="fade-in" delay={0.15}>
            <p className="text-muted text-base max-w-lg mx-auto mb-10">
              Open to new opportunities and freelance projects. Let&apos;s discuss how I can contribute to your team.
            </p>
          </ScrollReveal>
          <ScrollReveal animation="slide-up" delay={0.25}>
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <Link href="/contact?hire=true" className="inline-flex items-center gap-3 px-8 py-4 bg-accent text-bg font-mono text-xs tracking-[0.12em] uppercase hover:bg-accent/90 transition-colors">
                Hire Me <ArrowRight size={14} />
              </Link>
              <Link href="/contact" className="arrow-link">
                Get in Touch <ArrowRight size={14} />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
