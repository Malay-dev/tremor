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
  const active = data.status === "active";

  return (
    <div className="node-card px-3.5 py-3 w-[180px] cursor-grab active:cursor-grabbing">
      <div className="flex items-center gap-2.5">
        {Logo && <Logo size={18} />}
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-semibold truncate">{data.label}</div>
          <div className="text-[10px] mt-0.5" style={{ color: "var(--text-dim)" }}>{data.lastSync}</div>
        </div>
        <span className="w-[6px] h-[6px] rounded-full" style={{ background: active ? "var(--green)" : "var(--text-dim)", boxShadow: active ? "0 0 6px var(--green)" : "none" }} />
      </div>
      <Handle type="source" position={Position.Right} className="!w-[6px] !h-[6px] !rounded-full !bg-[var(--pink)] !border-none" />
    </div>
  );
}
