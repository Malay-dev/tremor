"use client";
import NodeShell from "./NodeShell";

export default function AlertsNode() {
  return (
    <NodeShell>
      <div className="w-[260px] rounded-xl border p-4 cursor-grab active:cursor-grabbing transition-all hover:border-[#555]" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2.5 mb-3">
          <span className="text-[14px]">⚡</span>
          <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>Alerts</div>
          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--surface)", color: "var(--text-dim)" }}>IGA</span>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[11px] px-2 py-0.5 rounded" style={{ background: "var(--surface)", color: "var(--text)" }}>1 Critical</span>
          <span className="text-[11px] px-2 py-0.5 rounded" style={{ background: "var(--surface)", color: "var(--text)" }}>3 High</span>
        </div>
        <div className="space-y-2 text-[11px]">
          <div className="p-2 rounded border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="font-medium" style={{ color: "var(--text)" }}>Auth flow removed</div>
            <div className="text-[10px] mt-0.5" style={{ color: "var(--text-dim)" }}>Connector auth will fail immediately</div>
          </div>
          <div className="p-2 rounded border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="font-medium" style={{ color: "var(--text)" }}>Status field expanded</div>
            <div className="text-[10px] mt-0.5" style={{ color: "var(--text-dim)" }}>Provisioning rules need update</div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="text-[10px]" style={{ color: "var(--text-dim)" }}>Remediation: Update connector auth to OAuth 2.0</div>
        </div>
      </div>
    </NodeShell>
  );
}
