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
    <div
      className="rounded-[10px] px-3.5 py-3 w-[180px] border cursor-grab active:cursor-grabbing"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <Handle type="target" position={Position.Left} className="!w-[7px] !h-[7px] !bg-[var(--accent)] !border-[2px] !border-[var(--bg)]" />
      <div className="text-[12px] font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
        Notify
      </div>
      <div className="space-y-2">
        {data.actions.map((a) => {
          const Logo = LOGOS[a.type];
          return (
            <div key={a.label} className="flex items-center gap-2">
              {Logo ? <Logo size={16} /> : <span className="w-4 h-4 rounded bg-[var(--bg-hover)]" />}
              <span className="text-[12px] flex-1" style={{ color: "var(--text)" }}>{a.label}</span>
              {a.sent && <span className="text-[10px]" style={{ color: "#2EB67D" }}>Sent</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
