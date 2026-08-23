"use client";
import NodeShell from "./NodeShell";

interface Props {
  data: { sent?: boolean };
}

export default function SlackNode({ data }: Props) {
  return (
    <NodeShell>
      <div className="w-[250px] rounded-xl border p-4 cursor-grab active:cursor-grabbing transition-all hover:border-[#555]" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2.5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M5.04 15.24a2.52 2.52 0 1 1-2.52-2.52h2.52v2.52zm1.26 0a2.52 2.52 0 1 1 5.04 0v6.3a2.52 2.52 0 1 1-5.04 0v-6.3z" fill="#E01E5A"/>
            <path d="M8.82 5.04a2.52 2.52 0 1 1 2.52-2.52v2.52H8.82zm0 1.26a2.52 2.52 0 1 1 0 5.04H2.52a2.52 2.52 0 0 1 0-5.04h6.3z" fill="#36C5F0"/>
            <path d="M18.96 8.82a2.52 2.52 0 1 1 2.52 2.52h-2.52V8.82zm-1.26 0a2.52 2.52 0 1 1-5.04 0V2.52a2.52 2.52 0 0 1 5.04 0v6.3z" fill="#2EB67D"/>
            <path d="M15.18 18.96a2.52 2.52 0 1 1-2.52 2.52v-2.52h2.52zm0-1.26a2.52 2.52 0 1 1 0-5.04h6.3a2.52 2.52 0 0 1 0 5.04h-6.3z" fill="#ECB22E"/>
          </svg>
          <div className="flex-1">
            <div className="text-md font-medium" style={{ color: "var(--text)" }}>Slack</div>
            <div className="text-sm" style={{ color: "var(--text-dim)" }}>#iam-alerts</div>
          </div>
          {data.sent && <span className="text-sm font-semibold" style={{ color: "#10B981" }}>✓ Sent</span>}
          {!data.sent && <span className="text-sm" style={{ color: "var(--text-dim)" }}>Idle</span>}
        </div>
      </div>
    </NodeShell>
  );
}
