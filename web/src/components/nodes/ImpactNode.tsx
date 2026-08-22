"use client";

import { Handle, Position } from "@xyflow/react";

interface Props {
  data: { systems: Array<{ name: string; risk: string }> };
}

const RISK: Record<string, string> = { high: "#EF4444", medium: "#F97316", low: "#2EB67D" };

export default function ImpactNode({ data }: Props) {
  return (
    <div
      className="rounded-[10px] px-3.5 py-3 w-[220px] border cursor-grab active:cursor-grabbing"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <Handle type="target" position={Position.Left} className="!w-[7px] !h-[7px] !bg-[var(--accent)] !border-[2px] !border-[var(--bg)]" />
      <div className="text-[12px] font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
        Impact Graph
      </div>
      <div className="space-y-[5px]">
        {data.systems.map((s) => (
          <div key={s.name} className="flex items-center gap-2">
            <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: RISK[s.risk] || RISK.low }} />
            <span className="text-[11px]" style={{ color: "var(--text)" }}>{s.name}</span>
          </div>
        ))}
      </div>
      <Handle type="source" position={Position.Right} className="!w-[7px] !h-[7px] !bg-[var(--accent)] !border-[2px] !border-[var(--bg)]" />
    </div>
  );
}
