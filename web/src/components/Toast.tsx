"use client";

import { useEffect, useState } from "react";

export interface ToastItem {
  id: string;
  channel: string;
  target: string;
  message: string;
  icon: React.ReactNode;
}

interface Props {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export default function Toast({ toasts, onDismiss }: Props) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-[380px]">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 50);
  }, []);

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-xl border transition-all duration-500"
      style={{
        background: "#111113",
        borderColor: "#2A2A30",
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(30px)",
      }}
    >
      {/* Logo */}
      <div className="shrink-0 mt-0.5">{toast.icon}</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[12px] font-semibold" style={{ color: "#F5F5F7" }}>{toast.channel}</span>
          <span className="text-[10px]" style={{ color: "#666" }}>→ {toast.target}</span>
          <span className="w-[6px] h-[6px] rounded-full bg-[#10B981] ml-auto shrink-0" />
        </div>
        <p className="text-[11px] leading-[1.5]" style={{ color: "#9A9AA0" }}>{toast.message}</p>
      </div>

      {/* Dismiss */}
      <button onClick={() => onDismiss(toast.id)} className="shrink-0 mt-0.5 p-1 rounded hover:bg-[#2A2A30] transition-colors" style={{ color: "#666" }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </button>
    </div>
  );
}
