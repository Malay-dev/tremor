"use client";
import NodeShell from "./NodeShell";
import WebhooksIcon from "../icons/WebhooksIcon";

interface Props {
  data: { sent?: boolean };
}

export default function WebhookNode({ data }: Props) {
  return (
    <NodeShell>
      <div className="w-[200px] rounded-xl border p-4 cursor-grab active:cursor-grabbing transition-all hover:border-[#555]" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2.5">
          <WebhooksIcon></WebhooksIcon>
          <div className="flex-1">
            <div className="text-[12px] font-medium" style={{ color: "var(--text)" }}>Webhook</div>
            <div className="text-[10px]" style={{ color: "var(--text-dim)" }}>ServiceNow</div>
          </div>
          {data.sent && <span className="text-[10px] font-semibold" style={{ color: "#10B981" }}>✓ Sent</span>}
          {!data.sent && <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>Idle</span>}
        </div>
      </div>
    </NodeShell>
  );
}
