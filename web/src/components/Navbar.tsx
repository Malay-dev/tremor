"use client";

import TremorLogo from "./icons/TremorLogo";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
      style={{ background: "rgba(17,17,19,0.8)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border-subtle)" }}>
      <div className="flex items-center gap-2.5">
        <TremorLogo size={28} />
        <span className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: "var(--text)" }}>Tremor</span>
      </div>
      <div className="flex items-center gap-6">
        <a href="#playground" className="text-[13px]" style={{ color: "var(--text-secondary)" }}>Playground</a>
        <a href="https://github.com" target="_blank" className="text-[13px]" style={{ color: "var(--text-secondary)" }}>GitHub</a>
        <button className="text-[13px] px-3.5 py-1.5 rounded-lg font-medium" style={{ background: "var(--accent)", color: "white" }}>
          Get Started
        </button>
      </div>
    </nav>
  );
}
