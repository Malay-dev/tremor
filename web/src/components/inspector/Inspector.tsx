"use client";

import type { PipelineStep } from "../pipeline/types";
import { X } from "lucide-react";

interface Props {
  step: PipelineStep;
  onClose: () => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  idle: { label: "Idle", color: "var(--text-dim)" },
  running: { label: "Running", color: "var(--blue)" },
  complete: { label: "Complete", color: "var(--green)" },
  error: { label: "Error", color: "var(--red)" },
};

export default function Inspector({ step, onClose }: Props) {
  const status = STATUS_LABELS[step.status];

  return (
    <div
      className="fixed top-0 right-0 h-full w-[420px] border-l overflow-y-auto z-40"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      {/* Header */}
      <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <h3 className="text-[14px] font-semibold">{step.label}</h3>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border" style={{ color: status.color, borderColor: status.color }}>
            {status.label}
          </span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-[var(--card)] transition-colors" style={{ color: "var(--text-dim)" }}>
          <X size={16} />
        </button>
      </div>

      {/* Input section */}
      <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--blue)" }}>Input</span>
          {step.editable && (
            <span className="text-[9px] px-1.5 py-0.5 rounded border" style={{ borderColor: "var(--border)", color: "var(--text-dim)" }}>
              Editable
            </span>
          )}
        </div>
        <pre className="text-[11px] leading-[1.6] font-mono p-3 rounded overflow-x-auto" style={{ background: "var(--bg)", color: "var(--text-dim)" }}>
          {JSON.stringify(step.input, null, 2)}
        </pre>
      </div>

      {/* Output section */}
      <div className="px-5 py-4">
        <span className="text-[10px] font-semibold uppercase tracking-wider mb-3 block" style={{ color: "var(--green)" }}>Output</span>
        <pre className="text-[11px] leading-[1.6] font-mono p-3 rounded overflow-x-auto" style={{ background: "var(--bg)", color: "var(--text-dim)" }}>
          {JSON.stringify(step.output, null, 2)}
        </pre>
      </div>

      {/* Events detail (for engine step) */}
      {step.type === "engine" && Array.isArray((step.output as Record<string, unknown>).events) && (
        <div className="px-5 pb-6">
          <span className="text-[10px] font-semibold uppercase tracking-wider mb-3 block" style={{ color: "var(--yellow)" }}>Detected Shifts</span>
          <div className="space-y-2">
            {((step.output as Record<string, unknown>).events as Array<Record<string, string>>).map((evt, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded" style={{ background: "var(--bg)" }}>
                <SeverityDot severity={evt.severity} />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-mono font-medium" style={{ color: "var(--text)" }}>{evt.shift}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "var(--text-dim)" }}>{evt.entity}: {evt.before} → {evt.after}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SeverityDot({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    CRITICAL: "var(--red)",
    HIGH: "var(--orange)",
    MEDIUM: "var(--yellow)",
    LOW: "var(--green)",
    INFO: "var(--text-dim)",
  };
  const c = colors[severity] || colors.INFO;
  return <span className="w-[6px] h-[6px] rounded-full shrink-0 mt-1" style={{ background: c, boxShadow: `0 0 4px ${c}` }} />;
}
