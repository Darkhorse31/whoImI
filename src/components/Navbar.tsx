"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import DayNightToggle from "@/components/DayNightToggle";
import { useDayNight } from "@/context/DayNightContext";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/projects", label: "Works" },
  { href: "/experience", label: "Experience" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { mode } = useDayNight();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // In day mode use very dark navy text, in night use white
  const textBase = mode === "day" ? "text-[#1a1c2e]" : "text-white";
  const textMuted = mode === "day" ? "text-[#5a5d7a]" : "text-white/70";
  const textHover = mode === "day" ? "hover:text-[#1a1c2e]" : "hover:text-white";
  const activeUnderline = mode === "day" ? "bg-[#1a1c2e]" : "bg-white";
  const borderMuted = mode === "day" ? "border-[#d2d3db]" : "border-white/10";
  const hireBtn = mode === "day"
    ? "border-[#1a1c2e]/50 text-[#1a1c2e] hover:bg-[#1a1c2e]/10 hover:border-[#1a1c2e]/80"
    : "border-white/30 text-white hover:bg-white/15 hover:border-white/50";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "nav-glass-scrolled border-b border-white/10"
          : "nav-glass border-b border-white/5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="group">
            <span className={`font-display text-lg tracking-wide transition-colors ${textBase} group-hover:opacity-70`}>
              P—K
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative text-xs font-mono tracking-[0.12em] uppercase transition-colors duration-200 ${
                    isActive
                      ? textBase
                      : `${textMuted} ${textHover}`
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className={`absolute -bottom-1 left-0 right-0 h-px ${activeUnderline}`}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Hire Me CTA + Day/Night Toggle */}
          <div className="hidden md:flex items-center gap-4">
            <DayNightToggle />
            <Link
              href="/contact?hire=true"
              className={`inline-flex items-center gap-2 text-xs font-mono tracking-[0.12em] uppercase px-4 py-2 border transition-all duration-200 backdrop-blur-sm ${hireBtn}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Hire Me
            </Link>
          </div>

          {/* Mobile toggle */}
          <div className="md:hidden flex items-center gap-3">
            <DayNightToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`p-2 ${textMuted} ${textHover}`}
              aria-label={isOpen ? "Close menu" : "Open menu"}
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden nav-glass-scrolled border-b border-white/10"
          >
            <div className="px-6 py-6 space-y-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block py-3 text-sm font-mono tracking-wider uppercase border-b ${borderMuted} transition-colors ${
                      isActive ? textBase : `${textMuted} ${textHover}`
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
