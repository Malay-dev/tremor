"use client";

import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative min-h-[65vh] flex flex-col items-center justify-center px-6 overflow-hidden halftone">
      {/* Radial gradient backdrop */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 60% 50% at 50% 45%, rgba(255,45,123,0.06) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 60% 55%, rgba(45,226,255,0.04) 0%, transparent 60%)"
      }} />

      {/* Diagonal accent line */}
      <motion.div
        className="absolute top-0 left-[20%] w-[1px] h-full rotate-[15deg] origin-top"
        style={{ background: "linear-gradient(180deg, transparent, var(--pink), transparent)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        transition={{ delay: 0.5 }}
      />
      <motion.div
        className="absolute top-0 right-[25%] w-[1px] h-full rotate-[-12deg] origin-top"
        style={{ background: "linear-gradient(180deg, transparent, var(--blue), transparent)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={{ delay: 0.7 }}
      />

      <div className="relative z-10 max-w-4xl text-center">
        {/* Overline */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded border text-[11px] font-medium uppercase tracking-widest mb-8"
          style={{ borderColor: "var(--border)", color: "var(--pink)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--pink)] animate-pulse" />
          Into the Scrape-Verse
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-[clamp(3rem,7vw,5.5rem)] font-black leading-[0.95] tracking-[-0.04em] mb-6"
        >
          <span className="block">Detect what</span>
          <span className="block chromatic">changed.</span>
          <span className="block" style={{ color: "var(--text-dim)" }}>Know what breaks.</span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-base md:text-lg max-w-lg mx-auto leading-relaxed mb-10"
          style={{ color: "var(--text-dim)" }}
        >
          Self-healing scrapers → semantic extraction → impact prediction.
          One pipeline. Nothing breaks silently.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="flex items-center justify-center gap-4"
        >
          <a
            href="#playground"
            className="px-5 py-2.5 text-sm font-semibold rounded border-2 transition-all hover:shadow-[0_0_20px_rgba(255,45,123,0.2)]"
            style={{ borderColor: "var(--pink)", color: "var(--pink)" }}
          >
            Open Playground ↓
          </a>
          <a
            href="#"
            className="px-5 py-2.5 text-sm font-medium rounded border transition-colors hover:border-[var(--blue)] hover:text-[var(--blue)]"
            style={{ borderColor: "var(--border)", color: "var(--text-dim)" }}
          >
            Watch Demo
          </a>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[var(--bg)] to-transparent" />
    </section>
  );
}
