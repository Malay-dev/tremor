"use client";
import NodeShell from "./NodeShell";

export default function StripeSourceNode() {
  return (
    <NodeShell>
      <div className="flex flex-col items-center justify-center cursor-grab active:cursor-grabbing transition-all hover:border-[#555]" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="w-[140px] h-[140px] rounded-2xl border flex flex-col items-center justify-center" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ background: "#635BFF" }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path d="M11.2 9.6c0-.7.6-1 1.5-1 1.3 0 3 .4 4.3 1.1V6.3C15.6 5.8 14.3 5.5 13 5.5c-3 0-5 1.6-5 4.2 0 4.1 5.6 3.5 5.6 5.2 0 .8-.7 1.1-1.7 1.1-1.5 0-3.4-.6-4.9-1.4v3.5c1.7.7 3.3 1 4.9 1 3.1 0 5.2-1.5 5.2-4.2-.1-4.4-5.9-3.6-5.9-5.3z" fill="white"/>
            </svg>
          </div>
          <span className="text-[11px] font-medium mt-2" style={{ color: "var(--text)" }}>Stripe</span>
          <span className="text-[9px]" style={{ color: "var(--text-dim)" }}>API Docs</span>
        </div>
      </div>
    </NodeShell>
  );
}
