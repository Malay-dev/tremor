"use client";

import { Handle, Position } from "@xyflow/react";

interface Props {
  data: { systems: Array<{ name: string; risk: string }> };
}

const RISK_COLOR: Record<string, string> = { high: "var(--red)", medium: "var(--orange)", low: "var(--green)" };

export default function ImpactNode({ data }: Props) {
  return (
    <div className="node-card px-3.5 py-3 w-[210px] cursor-grab active:cursor-grabbing">
      <Handle type="target" position={Position.Left} className="!w-[6px] !h-[6px] !rounded-full !bg-[var(--orange)] !border-none" />
      <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--red)" }}>
        Impact
      </div>
      <div className="space-y-[4px]">
        {data.systems.map((s) => (
          <div key={s.name} className="flex items-center gap-2">
            <span className="w-[4px] h-[4px] rounded-full shrink-0" style={{ background: RISK_COLOR[s.risk], boxShadow: `0 0 4px ${RISK_COLOR[s.risk]}` }} />
            <span className="text-[11px]" style={{ color: "var(--text)" }}>{s.name}</span>
          </div>
        ))}
      </div>
      <Handle type="source" position={Position.Right} className="!w-[6px] !h-[6px] !rounded-full !bg-[var(--green)] !border-none" />
    </div>
  );
}
