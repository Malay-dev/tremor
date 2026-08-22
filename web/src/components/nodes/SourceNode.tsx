"use client";

import { Handle, Position } from "@xyflow/react";
import SalesforceLogo from "../icons/SalesforceLogo";
import WorkdayLogo from "../icons/WorkdayLogo";
import StripeLogo from "../icons/StripeLogo";

const LOGOS: Record<string, React.ComponentType<{ size?: number }>> = {
  salesforce: SalesforceLogo,
  workday: WorkdayLogo,
  stripe: StripeLogo,
};

interface Props {
  data: { label: string; logo: string; status: string; lastSync: string };
}

export default function SourceNode({ data }: Props) {
  const Logo = LOGOS[data.logo];
  const alive = data.status === "active";

  return (
    <div
      className="group rounded-[10px] px-3.5 py-3 w-[190px] border transition-colors hover:border-[var(--text-tertiary)] cursor-grab active:cursor-grabbing"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center gap-2.5">
        {Logo && <Logo size={20} />}
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium truncate" style={{ color: "var(--text)" }}>{data.label}</div>
          <div className="text-[11px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>{data.lastSync}</div>
        </div>
        <span
          className="w-[6px] h-[6px] rounded-full shrink-0"
          style={{ background: alive ? "#2EB67D" : "#62636C" }}
        />
      </div>
      <Handle type="source" position={Position.Right} className="!w-[7px] !h-[7px] !bg-[var(--accent)] !border-[2px] !border-[var(--bg)]" />
    </div>
  );
}
