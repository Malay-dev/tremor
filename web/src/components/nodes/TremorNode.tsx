"use client";
import NodeShell from "./NodeShell";

export default function TremorNode() {
  return (
    <NodeShell>
      <div className="w-[280px] rounded-xl border p-4 cursor-grab active:cursor-grabbing transition-all hover:border-[#555]" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2.5 mb-3">
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
            <rect x="2" y="2" width="28" height="28" rx="6" stroke="#FFF" strokeWidth="2" fill="none"/>
            <path d="M6 16H10L12 9L15 23L18 7L21 21L23 13H26" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--text)" }}>Tremor Engine</div>
        </div>
        <div className="space-y-2 text-[12px]">
          <div className="flex items-center justify-between">
            <span style={{ color: "var(--text-dim)" }}>Model</span>
            <span style={{ color: "var(--text)" }}>Gemini 2.5 Flash</span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: "var(--text-dim)" }}>Taxonomy</span>
            <span style={{ color: "var(--text)" }}>17 shift types</span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: "var(--text-dim)" }}>Processing</span>
            <span style={{ color: "var(--text)" }}>3,241ms</span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: "var(--text-dim)" }}>Events</span>
            <span className="font-medium" style={{ color: "var(--text)" }}>6 detected</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t space-y-1.5" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 px-2 py-1 rounded" style={{ background: "var(--surface)" }}>
            <span className="w-[5px] h-[5px] rounded-full bg-white" />
            <span className="text-[10px] font-mono" style={{ color: "var(--text)" }}>BREAKING_REMOVAL</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1 rounded" style={{ background: "var(--surface)" }}>
            <span className="w-[5px] h-[5px] rounded-full bg-white" />
            <span className="text-[10px] font-mono" style={{ color: "var(--text)" }}>STATE_SPACE_EXPANDED</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1 rounded" style={{ background: "var(--surface)" }}>
            <span className="w-[5px] h-[5px] rounded-full bg-white" />
            <span className="text-[10px] font-mono" style={{ color: "var(--text)" }}>NULLABILITY_CHANGED</span>
          </div>
          <div className="text-[10px] text-center mt-1" style={{ color: "var(--text-dim)" }}>+3 more</div>
        </div>
      </div>
    </NodeShell>
  );
}
