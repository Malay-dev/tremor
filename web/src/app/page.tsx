"use client";

import { useState } from "react";
import Hero from "@/components/Hero";
import Canvas from "@/components/Canvas";
import Sidebar from "@/components/Sidebar";
import GraphModal from "@/components/GraphModal";

export interface VersionInfo {
  file: string;
  status: "old" | "previous" | "new";
}

export interface ScrapingData {
  active: boolean;
  scraping: boolean;
}

export interface AlertsData {
  active: boolean;
  generating: boolean;
  alerts: Array<{
    title: string;
    severity: string;
    entity: string;
    summary: string;
    remediation: string;
    effort: string;
  }>;
}

export interface AnalysisData {
  active: boolean;
  analyzing: boolean;
  events: Array<{
    shift: string;
    entity: string;
    severity: string;
    before: string;
    after: string;
  }>;
}

export default function Home() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [discovering, setDiscovering] = useState(false);
  const [scrapingData, setScrapingData] = useState<ScrapingData>({ active: false, scraping: false });
  const [analysisData, setAnalysisData] = useState<AnalysisData>({ active: false, analyzing: false, events: [] });
  const [alertsData, setAlertsData] = useState<AlertsData>({ active: false, generating: false, alerts: [] });
  const [graphOpen, setGraphOpen] = useState(false);
  const [notificationsSent, setNotificationsSent] = useState(false);

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
    setTimeout(() => {
      setScrapingData({ active: true, scraping: false });
    }, 2000);
  };

  const handleInitiateAnalysis = () => {
    setAnalysisData({ active: false, analyzing: true, events: [] });
    setTimeout(() => {
      setAnalysisData({
        active: true,
        analyzing: false,
        events: [
          { shift: "BREAKING_REMOVAL", entity: "auth_flows", severity: "CRITICAL", before: "API Key", after: "OAuth 2.0" },
          { shift: "STATE_SPACE_EXPANDED", entity: "User.status", severity: "HIGH", before: "BOOLEAN", after: "ENUM(ACTIVE,INACTIVE,SUSPENDED)" },
          { shift: "NULLABILITY_CHANGED", entity: "User.department", severity: "HIGH", before: "optional", after: "required" },
          { shift: "NULLABILITY_CHANGED", entity: "User.manager_id", severity: "HIGH", before: "optional", after: "required" },
          { shift: "DEPRECATION_ANNOUNCED", entity: "User.phone", severity: "MEDIUM", before: "active", after: "deprecated" },
          { shift: "SCOPE_WIDENED", entity: "POST /User/{id}/lifecycle", severity: "INFO", before: "absent", after: "added" },
        ],
      });
    }, 2500);
  };

  const handleGenerateAlerts = () => {
    setAlertsData({ active: false, generating: true, alerts: [] });
    setTimeout(() => {
      setAlertsData({
        active: true,
        generating: false,
        alerts: [
          { title: "Auth flow removed", severity: "CRITICAL", entity: "auth_flows", summary: "Connector authentication will fail immediately", remediation: "Update connector auth to OAuth 2.0", effort: "1 hour" },
          { title: "Status field expanded", severity: "HIGH", entity: "User.status", summary: "Provisioning rules won't handle SUSPENDED state", remediation: "Update attribute mapping for new states", effort: "2-4 hours" },
          { title: "Department now required", severity: "HIGH", entity: "User.department", summary: "Integrations not providing it will fail", remediation: "Review ABAC policies referencing this attribute", effort: "1 hour" },
          { title: "Phone field deprecated", severity: "MEDIUM", entity: "User.phone", summary: "Plan migration before removal", remediation: "Schedule connector update in next maintenance", effort: "1 sprint" },
        ],
      });
    }, 2000);
  };

  const handleSendNotifications = () => {
    setNotificationsSent(true);
  };

  const handleViewGraph = () => {
    setGraphOpen(true);
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
              analysisData={analysisData}
              alertsData={alertsData}
              notificationsSent={notificationsSent}
            />
          </div>

          {/* Sidebar */}
          {(selectedNode === "sf" || selectedNode === "ver" || selectedNode === "bd" || selectedNode === "eng" || selectedNode === "alerts") && (
            <Sidebar
              nodeId={selectedNode}
              onClose={() => setSelectedNode(null)}
              onDiscover={handleDiscover}
              onStartScraping={handleStartScraping}
              onInitiateAnalysis={handleInitiateAnalysis}
              onGenerateAlerts={handleGenerateAlerts}
              onSendNotifications={handleSendNotifications}
              onViewGraph={handleViewGraph}
              discovering={discovering}
              versions={versions}
              scrapingData={scrapingData}
              analysisData={analysisData}
              alertsData={alertsData}
            />
          )}
        </div>
      </section>

      {/* Graph Modal */}
      <GraphModal open={graphOpen} onClose={() => setGraphOpen(false)} />
    </>
  );
}
