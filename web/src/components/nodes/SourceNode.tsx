"use client";

import { Handle, Position } from "@xyflow/react";

interface Props {
  data: { label: string; status: string; lastSync: string; icon: string };
}

export default function SourceNode({ data }: Props) {
  const statusColor =
    data.status === "active" ? "bg-emerald-400" :
    data.status === "stale" ? "bg-amber-400" : "bg-red-400";

  return (
    <div className="rounded-xl px-4 py-3 min-w-[170px] border transition-all hover:border-indigo-500/50 cursor-grab active:cursor-grabbing"
      style={{ background: "var(--canvas-surface)", borderColor: "var(--canvas-border)" }}>
      <div className="flex items-center gap-2.5">
        <span className="text-base">{data.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium truncate" style={{ color: "var(--canvas-text)" }}>
            {data.label}
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: "var(--canvas-muted)" }}>
            {data.lastSync}
          </div>
        </div>
        <span className={`w-2 h-2 rounded-full ${statusColor}`} />
      </div>
      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-indigo-500 !border-2 !border-[var(--canvas-surface)]" />
    </div>
  );
}
