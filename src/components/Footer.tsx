import Link from "next/link";
import { personalData } from "@/lib/data";
import { GithubIcon, LinkedinIcon } from "@/components/SocialIcons";

export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
        {/* Top section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-16">
          {/* Brand */}
          <div className="lg:col-span-5">
            <Link href="/" className="inline-block mb-6">
              <span className="font-display text-2xl text-text">P—K</span>
            </Link>
            <p className="text-sm text-muted leading-relaxed max-w-sm">
              Building for scale — full-stack development<br />
              with a focus on real-time systems & cloud infrastructure.
            </p>
          </div>

          {/* Navigation */}
          <div className="lg:col-span-3">
            <p className="section-label mb-4">Navigation</p>
            <div className="space-y-3">
              {[
                { href: "/", label: "Home" },
                { href: "/about", label: "About" },
                { href: "/projects", label: "Works" },
                { href: "/experience", label: "Experience" },
                { href: "/contact", label: "Contact" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-sm text-muted hover:text-text transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="lg:col-span-4">
            <p className="section-label mb-4">Connect</p>
            <div className="space-y-3">
              <a
                href={`mailto:${personalData.email}`}
                className="block text-sm text-muted hover:text-text transition-colors"
              >
                {personalData.email} →
              </a>
              <p className="text-sm text-muted">{personalData.phone}</p>
              <p className="text-sm text-muted">{personalData.location}</p>
              <div className="flex gap-4 pt-2">
                <a
                  href={personalData.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted hover:text-text transition-colors"
                  aria-label="GitHub"
                >
                  <GithubIcon size={16} />
                </a>
                <a
                  href={personalData.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted hover:text-text transition-colors"
                  aria-label="LinkedIn"
                >
                  <LinkedinIcon size={16} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <hr className="editorial-hr mb-8" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted font-mono">
            © {new Date().getFullYear()} Prateek Kumar
          </p>
          <p className="text-xs text-muted font-mono">
            Built with Next.js & Framer Motion
          </p>
        </div>
      </div>
    </footer>
  );
}
