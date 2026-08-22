"use client";

import { motion } from "framer-motion";
import { Radio } from "lucide-react";
import { useEffect, useState } from "react";

const EVENTS = [
  { time: "09:22:01", text: "Collector executed • c_8f2a91b4", status: "info" },
  { time: "09:22:03", text: "Version detected • Salesforce API v62.0", status: "info" },
  { time: "09:22:05", text: "Extraction complete • 11 entities", status: "info" },
  { time: "09:22:07", text: "4 semantic changes detected", status: "warn" },
  { time: "09:22:08", text: "CRITICAL: Auth flow removed", status: "error" },
  { time: "09:22:09", text: "Impact: 5 downstream systems affected", status: "warn" },
  { time: "09:22:10", text: "Slack notification sent → IAM Engineering", status: "success" },
  { time: "09:22:10", text: "Telegram alert delivered", status: "success" },
];

const STATUS_COLORS: Record<string, string> = {
  info: "text-[var(--canvas-muted)]",
  warn: "text-[var(--amber)]",
  error: "text-[var(--critical)]",
  success: "text-[var(--emerald)]",
};

export default function EventTicker() {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleCount((c) => (c < EVENTS.length ? c + 1 : c));
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="border-t px-6 py-3 flex items-center gap-4 overflow-x-auto"
      style={{ borderColor: "var(--canvas-border)", background: "var(--canvas-surface)" }}
    >
      <div className="flex items-center gap-1.5 shrink-0">
        <Radio size={12} style={{ color: "var(--accent)" }} />
        <span className="text-[11px] font-medium" style={{ color: "var(--canvas-muted)" }}>
          LIVE
        </span>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto">
        {EVENTS.slice(0, visibleCount).map((event, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 shrink-0"
          >
            <span className="text-[10px] font-mono" style={{ color: "var(--canvas-muted)" }}>
              {event.time}
            </span>
            <span className={`text-[11px] ${STATUS_COLORS[event.status]}`}>
              {event.text}
            </span>
            {i < visibleCount - 1 && (
              <span className="text-[var(--canvas-border)] text-xs">›</span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
