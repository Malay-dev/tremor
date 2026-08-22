"use client";

import { Handle, Position } from "@xyflow/react";
import { motion } from "framer-motion";
import TremorLogo from "../icons/TremorLogo";

const STEPS = ["Extract Entities", "Semantic Graph", "Detect Shifts", "Score Severity"];

export default function EngineNode() {
  return (
    <div
      className="rounded-[8px] px-4 py-4 w-[240px] border cursor-grab active:cursor-grabbing relative overflow-hidden"
      style={{
        background: "var(--card)",
        borderColor: "var(--pink)",
        boxShadow: "0 0 24px rgba(255,45,123,0.08), inset 0 1px 0 rgba(255,45,123,0.1)",
      }}
    >
      <Handle type="target" position={Position.Left} className="!w-[6px] !h-[6px] !rounded-full !bg-[var(--blue)] !border-none" />

      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-12 h-12 pointer-events-none" style={{
        background: "linear-gradient(225deg, rgba(255,45,123,0.1) 0%, transparent 60%)"
      }} />

      <div className="flex items-center gap-2.5 mb-3">
        <TremorLogo size={24} />
        <div>
          <div className="text-[13px] font-bold">Tremor Engine</div>
          <div className="text-[10px]" style={{ color: "var(--pink)" }}>17 shift types</div>
        </div>
      </div>

      <div className="space-y-[5px]">
        {STEPS.map((step, i) => (
          <motion.div
            key={step}
            className="flex items-center gap-2"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.5 }}
          >
            <motion.span
              className="w-[4px] h-[4px] rounded-full bg-[var(--pink)]"
              animate={{ scale: [0.8, 1.4, 0.8] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.5 }}
            />
            <span className="text-[11px]" style={{ color: "var(--text-dim)" }}>{step}</span>
          </motion.div>
        ))}
      </div>

      <Handle type="source" position={Position.Right} className="!w-[6px] !h-[6px] !rounded-full !bg-[var(--purple)] !border-none" />
    </div>
  );
}
