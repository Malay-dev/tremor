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
}

export default function Toast({ toasts }: Props) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-[380px]">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastCard({ toast }: { toast: ToastItem }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 50);
  }, []);

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-xl border transition-all duration-500"
      style={{
        background: "white",
        borderColor: "#E5E5E5",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(30px)",
      }}
    >
      {/* Logo */}
      <div className="shrink-0 mt-0.5">{toast.icon}</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[12px] font-semibold" style={{ color: "#0F172A" }}>{toast.channel}</span>
          <span className="text-[10px]" style={{ color: "#94A3B8" }}>→ {toast.target}</span>
          <span className="w-[6px] h-[6px] rounded-full bg-[#10B981] ml-auto shrink-0" />
        </div>
        <p className="text-[11px] leading-[1.5]" style={{ color: "#64748B" }}>{toast.message}</p>
      </div>
    </div>
  );
}
