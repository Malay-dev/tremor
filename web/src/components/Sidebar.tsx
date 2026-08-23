"use client";

import type { VersionInfo, ScrapingData, AnalysisData, AlertsData } from "@/app/page";
import { PIPELINES } from "./pipelines";

interface Props {
  nodeId: string | null;
  onClose: () => void;
  onDiscover: () => void;
  onStartScraping: () => void;
  onInitiateAnalysis: () => void;
  onGenerateAlerts: () => void;
  onSendNotifications: () => void;
  onViewGraph: () => void;
  pipelineId: string;
  discovering: boolean;
  versions: VersionInfo[];
  scrapingData: ScrapingData;
  analysisData: AnalysisData;
  alertsData: AlertsData;
}

export default function Sidebar({ nodeId, onClose, onDiscover, onStartScraping, onInitiateAnalysis, onGenerateAlerts, onSendNotifications, onViewGraph, pipelineId, discovering, versions, scrapingData, analysisData, alertsData }: Props) {
  if (!nodeId) return null;

  if (nodeId === "sf") return <SourcePanel onClose={onClose} onDiscover={onDiscover} discovering={discovering} versions={versions} pipelineId={pipelineId} />;
  if (nodeId === "ver") return <VersionPanel onClose={onClose} versions={versions} onStartScraping={onStartScraping} scrapingData={scrapingData} />;
  if (nodeId === "bd") return <BrightDataPanel onClose={onClose} scrapingData={scrapingData} onInitiateAnalysis={onInitiateAnalysis} />;
  if (nodeId === "eng") return <TremorPanel onClose={onClose} analysisData={analysisData} onGenerateAlerts={onGenerateAlerts} />;
  if (nodeId === "alerts") return <AlertsPanel onClose={onClose} alertsData={alertsData} onSendNotifications={onSendNotifications} onViewGraph={onViewGraph} />;

  return null;
}

// ─── Source Configuration Panel (Salesforce node) ───────────────────────────

