"use client";

import { Handle, Position } from "@xyflow/react";
import BrightDataLogo from "../icons/BrightDataLogo";

interface Props {
  data: { collectorId: string; selfHealing: boolean };
}

export default function CollectorNode({ data }: Props) {
  return (
    <div
      className="rounded-[10px] px-3.5 py-3 w-[210px] border transition-colors hover:border-[var(--text-tertiary)] cursor-grab active:cursor-grabbing"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <Handle type="target" position={Position.Left} className="!w-[7px] !h-[7px] !bg-[var(--accent)] !border-[2px] !border-[var(--bg)]" />
      <div className="flex items-center gap-2.5">
        <BrightDataLogo size={22} />
        <div className="flex-1">
          <div className="text-[13px] font-medium" style={{ color: "var(--text)" }}>Bright Data</div>
          <div className="text-[11px] font-mono mt-0.5" style={{ color: "var(--text-tertiary)" }}>{data.collectorId}</div>
        </div>
      </div>
      {data.selfHealing && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className="w-[5px] h-[5px] rounded-full bg-[#2EB67D]" />
          <span className="text-[11px]" style={{ color: "#2EB67D" }}>Self-healing active</span>
        </div>
      )}
      <Handle type="source" position={Position.Right} className="!w-[7px] !h-[7px] !bg-[var(--accent)] !border-[2px] !border-[var(--bg)]" />
    </div>
  );
}
