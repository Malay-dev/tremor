"use client";

import { Handle, Position } from "@xyflow/react";

interface Props {
  data: { events: Array<{ label: string; severity: string }> };
}

const SEV_COLOR: Record<string, string> = {
  critical: "var(--red)",
  high: "var(--orange)",
  medium: "var(--yellow)",
  low: "var(--green)",
};

export default function EventNode({ data }: Props) {
  return (
    <div className="node-card px-3.5 py-3 w-[230px] cursor-grab active:cursor-grabbing">
      <Handle type="target" position={Position.Left} className="!w-[6px] !h-[6px] !rounded-full !bg-[var(--purple)] !border-none" />
      <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--yellow)" }}>
        Events
      </div>
      <div className="space-y-[4px]">
        {data.events.map((e) => (
          <div key={e.label} className="flex items-center gap-2 px-2 py-[4px] rounded" style={{ background: "var(--surface)" }}>
            <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: SEV_COLOR[e.severity] || "var(--text-dim)", boxShadow: `0 0 4px ${SEV_COLOR[e.severity] || "transparent"}` }} />
            <span className="text-[10px] font-mono truncate" style={{ color: "var(--text)" }}>{e.label}</span>
          </div>
        ))}
      </div>
      <Handle type="source" position={Position.Right} className="!w-[6px] !h-[6px] !rounded-full !bg-[var(--orange)] !border-none" />
    </div>
  );
}