function SourcePanel({ onClose, onDiscover, discovering, versions, pipelineId }: { onClose: () => void; onDiscover: () => void; discovering: boolean; versions: VersionInfo[]; pipelineId: string }) {
  const pipeline = PIPELINES[pipelineId];
  return (
    <div className="w-[340px] h-full max-h-[680px] border-l overflow-y-auto" style={{ background: "#FAFAFA", borderColor: "#E5E5E5" }}>
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E5E5E5" }}>
        <span className="text-[14px] font-semibold" style={{ color: "#0F172A" }}>Source Configuration</span>
        <button onClick={onClose} className="text-[18px] leading-none px-2 py-1 rounded hover:bg-[#EBEBEB]" style={{ color: "#64748B" }}>×</button>
      </div>

      <div className="px-5 py-5 space-y-5">
        <div>
          <label className="block text-[12px] font-medium mb-1.5" style={{ color: "#64748B" }}>Base URL</label>
          <input
            type="text"
            defaultValue={pipeline.sourceUrl}
            key={pipelineId}
            className="w-full px-3 py-2.5 text-[13px] rounded-lg border outline-none focus:border-[#3D7FFC]"
            style={{ background: "white", borderColor: "#E5E5E5", color: "#0F172A" }}
          />
          <p className="text-[11px] mt-1.5" style={{ color: "#94A3B8" }}>
            Tremor will discover versioned pages from this URL.
          </p>
        </div>

        <div>
          <label className="block text-[12px] font-medium mb-1.5" style={{ color: "#64748B" }}>Application</label>
          <input
            type="text"
            defaultValue={pipeline.application}
            key={pipelineId + "-app"}
            className="w-full px-3 py-2.5 text-[13px] rounded-lg border outline-none focus:border-[#3D7FFC]"
            style={{ background: "white", borderColor: "#E5E5E5", color: "#0F172A" }}
          />
        </div>

        <button
          onClick={onDiscover}
          disabled={discovering}
          className="w-full py-2.5 rounded-lg text-[13px] font-medium text-white disabled:opacity-60 transition-opacity"
          style={{ background: "#3D7FFC" }}
        >
          {discovering ? "Discovering..." : "Discover Versions"}
        </button>

        {versions.length > 0 && (
          <div className="pt-4 border-t" style={{ borderColor: "#E5E5E5" }}>
            <label className="block text-[12px] font-medium mb-3" style={{ color: "#64748B" }}>
              {discovering ? "Discovering..." : `${versions.length} versions found`}
            </label>
            <div className="space-y-2">
              {versions.map((v) => (
                <button
                  key={v.file}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors"
                  style={{
                    background: v.status === "new" ? "white" : "#F1F1F5",
                    border: v.status === "new" ? "1px solid #10B981" : "1px solid transparent",
                  }}
                >
                  <span className="w-[6px] h-[6px] rounded-full" style={{ background: v.status === "new" ? "#10B981" : v.status === "previous" ? "#3D7FFC" : "#94A3B8" }} />
                  <span className="text-[12px] font-mono" style={{ color: v.status === "old" ? "#64748B" : "#0F172A", fontWeight: v.status === "new" ? 500 : 400 }}>{v.file}</span>
                  {v.status === "previous" && <span className="text-[10px] ml-auto px-1.5 py-0.5 rounded" style={{ background: "#E8F0FE", color: "#3D7FFC" }}>prev</span>}
                  {v.status === "new" && <span className="text-[10px] ml-auto px-1.5 py-0.5 rounded" style={{ background: "#ECFDF5", color: "#10B981" }}>new</span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Version Discovery Panel ────────────────────────────────────────────────

function VersionPanel({ onClose, versions, onStartScraping, scrapingData }: { onClose: () => void; versions: VersionInfo[]; onStartScraping: () => void; scrapingData: ScrapingData }) {
  return (
    <div className="w-[340px] h-full max-h-[680px] border-l overflow-y-auto" style={{ background: "#FAFAFA", borderColor: "#E5E5E5" }}>
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E5E5E5" }}>
        <span className="text-[14px] font-semibold" style={{ color: "#0F172A" }}>Version Discovery</span>
        <button onClick={onClose} className="text-[18px] leading-none px-2 py-1 rounded hover:bg-[#EBEBEB]" style={{ color: "#64748B" }}>×</button>
      </div>

      <div className="px-5 py-5 space-y-5">
        {versions.length === 0 ? (
          <div className="text-[13px] text-center py-8" style={{ color: "#94A3B8" }}>
            No versions discovered yet.<br />
            <span className="text-[11px]">Configure source and click Discover.</span>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-[12px] font-medium mb-3" style={{ color: "#64748B" }}>Discovered Versions</label>
              <div className="space-y-2">
                {versions.map((v) => (
                  <div
                    key={v.file}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                    style={{
                      background: v.status === "new" ? "white" : "#F1F1F5",
                      border: v.status === "new" ? "1px solid #10B981" : "1px solid transparent",
                    }}
                  >
                    <span className="w-[6px] h-[6px] rounded-full" style={{ background: v.status === "new" ? "#10B981" : v.status === "previous" ? "#3D7FFC" : "#94A3B8" }} />
                    <div className="flex-1">
                      <div className="text-[12px] font-mono" style={{ color: v.status === "old" ? "#64748B" : "#0F172A" }}>{v.file}</div>
                      <div className="text-[10px] mt-0.5" style={{ color: "#94A3B8" }}>
                        Detected {v.status === "new" ? "just now" : v.status === "previous" ? "2 days ago" : "1 week ago"}
                      </div>
                    </div>
                    {v.status === "previous" && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#E8F0FE", color: "#3D7FFC" }}>prev</span>}
                    {v.status === "new" && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#ECFDF5", color: "#10B981" }}>new</span>}
                  </div>
                ))}
              </div>
            </div>

            {versions.some((v) => v.status === "new") && (
              <div className="pt-4 border-t" style={{ borderColor: "#E5E5E5" }}>
                <label className="block text-[12px] font-medium mb-2" style={{ color: "#64748B" }}>Comparing</label>
                <div className="flex items-center gap-3 px-3 py-3 rounded-lg" style={{ background: "#F1F1F5" }}>
                  <span className="px-2.5 py-1.5 rounded-lg font-mono text-[12px]" style={{ background: "white", color: "#64748B", border: "1px solid #E5E5E5" }}>{versions.find(v => v.status === "previous")?.file.match(/v?\d+/)?.[0] || "prev"}</span>
                  <span className="text-[12px]" style={{ color: "#94A3B8" }}>→</span>
                  <span className="px-2.5 py-1.5 rounded-lg font-mono text-[12px]" style={{ background: "white", color: "#10B981", border: "1px solid #10B981" }}>{versions.find(v => v.status === "new")?.file.match(/v?\d+/)?.[0] || "new"}</span>
                </div>
              </div>
            )}

            {versions.some((v) => v.status === "new") && !scrapingData.active && (
              <button
                onClick={onStartScraping}
                disabled={scrapingData.scraping}
                className="w-full py-2.5 rounded-lg text-[13px] font-medium text-white disabled:opacity-60 transition-opacity"
                style={{ background: "#0F172A" }}
              >
                {scrapingData.scraping ? "Scraping..." : "Start Scraping →"}
              </button>
            )}

            {scrapingData.active && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ background: "#ECFDF5", border: "1px solid #A7F3D0" }}>
                <span className="w-[6px] h-[6px] rounded-full bg-[#10B981]" />
                <span className="text-[12px] font-medium" style={{ color: "#065F46" }}>Scraping complete</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Bright Data Panel ──────────────────────────────────────────────────────

function BrightDataPanel({ onClose, scrapingData, onInitiateAnalysis }: { onClose: () => void; scrapingData: ScrapingData; onInitiateAnalysis: () => void }) {
  return (
    <div className="w-[340px] h-full max-h-[680px] border-l overflow-y-auto" style={{ background: "#FAFAFA", borderColor: "#E5E5E5" }}>
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E5E5E5" }}>
        <span className="text-[14px] font-semibold" style={{ color: "#0F172A" }}>Bright Data</span>
        <button onClick={onClose} className="text-[18px] leading-none px-2 py-1 rounded hover:bg-[#EBEBEB]" style={{ color: "#64748B" }}>×</button>
      </div>

      <div className="px-5 py-5 space-y-5">
        {/* Collector info */}
        <div>
          <label className="block text-[12px] font-medium mb-2" style={{ color: "#64748B" }}>Collector</label>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[12px]">
              <span style={{ color: "#64748B" }}>ID</span>
              <span className="font-mono" style={{ color: "#0F172A" }}>c_8f2a91b4</span>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span style={{ color: "#64748B" }}>Mode</span>
              <span style={{ color: "#0F172A" }}>Real-time</span>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span style={{ color: "#64748B" }}>Status</span>
              <span className="flex items-center gap-1.5" style={{ color: "#10B981" }}>
                <span className="w-[5px] h-[5px] rounded-full bg-[#10B981]" />
                Healthy
              </span>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span style={{ color: "#64748B" }}>Self-healing</span>
              <span style={{ color: "#10B981" }}>Active</span>
            </div>
          </div>
        </div>

        {!scrapingData.active && !scrapingData.scraping && (
          <div className="text-[12px] text-center py-6" style={{ color: "#94A3B8" }}>
            Waiting for scraping to start...
          </div>
        )}

        {scrapingData.scraping && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
            <span className="w-[6px] h-[6px] rounded-full bg-[#F59E0B]" />
            <span className="text-[12px]" style={{ color: "#92400E" }}>Scraping in progress...</span>
          </div>
        )}

        {scrapingData.active && (
          <>
            {/* Scraping targets */}
            <div className="pt-4 border-t" style={{ borderColor: "#E5E5E5" }}>
              <label className="block text-[12px] font-medium mb-2" style={{ color: "#64748B" }}>Scraping Targets</label>
              <div className="space-y-2">
                <div className="px-3 py-2.5 rounded-lg" style={{ background: "#F1F1F5" }}>
                  <div className="text-[11px] font-mono" style={{ color: "#0F172A" }}>accounts-v4.html</div>
                  <div className="text-[10px] mt-1" style={{ color: "#94A3B8" }}>Previous version</div>
                </div>
                <div className="px-3 py-2.5 rounded-lg border" style={{ background: "white", borderColor: "#10B981" }}>
                  <div className="text-[11px] font-mono" style={{ color: "#0F172A" }}>account-v5.html</div>
                  <div className="text-[10px] mt-1" style={{ color: "#10B981" }}>New version</div>
                </div>
              </div>
            </div>

            {/* Snapshots */}
            <div className="pt-4 border-t" style={{ borderColor: "#E5E5E5" }}>
              <label className="block text-[12px] font-medium mb-2" style={{ color: "#64748B" }}>Snapshots</label>
              <div className="space-y-2 text-[12px]">
                <div className="flex items-center justify-between">
                  <span style={{ color: "#64748B" }}>Hash (v4)</span>
                  <span className="font-mono text-[10px]" style={{ color: "#0F172A" }}>a3f8c1...e7d2</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: "#64748B" }}>Hash (v5)</span>
                  <span className="font-mono text-[10px]" style={{ color: "#0F172A" }}>b9e4f2...1a8c</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: "#64748B" }}>Content size</span>
                  <span style={{ color: "#0F172A" }}>847 B → 1,204 B</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: "#64748B" }}>Extraction time</span>
                  <span style={{ color: "#0F172A" }}>1,847ms</span>
                </div>
              </div>
            </div>

            {/* Content diff */}
            <div className="pt-4 border-t" style={{ borderColor: "#E5E5E5" }}>
              <label className="block text-[12px] font-medium mb-2" style={{ color: "#64748B" }}>Content Diff Preview</label>
              <div className="rounded-lg overflow-hidden border" style={{ borderColor: "#E5E5E5" }}>
                <pre className="text-[10px] font-mono leading-[1.7] p-3 overflow-x-auto" style={{ background: "#FAFAFA", color: "#64748B" }}>
{`- status: boolean
+ status: enum(ACTIVE, INACTIVE, SUSPENDED)

- email: required
+ email: optional

+ department: required (new)
+ manager_id: required (new)`}
                </pre>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ background: "#ECFDF5", border: "1px solid #A7F3D0" }}>
              <span className="w-[6px] h-[6px] rounded-full bg-[#10B981]" />
              <span className="text-[12px] font-medium" style={{ color: "#065F46" }}>Change detected — ready for analysis</span>
            </div>

            {/* Initiate Analysis button */}
            <button
              onClick={onInitiateAnalysis}
              className="w-full py-2.5 rounded-lg text-[13px] font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: "#0F172A" }}
            >
              Initiate Analysis →
            </button>
          </>
        )}
      </div>
    </div>
  );
}


// ─── Tremor Engine Panel ────────────────────────────────────────────────────

const SEV_COLORS: Record<string, string> = {
  CRITICAL: "#EF4444",
  HIGH: "#F97316",
  MEDIUM: "#EAB308",
  LOW: "#22C55E",
  INFO: "#94A3B8",
};

const SEV_BG: Record<string, string> = {
  CRITICAL: "#FEF2F2",
  HIGH: "#FFF7ED",
  MEDIUM: "#FEFCE8",
  LOW: "#F0FDF4",
  INFO: "#F8FAFC",
};

const SEV_BORDER: Record<string, string> = {
  CRITICAL: "#FECACA",
  HIGH: "#FED7AA",
  MEDIUM: "#FEF08A",
  LOW: "#BBF7D0",
  INFO: "#E2E8F0",
};

function TremorPanel({ onClose, analysisData, onGenerateAlerts }: { onClose: () => void; analysisData: AnalysisData; onGenerateAlerts: () => void }) {
  return (
    <div className="w-[340px] h-full max-h-[680px] border-l overflow-y-auto" style={{ background: "#FAFAFA", borderColor: "#E5E5E5" }}>
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E5E5E5" }}>
        <span className="text-[14px] font-semibold" style={{ color: "#0F172A" }}>Tremor Engine</span>
        <button onClick={onClose} className="text-[18px] leading-none px-2 py-1 rounded hover:bg-[#EBEBEB]" style={{ color: "#64748B" }}>×</button>
      </div>

      <div className="px-5 py-5 space-y-5">
        {/* Model info */}
        <div>
          <label className="block text-[12px] font-medium mb-2" style={{ color: "#64748B" }}>Configuration</label>
          <div className="space-y-2 text-[12px]">
            <div className="flex items-center justify-between">
              <span style={{ color: "#64748B" }}>Model</span>
              <span style={{ color: "#0F172A" }}>Gemini 2.5 Flash</span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: "#64748B" }}>Taxonomy</span>
              <span style={{ color: "#0F172A" }}>17 shift types</span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: "#64748B" }}>Processing</span>
              <span style={{ color: "#0F172A" }}>3,241ms</span>
            </div>
          </div>
        </div>

        {!analysisData.active && !analysisData.analyzing && (
          <div className="text-[12px] text-center py-6" style={{ color: "#94A3B8" }}>
            Waiting for scraped data...
          </div>
        )}

        {analysisData.analyzing && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
            <span className="w-[6px] h-[6px] rounded-full bg-[#F59E0B]" />
            <span className="text-[12px]" style={{ color: "#92400E" }}>Analyzing semantic changes...</span>
          </div>
        )}

        {analysisData.active && (
          <>
            {/* Summary */}
            <div className="pt-4 border-t" style={{ borderColor: "#E5E5E5" }}>
              <label className="block text-[12px] font-medium mb-2" style={{ color: "#64748B" }}>
                {analysisData.events.length} Semantic Changes Detected
              </label>
            </div>

            {/* Events */}
            <div className="space-y-2">
              {analysisData.events.map((evt) => (
                <div
                  key={evt.entity}
                  className="px-3 py-3 rounded-lg border"
                  style={{ background: SEV_BG[evt.severity] || "#F8FAFC", borderColor: SEV_BORDER[evt.severity] || "#E2E8F0" }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-[6px] h-[6px] rounded-full" style={{ background: SEV_COLORS[evt.severity] }} />
                    <span className="text-[11px] font-mono font-medium" style={{ color: "#0F172A" }}>{evt.shift}</span>
                    <span className="text-[10px] ml-auto px-1.5 py-0.5 rounded" style={{ background: SEV_COLORS[evt.severity] + "20", color: SEV_COLORS[evt.severity] }}>{evt.severity}</span>
                  </div>
                  <div className="text-[11px] pl-4" style={{ color: "#64748B" }}>
                    <span className="font-mono">{evt.entity}</span>
                  </div>
                  <div className="flex items-center gap-2 pl-4 mt-1 text-[10px]">
                    <span style={{ color: "#94A3B8" }}>{evt.before}</span>
                    <span style={{ color: "#94A3B8" }}>→</span>
                    <span style={{ color: "#0F172A" }}>{evt.after}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Ready for impact */}
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ background: "#ECFDF5", border: "1px solid #A7F3D0" }}>
              <span className="w-[6px] h-[6px] rounded-full bg-[#10B981]" />
              <span className="text-[12px] font-medium" style={{ color: "#065F46" }}>Ready for impact analysis</span>
            </div>

            {/* Generate Alerts button */}
            <button
              onClick={onGenerateAlerts}
              className="w-full py-2.5 rounded-lg text-[13px] font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: "#0F172A" }}
            >
              Generate Alerts →
            </button>
          </>
        )}
      </div>
    </div>
  );
}


