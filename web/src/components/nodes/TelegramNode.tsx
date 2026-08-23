"use client";
import NodeShell from "./NodeShell";

interface Props {
  data: { sent?: boolean };
}

export default function TelegramNode({ data }: Props) {
  return (
    <NodeShell>
      <div className="w-[200px] rounded-xl border p-4 cursor-grab active:cursor-grabbing transition-all hover:border-[#555]" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2.5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="12" fill="#2AABEE"/>
            <path d="M5.43 11.87l11.9-4.9c.55-.2 1.03.13.85.96l-2.03 9.55c-.15.68-.55.84-1.12.52l-3.1-2.28-1.49 1.44c-.17.17-.31.31-.63.31l.22-3.15 5.7-5.15c.25-.22-.05-.34-.39-.13L8.3 13.54l-3.03-.95c-.66-.2-.67-.66.14-.98z" fill="white"/>
          </svg>
          <div className="flex-1">
            <div className="text-[12px] font-medium" style={{ color: "var(--text)" }}>Telegram</div>
            <div className="text-[10px]" style={{ color: "var(--text-dim)" }}>IAM Engineering</div>
          </div>
          {data.sent && <span className="text-[10px] font-semibold" style={{ color: "#10B981" }}>✓ Sent</span>}
          {!data.sent && <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>Idle</span>}
        </div>
      </div>
    </NodeShell>
  );
}
