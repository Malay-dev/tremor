"use client";
import NodeShell from "./NodeShell";

export default function WebhookNode() {
  return (
    <NodeShell>
      <div className="w-[200px] rounded-xl border p-4 cursor-grab active:cursor-grabbing transition-all hover:border-[#555]" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2.5">
          <span className="text-[13px]">🔗</span>
          <span className="text-[11px] font-medium flex-1" style={{ color: "var(--text)" }}>Webhook</span>
          <span className="text-[9px] font-semibold" style={{ color: "var(--text-dim)" }}>PENDING</span>
        </div>
        <div className="text-[10px] mt-1.5" style={{ color: "var(--text-dim)" }}>ServiceNow</div>
      </div>
    </NodeShell>
  );
}
