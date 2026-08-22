"use client";

import { motion } from "framer-motion";
import { ArrowDown, Play } from "lucide-react";

export default function Hero() {
  return (
    <section
      className="relative min-h-[60vh] flex flex-col items-center justify-center px-6 py-20 overflow-hidden"
      style={{ background: "var(--hero-bg)" }}
    >
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #CBD5E1 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Gradient orb */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20 blur-[120px]"
        style={{ background: "linear-gradient(135deg, #6366F1, #06B6D4)" }}
        animate={{ scale: [1, 1.05, 1], rotate: [0, 5, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 max-w-3xl text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-8 text-xs font-medium"
          style={{
            color: "var(--hero-muted)",
            borderColor: "var(--hero-border)",
            background: "white",
          }}
        >
          <span className="w-2 h-2 rounded-full bg-[var(--emerald)] animate-pulse" />
          Powered by Bright Data Scraper Studio
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-5"
          style={{ color: "var(--hero-text)" }}
        >
          Change Intelligence{" "}
          <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--cyan)] bg-clip-text text-transparent">
            Engine
          </span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-lg md:text-xl leading-relaxed mb-10 max-w-xl mx-auto"
          style={{ color: "var(--hero-muted)" }}
        >
          Monitor public web sources, detect meaningful changes, understand downstream impact, and notify the right systems — automatically.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-4"
        >
          <button
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-medium transition-transform hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "var(--accent)" }}
          >
            <Play size={16} fill="white" />
            Watch Demo
          </button>
          <a
            href="#playground"
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium border transition-all hover:border-[var(--accent)] hover:text-[var(--accent)]"
            style={{
              color: "var(--hero-text)",
              borderColor: "var(--hero-border)",
            }}
          >
            Try the Playground
            <ArrowDown size={14} />
          </a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <ArrowDown size={20} style={{ color: "var(--hero-muted)" }} />
      </motion.div>
    </section>
  );
}
