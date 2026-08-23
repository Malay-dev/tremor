"use client";
import NodeShell from "./NodeShell";

export default function RfpSourceNode() {
  return (
    <NodeShell>
      <div className="flex flex-col items-center justify-center cursor-grab active:cursor-grabbing transition-all hover:border-[#555]" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="w-[140px] h-[140px] rounded-2xl border flex flex-col items-center justify-center" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ background: "#1A365D" }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path d="M3 21V3h12l4 4v14H3z" stroke="white" strokeWidth="1.5" fill="none"/>
              <path d="M15 3v4h4" stroke="white" strokeWidth="1.5"/>
              <path d="M7 13h8M7 17h5M7 9h4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-[11px] font-medium mt-2" style={{ color: "var(--text)" }}>SAM.gov</span>
          <span className="text-[9px]" style={{ color: "var(--text-dim)" }}>RFP Portal</span>
        </div>
      </div>
    </NodeShell>
  );
}
