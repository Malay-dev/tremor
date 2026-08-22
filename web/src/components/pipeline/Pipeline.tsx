"use client";

import { DEFAULT_PIPELINE, type PipelineStep } from "./types";
import StepNode from "./StepNode";

interface Props {
  onSelectStep: (step: PipelineStep) => void;
  selectedStepId: string | null;
}

export default function Pipeline({ onSelectStep, selectedStepId }: Props) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-8 py-12">
      {/* Pipeline header */}
      <div className="mb-8 text-center">
        <h2 className="text-[15px] font-semibold" style={{ color: "var(--text)" }}>
          IGA Pipeline
        </h2>
        <p className="text-[12px] mt-1" style={{ color: "var(--text-dim)" }}>
          Click any step to inspect its input and output
        </p>
      </div>

      {/* Pipeline flow */}
      <div className="flex items-center gap-0 overflow-x-auto pb-4">
        {DEFAULT_PIPELINE.map((step, i) => (
          <div key={step.id} className="flex items-center">
            <StepNode
              step={step}
              selected={selectedStepId === step.id}
              onClick={() => onSelectStep(step)}
            />
            {/* Connector line */}
            {i < DEFAULT_PIPELINE.length - 1 && (
              <div className="flex items-center mx-1">
                <div className="w-8 h-[2px] relative overflow-hidden" style={{ background: "var(--border)" }}>
                  <div
                    className="absolute inset-y-0 left-0 w-full animate-[flow_1.5s_linear_infinite]"
                    style={{
                      background: "linear-gradient(90deg, transparent, var(--pink), transparent)",
                      animationName: "flow",
                    }}
                  />
                </div>
                <svg width="6" height="10" viewBox="0 0 6 10" fill="none" className="shrink-0">
                  <path d="M1 1L5 5L1 9" stroke="var(--pink)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes flow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
