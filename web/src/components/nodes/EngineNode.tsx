"use client";

import { Handle, Position } from "@xyflow/react";
import { motion } from "framer-motion";
import TremorLogo from "../icons/TremorLogo";

const STEPS = ["Extracting entities", "Building semantic graph", "Detecting shifts", "Scoring severity"];

export default function EngineNode() {
  return (
    <div
      className="rounded-[12px] px-4 py-4 w-[250px] border cursor-grab active:cursor-grabbing"
      style={{
        background: "var(--bg-card)",
        borderColor: "rgba(124, 92, 252, 0.25)",
        boxShadow: "0 0 0 1px rgba(124,92,252,0.08), 0 8px 32px rgba(124,92,252,0.06)",
      }}
    >
      <Handle type="target" position={Position.Left} className="!w-[7px] !h-[7px] !bg-[var(--accent)] !border-[2px] !border-[var(--bg)]" />
      <div className="flex items-center gap-2.5 mb-3">
        <TremorLogo size={26} />
        <div>
          <div className="text-[13px] font-semibold" style={{ color: "var(--text)" }}>Semantic Engine</div>
          <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>17-type shift taxonomy</div>
        </div>
      </div>
      <div className="space-y-[6px]">
        {STEPS.map((step, i) => (
          <motion.div
            key={step}
            className="flex items-center gap-2"
            animate={{ opacity: [0.35, 0.9, 0.35] }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.6 }}
          >
            <span className="w-[5px] h-[5px] rounded-full" style={{ background: "var(--accent)" }} />
            <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{step}</span>
          </motion.div>
        ))}
      </div>
      <Handle type="source" position={Position.Right} className="!w-[7px] !h-[7px] !bg-[var(--accent)] !border-[2px] !border-[var(--bg)]" />
    </div>
  );
}
