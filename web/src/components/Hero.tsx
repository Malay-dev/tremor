"use client";

import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative min-h-[60vh] flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Subtle gradient behind hero text */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(99,102,241,0.06) 0%, transparent 70%)"
      }} />

      <div className="relative z-10 max-w-4xl text-center">
        {/* Overline */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded border text-[11px] font-medium uppercase tracking-widest mb-8"
          style={{ borderColor: "#E2E8F0", color: "#64748B", background: "white" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF2D7B] animate-pulse" />
          Into the Scrape-Verse
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-[clamp(2.8rem,6vw,4.5rem)] font-black leading-[0.95] tracking-[-0.04em] mb-6"
          style={{ color: "#0F172A" }}
        >
          <span className="block">Detect what changed.</span>
          <span className="block" style={{ color: "#94A3B8" }}>Know what breaks.</span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-base md:text-lg max-w-lg mx-auto leading-relaxed mb-10"
          style={{ color: "#64748B" }}
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
            className="px-5 py-2.5 text-sm font-semibold rounded-lg text-white transition-all hover:opacity-90"
            style={{ background: "#0F172A" }}
          >
            Open Playground ↓
          </a>
          <a
            href="#"
            className="px-5 py-2.5 text-sm font-medium rounded-lg border transition-colors hover:border-[#0F172A]"
            style={{ borderColor: "#E2E8F0", color: "#64748B" }}
          >
            Watch Demo
          </a>
        </motion.div>
      </div>
    </section>
  );
}
