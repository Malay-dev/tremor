"use client";

export default function Hero() {
  return (
    <div className="px-6 pt-6 pb-10 max-w-[1200px] mx-auto">
      {/* Section 1: Tremor brand */}
      <div className="mb-8">
        <span className="text-2xl text-white font-bold tracking-tight p-8 rounded-b-2xl bg-blue-700" style={{ color: "#FFFFF" }}>        
            Tremor
        </span>
      </div>

      {/* Section 2: Hero content */}
      <div className="rounded-2xl px-10 py-14 text-center mt-20" style={{ background: "#F1F1F5" }}>
        <h1 className="text-[clamp(2rem,4.5vw,3.5rem)] font-bold tracking-[-0.03em] leading-[1.1] mb-4" style={{ color: "#0F172A" }}>
          Change intelligence for<br />enterprise integrations.
        </h1>
        <p className="text-[16px] leading-[1.6] max-w-[520px] mx-auto" style={{ color: "#64748B" }}>
          Monitor web sources, detect semantic changes, predict which integrations break, and alert the right teams — automatically.
        </p>
      </div>
    </div>
  );
}
