"use client";

import { Handle, Position } from "@xyflow/react";
import { Zap } from "lucide-react";

interface Props {
  data: {
    events: Array<{ label: string; severity: string; entity: string }>;
  };
}

const SEVERITY_STYLES: Record<string, { dot: string; text: string; border: string }> = {
  critical: { dot: "bg-red-500", text: "text-red-400", border: "border-red-500/20" },
  high: { dot: "bg-orange-500", text: "text-orange-400", border: "border-orange-500/20" },
  medium: { dot: "bg-amber-500", text: "text-amber-400", border: "border-amber-500/20" },
  low: { dot: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500/20" },
};

export default function EventNode({ data }: Props) {
  return (
    <div className="rounded-xl px-4 py-3.5 min-w-[240px] border cursor-grab active:cursor-grabbing"
      style={{ background: "var(--canvas-surface)", borderColor: "var(--canvas-border)" }}>
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-violet-500 !border-2 !border-[var(--canvas-surface)]" />

      <div className="flex items-center gap-2 mb-2.5">
        <Zap size={13} style={{ color: "var(--amber)" }} />
        <span className="text-[12px] font-medium" style={{ color: "var(--canvas-text)" }}>Semantic Events</span>
        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded" style={{ color: "var(--canvas-muted)", background: "var(--canvas-elevated)" }}>
          {data.events.length}
        </span>
      </div>

      <div className="space-y-1.5">
        {data.events.map((event) => {
          const style = SEVERITY_STYLES[event.severity] || SEVERITY_STYLES.low;
          return (
            <div key={event.label} className={`flex items-center gap-2 px-2 py-1.5 rounded-md border ${style.border}`} style={{ background: "var(--canvas-elevated)" }}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
              <span className={`text-[11px] font-mono truncate ${style.text}`}>{event.label}</span>
            </div>
          );
        })}
      </div>

      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-amber-500 !border-2 !border-[var(--canvas-surface)]" />
    </div>
  );
}
