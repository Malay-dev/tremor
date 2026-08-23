"use client";

export default function Hero() {
  return (
    <div className="px-6 pt-6 pb-10 max-w-[1200px] mx-auto">
      {/* Section 1: Tremor brand + nav */}
      <div className="flex items-center justify-between mb-8">
        <span className="text-2xl text-white font-bold tracking-tight px-6 py-3 rounded-xl bg-blue-700">
          Tremor
        </span>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com"
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium border transition-colors hover:bg-[#F1F1F5]"
            style={{ borderColor: "#E5E5E5", color: "#0F172A" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            GitHub
          </a>
          <a
            href="/docs"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium border transition-colors hover:bg-[#F1F1F5]"
            style={{ borderColor: "#E5E5E5", color: "#0F172A" }}
          >
            Docs
          </a>
        </div>
      </div>

      {/* Section 2: Hero content */}
      <div className="rounded-2xl px-10 py-14 text-center mt-10" style={{ background: "#F1F1F5" }}>
        <h1 className="text-[clamp(2rem,4.5vw,3.5rem)] font-bold tracking-[-0.03em] leading-[1.1] mb-4" style={{ color: "#0F172A" }}>
          Change intelligence for<br />enterprise integrations.
        </h1>
        <p className="text-[16px] leading-[1.6] max-w-[520px] mx-auto mb-6" style={{ color: "#64748B" }}>
          Monitor web sources, detect semantic changes, predict which integrations break, and alert the right teams — automatically.
        </p>
        <div className="flex items-center justify-center gap-2 text-[12px]" style={{ color: "#94A3B8" }}>
          <span className="px-2 py-1 rounded" style={{ background: "white" }}>Bright Data</span>
          <span>·</span>
          <span className="px-2 py-1 rounded" style={{ background: "white" }}>Gemini</span>
          <span>·</span>
          <span className="px-2 py-1 rounded" style={{ background: "white" }}>Neo4j</span>
          <span>·</span>
          <span className="px-2 py-1 rounded" style={{ background: "white" }}>FastAPI</span>
        </div>
      </div>
    </div>
  );
}
