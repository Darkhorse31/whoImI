"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Send } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/SocialIcons";
import SectionHeading from "@/components/SectionHeading";
import { personalData } from "@/lib/data";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mailtoLink = `mailto:${personalData.email}?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(`Hi Prateek,\n\n${formData.message}\n\nBest,\n${formData.name}\n${formData.email}`)}`;
    window.location.href = mailtoLink;
  };

  return (
    <div className="page-enter pt-24 lg:pt-32">
      <section className="px-6 lg:px-12 pb-32">
        <div className="max-w-7xl mx-auto">
          <SectionHeading
            number="05"
            label="Contact"
            title="Get in Touch"
            subtitle="Have a project in mind or want to discuss opportunities? I'd love to hear from you."
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mt-16">
            {/* Left — Contact info */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="lg:col-span-4"
            >
              <div className="sticky top-28 space-y-10">
                <div>
                  <span className="section-label">Email</span>
                  <a
                    href={`mailto:${personalData.email}`}
                    className="block font-display text-lg text-text mt-2 hover:text-white transition-colors"
                  >
                    {personalData.email} →
                  </a>
                </div>

                <div>
                  <span className="section-label">Phone</span>
                  <p className="text-text mt-2">{personalData.phone}</p>
                </div>

                <div>
                  <span className="section-label">Location</span>
                  <p className="text-text mt-2">{personalData.location}</p>
                </div>

                <hr className="editorial-hr" />

                <div>
                  <span className="section-label mb-4 block">Connect</span>
                  <div className="flex gap-6">
                    <a
                      href={personalData.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-muted hover:text-text transition-colors text-sm"
                    >
                      <GithubIcon size={16} />
                      <span className="font-mono text-xs tracking-wider uppercase">GitHub</span>
                    </a>
                    <a
                      href={'https://www.linkedin.com/in/prateek-kumar-484461204'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-muted hover:text-text transition-colors text-sm"
                    >
                      <LinkedinIcon size={16} />
                      <span className="font-mono text-xs tracking-wider uppercase">LinkedIn</span>
                    </a>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="inline-flex items-center gap-2 text-xs font-mono text-success tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    Available for opportunities
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Right — Form */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="lg:col-span-8"
            >
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div>
                    <label htmlFor="name" className="section-label mb-3 block">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-0 py-3 bg-transparent border-b border-border text-text text-sm placeholder:text-muted/40 focus:outline-none focus:border-text transition-colors"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="section-label mb-3 block">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-0 py-3 bg-transparent border-b border-border text-text text-sm placeholder:text-muted/40 focus:outline-none focus:border-text transition-colors"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="section-label mb-3 block">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-0 py-3 bg-transparent border-b border-border text-text text-sm placeholder:text-muted/40 focus:outline-none focus:border-text transition-colors"
                    placeholder="What's this about?"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="section-label mb-3 block">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-0 py-3 bg-transparent border-b border-border text-text text-sm placeholder:text-muted/40 focus:outline-none focus:border-text transition-colors resize-none"
                    placeholder="Tell me about your project or opportunity..."
                  />
                </div>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="arrow-link border border-border px-8 py-4 hover:bg-white/3 transition-all"
                >
                  <Send size={14} />
                  Send Message
                  <ArrowRight size={14} />
                </motion.button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
