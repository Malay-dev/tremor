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
      <section id="playground" className="relative flex" style={{ minHeight: "75vh", borderTop: "1px solid var(--border)" }}>
        {/* Pipeline (takes full width, or less if inspector open) */}
        <div className={`flex-1 transition-all duration-300 ${selectedStep ? "pr-[420px]" : ""}`}>
          <Pipeline onSelectStep={setSelectedStep} selectedStepId={selectedStep?.id || null} />
        </div>

        {/* Inspector panel (slides in from right) */}
        {selectedStep && (
          <Inspector step={selectedStep} onClose={() => setSelectedStep(null)} />
        )}
      </section>
    </>
  );
}
