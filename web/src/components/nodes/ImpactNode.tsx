"use client";

import { Handle, Position } from "@xyflow/react";
import { GitBranch } from "lucide-react";

interface Props {
  data: { paths: Array<{ system: string; risk: string }> };
}

const RISK_STYLES: Record<string, { dot: string; text: string }> = {
  high: { dot: "bg-red-400", text: "text-red-400" },
  medium: { dot: "bg-amber-400", text: "text-amber-400" },
  low: { dot: "bg-emerald-400", text: "text-emerald-400" },
};

export default function ImpactNode({ data }: Props) {
  return (
    <div className="rounded-xl px-4 py-3.5 min-w-[220px] border cursor-grab active:cursor-grabbing"
      style={{ background: "var(--canvas-surface)", borderColor: "var(--canvas-border)" }}>
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-amber-500 !border-2 !border-[var(--canvas-surface)]" />

      <div className="flex items-center gap-2 mb-2.5">
        <GitBranch size={13} style={{ color: "var(--violet)" }} />
        <span className="text-[12px] font-medium" style={{ color: "var(--canvas-text)" }}>Impact Graph</span>
      </div>

      <div className="space-y-1.5">
        {data.paths.map((path) => {
          const style = RISK_STYLES[path.risk] || RISK_STYLES.low;
          return (
            <div key={path.system} className="flex items-center gap-2 text-[11px]">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
              <span className={style.text}>{path.system}</span>
            </div>
          );
        })}
      </div>

      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-emerald-500 !border-2 !border-[var(--canvas-surface)]" />
    </div>
  );
}
