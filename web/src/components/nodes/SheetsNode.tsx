"use client";
import NodeShell from "./NodeShell";

interface Props {
  data: { sent?: boolean };
}

export default function SheetsNode({ data }: Props) {
  return (
    <NodeShell>
      <div className="w-[200px] rounded-xl border p-4 cursor-grab active:cursor-grabbing transition-all hover:border-[#555]" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2.5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="2" fill="#0F9D58"/>
            <rect x="6" y="7" width="12" height="2" fill="white" rx="0.5"/>
            <rect x="6" y="11" width="12" height="2" fill="white" rx="0.5"/>
            <rect x="6" y="15" width="8" height="2" fill="white" rx="0.5"/>
          </svg>
          <div className="flex-1">
            <div className="text-[12px] font-medium" style={{ color: "var(--text)" }}>Google Sheets</div>
            <div className="text-[10px]" style={{ color: "var(--text-dim)" }}>Tender Tracker</div>
          </div>
          {data.sent && <span className="text-[10px] font-semibold" style={{ color: "#10B981" }}>✓ Sent</span>}
          {!data.sent && <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>Idle</span>}
        </div>
      </div>
    </NodeShell>
  );
}
