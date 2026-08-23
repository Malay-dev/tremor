"use client";
import NodeShell from "./NodeShell";
import BrightDataLogo from "../logos/BrightDataLogo";

interface Props {
  data: { scrapingData?: { active: boolean; scraping: boolean } };
}

export default function BrightDataNode({ data }: Props) {
  const scrapingData = data.scrapingData || { active: false, scraping: false };

  return (
    <NodeShell>
      <div className="w-[300px] rounded-xl border p-4 cursor-grab active:cursor-grabbing transition-all hover:border-[#555]" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2.5 mb-3">
          <BrightDataLogo size={200} />
        </div>

        {!scrapingData.active && !scrapingData.scraping && (
          <div className="text-base text-center py-2" style={{ color: "var(--text-dim)" }}>
            Waiting...
          </div>
        )}

        {scrapingData.scraping && (
          <div className="text-base text-center py-2" style={{ color: "#F59E0B" }}>
            Scraping in progress...
          </div>
        )}

        {scrapingData.active && (
          <div className="space-y-2 text-md mt-2">
            <div className="flex items-center justify-between">
              <span style={{ color: "var(--text-dim)" }}>Collector</span>
              <span className="font-mono text-sm" style={{ color: "var(--text)" }}>c_8f2a91b4</span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: "var(--text-dim)" }}>Extraction</span>
              <span style={{ color: "var(--text)" }}>1,847ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: "var(--text-dim)" }}>Status</span>
              <span style={{ color: "#10B981" }}>● Complete</span>
            </div>
          </div>
        )}
      </div>
    </NodeShell>
  );
}
