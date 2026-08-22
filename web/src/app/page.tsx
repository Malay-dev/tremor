"use client";

import Hero from "@/components/Hero";

export default function Home() {
  return (
    <>
      <Hero />
      <section id="playground" className="px-6 md:px-12 pb-20">
        {/* Embedded window frame */}
        <div className="max-w-[1200px] mx-auto rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px var(--border)" }}>
          {/* Title bar */}
          <div className="flex items-center px-4 py-2.5 border-b" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div className="flex items-center gap-[6px]">
              <span className="w-[10px] h-[10px] rounded-full bg-[#FF5F57]" />
              <span className="w-[10px] h-[10px] rounded-full bg-[#FEBC2E]" />
              <span className="w-[10px] h-[10px] rounded-full bg-[#28C840]" />
            </div>
            <div className="ml-4 flex items-center gap-2 px-3 py-1 rounded-md text-[11px] font-medium" style={{ background: "var(--surface)", color: "var(--text-dim)" }}>
              <span style={{ color: "var(--pink)" }}>⚡</span>
              IGA Pipeline — Salesforce
            </div>
            <div className="ml-auto flex items-center gap-2 text-[10px]" style={{ color: "var(--text-dim)" }}>
              <span className="w-[5px] h-[5px] rounded-full bg-[var(--green)]" style={{ boxShadow: "0 0 4px var(--green)" }} />
              Pipeline Active
            </div>
          </div>

          {/* Content area — dotted background */}
          <div className="relative" style={{ minHeight: "520px", backgroundImage: "radial-gradient(circle, #3A3A42 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
            {/* Pipeline content will go here */}
            <div className="flex items-center justify-center h-full min-h-[520px]">
              <p className="text-[13px]" style={{ color: "var(--text-dim)" }}>Pipeline modules coming here</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
