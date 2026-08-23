"use client";

import { useState } from "react";
import Hero from "@/components/Hero";
import Canvas from "@/components/Canvas";
import Sidebar from "@/components/Sidebar";
import GraphModal from "@/components/GraphModal";
import Toast, { type ToastItem } from "@/components/Toast";
import SlackLogo from "@/components/logos/SlackLogo";
import TelegramLogo from "@/components/logos/TelegramLogo";
import WebhooksIcon from "@/components/icons/WebhooksIcon";
import { PIPELINES } from "@/components/pipelines";
import * as api from "@/lib/api";

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
  const [pipelineId, setPipelineId] = useState("iga");
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [discovering, setDiscovering] = useState(false);
  const [scrapingData, setScrapingData] = useState<ScrapingData>({ active: false, scraping: false });
  const [analysisData, setAnalysisData] = useState<AnalysisData>({ active: false, analyzing: false, events: [] });
  const [alertsData, setAlertsData] = useState<AlertsData>({ active: false, generating: false, alerts: [] });
  const [graphOpen, setGraphOpen] = useState(false);
  const [notificationsSent, setNotificationsSent] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [canvasLocked, setCanvasLocked] = useState(false);

  // Handle lock toggle from Controls' interactive button
  const onInteractiveChange = (interactive: boolean) => {
    setCanvasLocked(!interactive);
  };

  const handleDiscover = async () => {
    setDiscovering(true);
    setVersions([]);
    const pipeline = PIPELINES[pipelineId];
    try {
      const res = await api.discoverVersions(pipeline.sourceUrl, pipeline.application);
      // Animate versions in one by one
      const versionsList = res.versions || pipeline.versions;
      for (let i = 0; i < versionsList.length; i++) {
        setTimeout(() => {
          setVersions(versionsList.slice(0, i + 1));
          if (i === versionsList.length - 1) setDiscovering(false);
        }, 600 * (i + 1));
      }
    } catch {
      // Fallback to local data
      const pVersions = pipeline.versions;
      setTimeout(() => { setVersions(pVersions.slice(0, 1)); }, 600);
      setTimeout(() => { setVersions(pVersions.slice(0, 2)); }, 1200);
      setTimeout(() => { setVersions(pVersions); setDiscovering(false); }, 1800);
    }
  };

  const handleStartScraping = async () => {
    setScrapingData({ active: false, scraping: true });
    const pipeline = PIPELINES[pipelineId];
    try {
      await api.scrapeVersions(pipeline.sourceUrl, pipeline.application);
    } catch { /* fallback — just complete */ }
    setTimeout(() => setScrapingData({ active: true, scraping: false }), 1500);
  };

  const handleInitiateAnalysis = async () => {
    setAnalysisData({ active: false, analyzing: true, events: [] });
    const pipeline = PIPELINES[pipelineId];
    try {
      const res = await api.analyzeChanges(pipeline.application);
      setAnalysisData({ active: true, analyzing: false, events: res.events || pipeline.analysisEvents });
    } catch {
      setTimeout(() => {
        setAnalysisData({ active: true, analyzing: false, events: pipeline.analysisEvents });
      }, 2500);
    }
  };

  const handleGenerateAlerts = async () => {
    setAlertsData({ active: false, generating: true, alerts: [] });
    const pipeline = PIPELINES[pipelineId];
    try {
      const res = await api.generateAlerts(pipeline.application);
      setAlertsData({ active: true, generating: false, alerts: res.alerts || pipeline.alerts });
    } catch {
      setTimeout(() => {
        setAlertsData({ active: true, generating: false, alerts: pipeline.alerts });
      }, 2000);
    }
  };

  const handleSendNotifications = async () => {
    setNotificationsSent(true);
    const pipeline = PIPELINES[pipelineId];
    const iconMap: Record<string, React.ReactNode> = {
      slack: <SlackLogo size={22} />,
      telegram: <TelegramLogo size={22} />,
      webhook: <WebhooksIcon size={22} />,
      sheets: <span className="text-[18px]">📊</span>,
      jira: <span className="text-[18px]">🎫</span>,
    };

    try {
      const channels = pipeline.toasts.map((t) => t.iconType);
      await api.sendNotifications(pipeline.application, channels);
    } catch { /* continue with toasts anyway */ }

    pipeline.toasts.forEach((t, i) => {
      setTimeout(() => {
        setToasts((prev) => [...prev, { ...t, icon: iconMap[t.iconType] || <span>📨</span> }]);
      }, 400 + i * 800);
    });
    setTimeout(() => { setToasts([]); }, 12000);
  };

  const handleViewGraph = () => {
    setGraphOpen(true);
  };

  const handleReset = () => {
    setVersions([]);
    setDiscovering(false);
    setScrapingData({ active: false, scraping: false });
    setAnalysisData({ active: false, analyzing: false, events: [] });
    setAlertsData({ active: false, generating: false, alerts: [] });
    setNotificationsSent(false);
    setToasts([]);
    setSelectedNode(null);
  };

  const handleRunAll = () => {
    handleDiscover();
    setTimeout(() => handleStartScraping(), 2500);
    setTimeout(() => handleInitiateAnalysis(), 5000);
    setTimeout(() => handleGenerateAlerts(), 8000);
    setTimeout(() => handleSendNotifications(), 10500);
  };

  return (
    <>
      <Hero />
      <section id="playground" className="px-6 md:px-12 pb-20">
        {/* Toolbar — outside the canvas container */}
        <div className="max-w-[1440px] mx-auto flex items-center px-4 py-2.5 mb-3 rounded-lg border" style={{ background: "white", borderColor: "#E5E5E5" }}>
          <div className="flex items-center gap-3">
            <span className="text-[12px] font-medium" style={{ color: "#94A3B8" }}>Pipeline</span>
            <select
              className="px-3 py-1.5 rounded-md text-[12px] font-medium border outline-none cursor-pointer"
              style={{ background: "white", color: "#0F172A", borderColor: "#E5E5E5" }}
              value={pipelineId}
              onChange={(e) => { setPipelineId(e.target.value); handleReset(); }}
            >
              <option value="iga">IGA — Salesforce</option>
              <option value="rfp">RFP — Government Portal</option>
              <option value="api">API — Stripe Docs</option>
            </select>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button onClick={handleRunAll} className="text-[11px] font-medium px-3 py-1.5 rounded-md text-white" style={{ background: "#10B981" }}>Run</button>
            <button onClick={handleReset} className="text-[11px] font-medium px-3 py-1.5 rounded-md border" style={{ borderColor: "#E5E5E5", color: "#64748B" }}>Reset</button>
            <span className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md" style={{ background: "#ECFDF5", color: "#065F46", border: "1px solid #A7F3D0" }}>
              <span className="w-[5px] h-[5px] rounded-full bg-[#10B981] animate-pulse" />
              Live
            </span>
            <span className="text-[11px] px-2.5 py-1 rounded-md" style={{ background: "#F1F1F5", color: "#64748B" }}>
              {analysisData.events.length > 0 ? `${analysisData.events.length} events` : "0 events"}
            </span>
          </div>
        </div>

        {/* Canvas container */}
        <div className="max-w-[1440px] mx-auto rounded-2xl border overflow-hidden flex flex-col" style={{ background: "#FFFFFF", borderColor: "#E5E5E5", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          {/* Canvas */}
          <div className="flex flex-1">
            <div className="flex-1" style={{ height: "640px" }}>
              <Canvas
              onNodeClick={(id) => setSelectedNode(id)}
              versions={versions}
              discovering={discovering}
              scrapingData={scrapingData}
              analysisData={analysisData}
              alertsData={alertsData}
              notificationsSent={notificationsSent}
              locked={canvasLocked}
              onLockChange={onInteractiveChange}
              pipelineId={pipelineId}
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
              pipelineId={pipelineId}
              discovering={discovering}
              versions={versions}
              scrapingData={scrapingData}
              analysisData={analysisData}
              alertsData={alertsData}
            />
          )}
          </div>
        </div>
      </section>

      {/* Graph Modal */}
      <GraphModal open={graphOpen} onClose={() => setGraphOpen(false)} />

      {/* Toasts */}
      <Toast toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </>
  );
}