// ─── Alerts Panel ───────────────────────────────────────────────────────────

const ALERT_SEV_COLORS: Record<string, string> = { CRITICAL: "#EF4444", HIGH: "#F97316", MEDIUM: "#EAB308", LOW: "#22C55E" };
const ALERT_SEV_BG: Record<string, string> = { CRITICAL: "#FEF2F2", HIGH: "#FFF7ED", MEDIUM: "#FEFCE8", LOW: "#F0FDF4" };
const ALERT_SEV_BORDER: Record<string, string> = { CRITICAL: "#FECACA", HIGH: "#FED7AA", MEDIUM: "#FEF08A", LOW: "#BBF7D0" };

function AlertsPanel({ onClose, alertsData, onSendNotifications, onViewGraph }: { onClose: () => void; alertsData: AlertsData; onSendNotifications: () => void; onViewGraph: () => void }) {
  return (
    <div className="w-[340px] h-full max-h-[680px] border-l overflow-y-auto" style={{ background: "#FAFAFA", borderColor: "#E5E5E5" }}>
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E5E5E5" }}>
        <span className="text-[14px] font-semibold" style={{ color: "#0F172A" }}>Alerts — IGA Adapter</span>
        <button onClick={onClose} className="text-[18px] leading-none px-2 py-1 rounded hover:bg-[#EBEBEB]" style={{ color: "#64748B" }}>×</button>
      </div>

      <div className="px-5 py-5 space-y-5">
        {!alertsData.active && !alertsData.generating && (
          <div className="text-[12px] text-center py-6" style={{ color: "#94A3B8" }}>
            Waiting for analysis to complete...
          </div>
        )}

        {alertsData.generating && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
            <span className="w-[6px] h-[6px] rounded-full bg-[#F59E0B]" />
            <span className="text-[12px]" style={{ color: "#92400E" }}>Generating alerts...</span>
          </div>
        )}

        {alertsData.active && (
          <>
            {/* Summary */}
            <div>
              <label className="block text-[12px] font-medium mb-2" style={{ color: "#64748B" }}>
                {alertsData.alerts.length} Alerts Generated
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {Object.entries(
                  alertsData.alerts.reduce((acc, a) => { acc[a.severity] = (acc[a.severity] || 0) + 1; return acc; }, {} as Record<string, number>)
                ).map(([sev, count]) => (
                  <span key={sev} className="flex items-center gap-1 text-[11px] px-2 py-1 rounded" style={{ background: ALERT_SEV_BG[sev], color: ALERT_SEV_COLORS[sev], border: `1px solid ${ALERT_SEV_BORDER[sev]}` }}>
                    <span className="w-[5px] h-[5px] rounded-full" style={{ background: ALERT_SEV_COLORS[sev] }} />
                    {count} {sev.toLowerCase()}
                  </span>
                ))}
              </div>
            </div>

            {/* Alerts list */}
            <div className="space-y-3">
              {alertsData.alerts.map((alert) => (
                <div key={alert.title} className="px-3 py-3 rounded-lg border" style={{ background: ALERT_SEV_BG[alert.severity] || "#F8FAFC", borderColor: ALERT_SEV_BORDER[alert.severity] || "#E2E8F0" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-[6px] h-[6px] rounded-full" style={{ background: ALERT_SEV_COLORS[alert.severity] }} />
                    <span className="text-[12px] font-medium" style={{ color: "#0F172A" }}>{alert.title}</span>
                    <span className="text-[9px] ml-auto px-1.5 py-0.5 rounded" style={{ background: ALERT_SEV_COLORS[alert.severity] + "20", color: ALERT_SEV_COLORS[alert.severity] }}>{alert.severity}</span>
                  </div>
                  <div className="text-[11px] pl-4 mb-2" style={{ color: "#64748B" }}>{alert.summary}</div>
                  <div className="pl-4 pt-2 border-t" style={{ borderColor: ALERT_SEV_BORDER[alert.severity] }}>
                    <div className="text-[10px] font-medium" style={{ color: "#64748B" }}>Remediation:</div>
                    <div className="text-[11px] mt-0.5" style={{ color: "#0F172A" }}>{alert.remediation}</div>
                    <div className="text-[10px] mt-1" style={{ color: "#94A3B8" }}>Effort: {alert.effort}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-4 border-t" style={{ borderColor: "#E5E5E5" }}>
              <button
                onClick={onSendNotifications}
                className="flex-1 py-2.5 rounded-lg text-[12px] font-medium text-white transition-opacity hover:opacity-90"
                style={{ background: "#0F172A" }}
              >
                Send Notifications
              </button>
              <button
                onClick={onViewGraph}
                className="flex-1 py-2.5 rounded-lg text-[12px] font-medium border transition-colors hover:bg-[#F1F1F5]"
                style={{ borderColor: "#E5E5E5", color: "#0F172A" }}
              >
                View Graph
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
