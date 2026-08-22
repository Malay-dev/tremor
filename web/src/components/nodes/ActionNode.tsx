"use client";

import { Handle, Position } from "@xyflow/react";
import { Bell, CheckCircle2, Clock, MessageSquare, Send } from "lucide-react";

interface Props {
  data: {
    actions: Array<{ label: string; type: string; status: string }>;
  };
}

const ICONS: Record<string, typeof Bell> = {
  slack: MessageSquare,
  telegram: Send,
  webhook: Bell,
  email: Bell,
};

export default function ActionNode({ data }: Props) {
  return (
    <div className="rounded-xl px-4 py-3.5 min-w-[180px] border cursor-grab active:cursor-grabbing"
      style={{ background: "var(--canvas-surface)", borderColor: "var(--canvas-border)" }}>
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-emerald-500 !border-2 !border-[var(--canvas-surface)]" />

      <div className="flex items-center gap-2 mb-2.5">
        <Bell size={13} style={{ color: "var(--emerald)" }} />
        <span className="text-[12px] font-medium" style={{ color: "var(--canvas-text)" }}>Actions</span>
      </div>

      <div className="space-y-1.5">
        {data.actions.map((action) => {
          const Icon = ICONS[action.type] || Bell;
          return (
            <div key={action.label} className="flex items-center gap-2 text-[11px]" style={{ color: "var(--canvas-muted)" }}>
              <Icon size={11} />
              <span className="flex-1">{action.label}</span>
              {action.status === "sent" && <CheckCircle2 size={11} style={{ color: "var(--emerald)" }} />}
              {action.status === "pending" && <Clock size={11} style={{ color: "var(--amber)" }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
