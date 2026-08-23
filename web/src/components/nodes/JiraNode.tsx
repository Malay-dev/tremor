"use client";
import NodeShell from "./NodeShell";

interface Props {
  data: { sent?: boolean };
}

export default function JiraNode({ data }: Props) {
  return (
    <NodeShell>
      <div className="w-[200px] rounded-xl border p-4 cursor-grab active:cursor-grabbing transition-all hover:border-[#555]" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2.5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12.005 2L2 12.005l10.005 10.005L22.01 12.005 12.005 2zm-.53 4.243l5.292 5.292-5.292 5.292-5.292-5.292 5.292-5.292z" fill="#0052CC"/>
          </svg>
          <div className="flex-1">
            <div className="text-[12px] font-medium" style={{ color: "var(--text)" }}>Jira</div>
            <div className="text-[10px]" style={{ color: "var(--text-dim)" }}>ENG-4521</div>
          </div>
          {data.sent && <span className="text-[10px] font-semibold" style={{ color: "#10B981" }}>✓ Sent</span>}
          {!data.sent && <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>Idle</span>}
        </div>
      </div>
    </NodeShell>
  );
}
