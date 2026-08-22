"use client";

import { Handle, Position } from "@xyflow/react";
import SlackLogo from "../icons/SlackLogo";
import TelegramLogo from "../icons/TelegramLogo";

interface Props {
  data: { actions: Array<{ label: string; type: string; sent: boolean }> };
}

const LOGOS: Record<string, React.ComponentType<{ size?: number }>> = {
  slack: SlackLogo,
  telegram: TelegramLogo,
};

export default function ActionNode({ data }: Props) {
  return (
    <div className="node-card px-3.5 py-3 w-[170px] cursor-grab active:cursor-grabbing">
      <Handle type="target" position={Position.Left} className="!w-[6px] !h-[6px] !rounded-full !bg-[var(--green)] !border-none" />
      <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--blue)" }}>
        Notify
      </div>
      <div className="space-y-2">
        {data.actions.map((a) => {
          const Logo = LOGOS[a.type];
          return (
            <div key={a.label} className="flex items-center gap-2">
              {Logo ? <Logo size={15} /> : <span className="w-[15px] h-[15px] rounded bg-[var(--surface)]" />}
              <span className="text-[11px] flex-1">{a.label}</span>
              {a.sent && <span className="text-[9px] font-bold" style={{ color: "var(--green)" }}>SENT</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
