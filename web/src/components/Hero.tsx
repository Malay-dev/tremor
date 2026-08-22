"use client";

import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="pt-32 pb-16 px-6">
      <div className="max-w-[800px] mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-[clamp(2.5rem,5vw,3.75rem)] font-semibold tracking-[-0.035em] leading-[1.1]"
          style={{ color: "var(--text)" }}
        >
          Detect what changed.{" "}
          <span style={{ color: "var(--text-secondary)" }}>
            Know what breaks.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-5 text-[17px] leading-[1.6] max-w-[560px]"
          style={{ color: "var(--text-tertiary)" }}
        >
          Tremor monitors web sources for semantic changes and predicts
          which enterprise integrations will fail — before they do.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 flex items-center gap-3"
        >
          <a
            href="#playground"
            className="text-[13px] font-medium px-4 py-2 rounded-lg transition-colors"
            style={{ background: "var(--accent)", color: "white" }}
          >
            Open Playground
          </a>
          <a
            href="#"
            className="text-[13px] font-medium px-4 py-2 rounded-lg border transition-colors hover:border-[var(--text-tertiary)]"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >
            Watch Demo
          </a>
        </motion.div>
      </div>
    </section>
  );
}
