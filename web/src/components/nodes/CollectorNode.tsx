"use client";

import { Handle, Position } from "@xyflow/react";
import BrightDataLogo from "../icons/BrightDataLogo";

interface Props {
  data: { collectorId: string; selfHealing: boolean };
}

export default function CollectorNode({ data }: Props) {
  return (
    <div className="node-card px-3.5 py-3 w-[200px] cursor-grab active:cursor-grabbing">
      <Handle type="target" position={Position.Left} className="!w-[6px] !h-[6px] !rounded-full !bg-[var(--pink)] !border-none" />
      <div className="flex items-center gap-2.5 mb-2">
        <BrightDataLogo size={20} />
        <div>
          <div className="text-[12px] font-semibold">Bright Data</div>
          <div className="text-[10px] font-mono" style={{ color: "var(--blue)" }}>{data.collectorId}</div>
        </div>
      </div>
      {data.selfHealing && (
        <div className="flex items-center gap-1.5 text-[10px] font-medium" style={{ color: "var(--green)" }}>
          <span className="w-[5px] h-[5px] rounded-full bg-[var(--green)]" style={{ boxShadow: "0 0 6px var(--green)" }} />
          Self-healing active
        </div>
      )}
      <Handle type="source" position={Position.Right} className="!w-[6px] !h-[6px] !rounded-full !bg-[var(--blue)] !border-none" />
    </div>
  );
}
