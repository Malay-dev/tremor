"use client";

import { useState } from "react";
import Hero from "@/components/Hero";
import Canvas from "@/components/Canvas";
import Sidebar from "@/components/Sidebar";

export interface VersionInfo {
  file: string;
  status: "old" | "previous" | "new";
}

export interface ScrapingData {
  active: boolean;
  scraping: boolean;
}

export default function Home() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [discovering, setDiscovering] = useState(false);
  const [scrapingData, setScrapingData] = useState<ScrapingData>({ active: false, scraping: false });

  const handleDiscover = () => {
    setDiscovering(true);
    setVersions([]);

    setTimeout(() => {
      setVersions([{ file: "accounts-v3.html", status: "old" }]);
    }, 600);
    setTimeout(() => {
      setVersions([
        { file: "accounts-v3.html", status: "old" },
        { file: "accounts-v4.html", status: "previous" },
      ]);
    }, 1200);
    setTimeout(() => {
      setVersions([
        { file: "accounts-v3.html", status: "old" },
        { file: "accounts-v4.html", status: "previous" },
        { file: "account-v5.html", status: "new" },
      ]);
      setDiscovering(false);
    }, 1800);
  };

  const handleStartScraping = () => {
    setScrapingData({ active: false, scraping: true });
    // Simulate scraping completing
    setTimeout(() => {
      setScrapingData({ active: true, scraping: false });
    }, 2000);
  };

  return (
    <>
      <Hero />
      <section id="playground" className="px-6 md:px-12 pb-20">
        <div className="max-w-[1440px] mx-auto rounded-2xl border overflow-hidden flex" style={{ background: "#FFFFFF", borderColor: "#E5E5E5", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          {/* Canvas */}
          <div className="flex-1" style={{ height: "680px" }}>
            <Canvas
              onNodeClick={(id) => setSelectedNode(id)}
              versions={versions}
              discovering={discovering}
              scrapingData={scrapingData}
            />
          </div>

          {/* Sidebar */}
          {(selectedNode === "sf" || selectedNode === "ver" || selectedNode === "bd") && (
            <Sidebar
              nodeId={selectedNode}
              onClose={() => setSelectedNode(null)}
              onDiscover={handleDiscover}
              onStartScraping={handleStartScraping}
              discovering={discovering}
              versions={versions}
              scrapingData={scrapingData}
            />
          )}
        </div>
      </section>
    </>
  );
}
