"use client";

import { useState } from "react";
import Hero from "@/components/Hero";
import Pipeline from "@/components/pipeline/Pipeline";
import Inspector from "@/components/inspector/Inspector";
import type { PipelineStep } from "@/components/pipeline/types";

export default function Home() {
  const [selectedStep, setSelectedStep] = useState<PipelineStep | null>(null);

  return (
    <>
      <Hero />
      <section id="playground" className="px-6 md:px-12 pb-20">
        {/* Embedded window frame */}
        <div className="max-w-[1200px] mx-auto rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px var(--border)" }}>
          {/* Title bar */}
          <div className="flex items-center px-4 py-2.5 border-b" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            {/* Traffic lights */}
            <div className="flex items-center gap-[6px]">
              <span className="w-[10px] h-[10px] rounded-full bg-[#FF5F57]" />
              <span className="w-[10px] h-[10px] rounded-full bg-[#FEBC2E]" />
              <span className="w-[10px] h-[10px] rounded-full bg-[#28C840]" />
            </div>
            {/* Tab */}
            <div className="ml-4 flex items-center gap-2 px-3 py-1 rounded-md text-[11px] font-medium" style={{ background: "var(--surface)", color: "var(--text-dim)" }}>
              <span style={{ color: "var(--pink)" }}>⚡</span>
              IGA Pipeline — Salesforce
            </div>
            {/* Right side status */}
            <div className="ml-auto flex items-center gap-2 text-[10px]" style={{ color: "var(--text-dim)" }}>
              <span className="w-[5px] h-[5px] rounded-full bg-[var(--green)]" style={{ boxShadow: "0 0 4px var(--green)" }} />
              Pipeline Active
            </div>
          </div>

          {/* Content area */}
          <div className="relative flex" style={{ minHeight: "520px", backgroundImage: "radial-gradient(circle, #2A2A30 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
            <div className={`flex-1 transition-all duration-300 ${selectedStep ? "pr-[400px]" : ""}`}>
              <Pipeline onSelectStep={setSelectedStep} selectedStepId={selectedStep?.id || null} />
            </div>
            {selectedStep && (
              <Inspector step={selectedStep} onClose={() => setSelectedStep(null)} />
            )}
          </div>
        </div>
      </section>
    </>
  );
}
