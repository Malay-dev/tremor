"use client";

import { Handle, Position } from "@xyflow/react";

interface Props {
  data: { events: Array<{ label: string; severity: string }> };
}

const SEV: Record<string, string> = {
  critical: "#EF4444",
  high: "#F97316",
  medium: "#EAB308",
  low: "#2EB67D",
};

export default function EventNode({ data }: Props) {
  return (
    <div
      className="rounded-[10px] px-3.5 py-3 w-[230px] border cursor-grab active:cursor-grabbing"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <Handle type="target" position={Position.Left} className="!w-[7px] !h-[7px] !bg-[var(--accent)] !border-[2px] !border-[var(--bg)]" />
      <div className="text-[12px] font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
        Change Events
      </div>
      <div className="space-y-[5px]">
        {data.events.map((e) => (
          <div key={e.label} className="flex items-center gap-2 px-2 py-[5px] rounded-md" style={{ background: "var(--bg-hover)" }}>
            <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: SEV[e.severity] || SEV.low }} />
            <span className="text-[11px] font-mono truncate" style={{ color: "var(--text)" }}>{e.label}</span>
          </div>
        ))}
      </div>
      <Handle type="source" position={Position.Right} className="!w-[7px] !h-[7px] !bg-[var(--accent)] !border-[2px] !border-[var(--bg)]" />
    </div>
  );
}
