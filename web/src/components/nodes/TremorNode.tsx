"use client";
import { useState, useEffect } from "react";
import NodeShell from "./NodeShell";
import GeminiLogo from "../logos/GeminiLogo";
import TremorLogo from "../logos/TremorLogo";

const SEV_COLORS: Record<string, string> = {
  CRITICAL: "#EF4444",
  HIGH: "#F97316",
  MEDIUM: "#EAB308",
  LOW: "#22C55E",
  INFO: "#888",
};

const STEPS = ["Extracting entities", "Building semantic graph", "Detecting shifts", "Scoring severity"];

interface Props {
  data: { analysisData?: { active: boolean; analyzing: boolean; events: Array<{ shift: string; entity: string; severity: string }> } };
}

export default function TremorNode({ data }: Props) {
  const analysis = data.analysisData || { active: false, analyzing: false, events: [] };
  const [activeStep, setActiveStep] = useState(0);

  // Animate processing steps
  useEffect(() => {
    if (!analysis.analyzing) { setActiveStep(0); return; }
    const interval = setInterval(() => {
      setActiveStep((s) => (s + 1) % STEPS.length);
    }, 600);
    return () => clearInterval(interval);
  }, [analysis.analyzing]);

  // Severity breakdown counts
  const sevCounts = analysis.events.reduce((acc, e) => {
    acc[e.severity] = (acc[e.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const total = analysis.events.length || 1;

  return (
    <NodeShell>
      <div className="w-[320px] rounded-xl p-4 cursor-grab active:cursor-grabbing transition-all hover:border-[#555] relative" style={{ background: "var(--card)", border: "2px solid #333" }}>
        {/* Gemini logo overlay — top right corner */}
        <div className="absolute -top-5 -right-5 w-11 h-11 rounded-full flex items-center justify-center z-10" style={{ background: "#111", border: "2px solid #333" }}>
          <GeminiLogo size={22} />
        </div>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-3">
          <TremorLogo size={40}></TremorLogo>
          <div>
            <div className="text-md font-semibold" style={{ color: "var(--text)" }}>Tremor Engine</div>
            <div className="text-sm" style={{ color: "var(--text-dim)" }}>Semantic Change Detection</div>
          </div>
        </div>

        {/* Idle state */}
        {!analysis.active && !analysis.analyzing && (
          <div className="text-base text-center py-4" style={{ color: "var(--text-dim)" }}>
            Waiting for data...
          </div>
        )}

        {/* Analyzing — step by step animation */}
        {analysis.analyzing && (
          <div className="py-2 space-y-1.5">
            {STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-2 text-base" style={{ opacity: i <= activeStep ? 1 : 0.3 }}>
                <span className="w-[5px] h-[5px] rounded-full" style={{ background: i === activeStep ? "#F59E0B" : i < activeStep ? "#22C55E" : "#444" }} />
                <span style={{ color: i === activeStep ? "#F59E0B" : i < activeStep ? "var(--text)" : "var(--text-dim)" }}>{step}</span>
                {i < activeStep && <span className="ml-auto text-sm" style={{ color: "#22C55E" }}>✓</span>}
                {i === activeStep && <span className="ml-auto text-sm" style={{ color: "#F59E0B" }}>...</span>}
              </div>
            ))}
          </div>
        )}

        {/* Active — show results */}
        {analysis.active && (
          <>
            {/* Extraction summary */}
            <div className="flex items-center gap-3 mb-3 text-base" style={{ color: "var(--text-dim)" }}>
              <span>11 entities</span>
              <span>·</span>
              <span>3 endpoints</span>
              <span>·</span>
              <span className="font-medium" style={{ color: "var(--text)" }}>{analysis.events.length} shifts</span>
            </div>

            {/* Severity bar */}
            <div className="flex rounded-full overflow-hidden h-[6px] mb-3">
              {Object.entries(sevCounts).map(([sev, count]) => (
                <div
                  key={sev}
                  style={{ width: `${(count / total) * 100}%`, background: SEV_COLORS[sev] || "#888" }}
                />
              ))}
            </div>

            {/* Events list */}
            <div className="space-y-1.5">
              {analysis.events.slice(0, 4).map((evt) => (
                <div key={evt.entity} className="flex items-center gap-2 px-2 py-1.5 rounded" style={{ background: "var(--surface)" }}>
                  <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: SEV_COLORS[evt.severity] || "#888" }} />
                  <span className="text-sm font-mono truncate flex-1" style={{ color: "var(--text)" }}>{evt.shift}</span>
                  <span className="text-sm" style={{ color: "var(--text-dim)" }}>{evt.entity.split(".").pop()}</span>
                </div>
              ))}
              {analysis.events.length > 4 && (
                <div className="text-sm text-center pt-1" style={{ color: "var(--text-dim)" }}>+{analysis.events.length - 4} more</div>
              )}
            </div>
          </>
        )}
      </div>
    </NodeShell>
  );
}
