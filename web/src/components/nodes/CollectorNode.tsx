"use client";

import { Handle, Position } from "@xyflow/react";
import { ShieldCheck, Wifi } from "lucide-react";

interface Props {
  data: { collectorId: string; healthy: boolean; selfHealing: boolean; lastRun: string };
}

export default function CollectorNode({ data }: Props) {
  return (
    <div className="rounded-xl px-4 py-3.5 min-w-[200px] border transition-all hover:border-cyan-500/50 cursor-grab active:cursor-grabbing"
      style={{ background: "var(--canvas-surface)", borderColor: "var(--canvas-border)" }}>
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-indigo-500 !border-2 !border-[var(--canvas-surface)]" />

      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(6, 182, 212, 0.1)" }}>
          <Wifi size={14} style={{ color: "var(--cyan)" }} />
        </div>
        <div>
          <div className="text-[11px] font-mono" style={{ color: "var(--cyan)" }}>{data.collectorId}</div>
          <div className="text-[10px]" style={{ color: "var(--canvas-muted)" }}>Bright Data</div>
        </div>
      </div>

      <div className="flex items-center gap-3 text-[11px]">
        {data.selfHealing && (
          <span className="flex items-center gap-1" style={{ color: "var(--emerald)" }}>
            <ShieldCheck size={11} /> Self-healing
          </span>
        )}
        <span style={{ color: data.healthy ? "var(--emerald)" : "var(--critical)" }}>
          {data.healthy ? "● Healthy" : "● Error"}
        </span>
      </div>

      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-cyan-500 !border-2 !border-[var(--canvas-surface)]" />
    </div>
  );
}
