"use client";

import type { PipelineStep } from "./types";
import TremorLogo from "../icons/TremorLogo";
import BrightDataLogo from "../icons/BrightDataLogo";
import SalesforceLogo from "../icons/SalesforceLogo";

interface Props {
  step: PipelineStep;
  selected: boolean;
  onClick: () => void;
}

const STEP_ICONS: Record<string, React.ReactNode> = {
  source: <SalesforceLogo size={18} />,
  version: <span className="text-[14px]">⏱</span>,
  collector: <BrightDataLogo size={18} />,
  engine: <TremorLogo size={18} />,
  alerts: <span className="text-[14px]">⚡</span>,
  notify: <span className="text-[14px]">📡</span>,
};

const STATUS_COLORS: Record<string, string> = {
  idle: "var(--text-dim)",
  running: "var(--blue)",
  complete: "var(--green)",
  error: "var(--red)",
};

export default function StepNode({ step, selected, onClick }: Props) {
  const borderColor = selected ? "var(--pink)" : "var(--border)";
  const shadow = selected ? "0 0 0 1px var(--pink), 0 0 20px rgba(255,45,123,0.1)" : "none";

  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center gap-2 px-4 py-3 rounded-lg border transition-all hover:border-[var(--pink)] cursor-pointer outline-none group w-[120px]"
      style={{ background: "var(--card)", borderColor, boxShadow: shadow }}
    >
      {/* Status dot */}
      <span
        className="absolute top-2 right-2 w-[5px] h-[5px] rounded-full"
        style={{ background: STATUS_COLORS[step.status], boxShadow: `0 0 4px ${STATUS_COLORS[step.status]}` }}
      />

      {/* Icon */}
      <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: "var(--surface)" }}>
        {STEP_ICONS[step.type]}
      </div>

      {/* Label */}
      <span className="text-[11px] font-medium" style={{ color: selected ? "var(--text)" : "var(--text-dim)" }}>
        {step.label}
      </span>

      {/* Editable indicator */}
      {step.editable && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] px-1.5 py-0.5 rounded-full border" style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text-dim)" }}>
          editable
        </span>
      )}
    </button>
  );
}
