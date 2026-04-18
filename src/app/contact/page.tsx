"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Send, CheckCircle, AlertCircle, Loader2, Briefcase } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/SocialIcons";
import SectionHeading from "@/components/SectionHeading";
import { personalData } from "@/lib/data";

type Status = "idle" | "sending" | "success" | "error";

function ContactForm() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (searchParams.get("hire") === "true") {
      setFormData((prev) => ({
        ...prev,
        subject: "Freelance Inquiry — Let's Work Together",
        message:
          "Hi Prateek,\n\nI'm interested in hiring you for a freelance project. Here are the details:\n\n• Project type: \n• Timeline: \n• Budget range: \n\nLooking forward to discussing further!",
      }));
      setTimeout(() => document.getElementById("name")?.focus(), 500);
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Something went wrong.");

      setStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Failed to send message.");
    }
  };

  const handleHireMe = () => {
    setFormData({
      name: "",
      email: "",
      subject: "Freelance Inquiry — Let's Work Together",
      message:
        "Hi Prateek,\n\nI'm interested in hiring you for a freelance project. Here are the details:\n\n• Project type: \n• Timeline: \n• Budget range: \n\nLooking forward to discussing further!",
    });
    setStatus("idle");
    document.getElementById("name")?.focus();
  };

  return (
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

          {personalData.phone && (
            <div>
              <span className="section-label">Phone</span>
              <p className="text-text mt-2">{personalData.phone}</p>
            </div>
          )}

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
                href={"https://www.linkedin.com/in/prateek-kumar-484461204"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted hover:text-text transition-colors text-sm"
              >
                <LinkedinIcon size={16} />
                <span className="font-mono text-xs tracking-wider uppercase">LinkedIn</span>
              </a>
            </div>
          </div>

          <hr className="editorial-hr" />

          {/* Hire Me CTA */}
          <div>
            <span className="section-label mb-4 block">Freelance</span>
            <p className="text-muted text-sm mb-4 leading-relaxed">
              Available for freelance projects — full-stack development, API
              design, real-time systems, and cloud architecture.
            </p>
            <motion.button
              onClick={handleHireMe}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-3 px-6 py-3 bg-accent text-bg font-mono text-xs tracking-[0.12em] uppercase rounded-none border border-accent hover:bg-accent/90 transition-colors w-full justify-center"
            >
              <Briefcase size={14} />
              Hire Me
              <ArrowRight size={14} />
            </motion.button>
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
                disabled={status === "sending"}
                className="w-full px-0 py-3 bg-transparent border-b border-border text-text text-sm placeholder:text-muted/40 focus:outline-none focus:border-text transition-colors disabled:opacity-50"
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
                disabled={status === "sending"}
                className="w-full px-0 py-3 bg-transparent border-b border-border text-text text-sm placeholder:text-muted/40 focus:outline-none focus:border-text transition-colors disabled:opacity-50"
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
              disabled={status === "sending"}
              className="w-full px-0 py-3 bg-transparent border-b border-border text-text text-sm placeholder:text-muted/40 focus:outline-none focus:border-text transition-colors disabled:opacity-50"
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
              disabled={status === "sending"}
              rows={6}
              className="w-full px-0 py-3 bg-transparent border-b border-border text-text text-sm placeholder:text-muted/40 focus:outline-none focus:border-text transition-colors resize-none disabled:opacity-50"
              placeholder="Tell me about your project or opportunity..."
            />
          </div>

          {/* Status messages */}
          {status === "success" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 text-success text-sm font-mono"
            >
              <CheckCircle size={16} />
              Message sent successfully! I&apos;ll get back to you soon.
            </motion.div>
          )}

          {status === "error" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 text-danger text-sm font-mono"
            >
              <AlertCircle size={16} />
              {errorMsg}
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={status === "sending"}
            whileHover={status !== "sending" ? { scale: 1.01 } : {}}
            whileTap={status !== "sending" ? { scale: 0.99 } : {}}
            className="arrow-link border border-border px-8 py-4 hover:bg-white/3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "sending" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            {status === "sending" ? "Sending..." : "Send Message"}
            <ArrowRight size={14} />
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

export default function ContactPage() {
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
          <Suspense>
            <ContactForm />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
