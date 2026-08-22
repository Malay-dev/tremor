"use client";

import { Handle, Position } from "@xyflow/react";
import { motion } from "framer-motion";
import { Brain } from "lucide-react";

const STEPS = ["Extract Entities", "Build Graph", "Detect Changes", "Classify Shifts", "Score Severity"];

export default function EngineNode() {
  return (
    <div className="relative rounded-2xl px-5 py-4 min-w-[240px] border cursor-grab active:cursor-grabbing"
      style={{
        background: "radial-gradient(ellipse at center, rgba(99,102,241,0.08) 0%, var(--canvas-surface) 70%)",
        borderColor: "rgba(99,102,241,0.3)",
        boxShadow: "0 0 40px rgba(99,102,241,0.1)",
      }}>
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-cyan-500 !border-2 !border-[var(--canvas-surface)]" />

      {/* Subtle ring animation */}
      <motion.div
        className="absolute -inset-[1px] rounded-2xl border border-indigo-500/20 pointer-events-none"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(99,102,241,0.15)" }}>
          <Brain size={16} style={{ color: "var(--accent)" }} />
        </div>
        <div>
          <div className="text-[13px] font-semibold" style={{ color: "var(--canvas-text)" }}>Semantic Engine</div>
          <div className="text-[10px]" style={{ color: "var(--accent-light)" }}>Gemini 2.5 Flash</div>
        </div>
      </div>

      <div className="space-y-1">
        {STEPS.map((step, i) => (
          <motion.div
            key={step}
            className="flex items-center gap-2 text-[11px]"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.5 }}
          >
            <motion.span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--accent)" }}
              animate={{ scale: [0.8, 1.3, 0.8] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.5 }}
            />
            <span style={{ color: "var(--canvas-muted)" }}>{step}</span>
          </motion.div>
        ))}
      </div>

      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-violet-500 !border-2 !border-[var(--canvas-surface)]" />
    </div>
  );
}
