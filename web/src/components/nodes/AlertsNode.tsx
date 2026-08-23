"use client";
import NodeShell from "./NodeShell";
import AlertIcon from "../icons/AlertIcon";

const SEV_COLORS: Record<string, string> = {
  CRITICAL: "#EF4444",
  HIGH: "#F97316",
  MEDIUM: "#EAB308",
  LOW: "#22C55E",
};

interface Props {
  data: { alertsData?: { active: boolean; generating: boolean; alerts: Array<{ title: string; severity: string }> } };
}

export default function AlertsNode({ data }: Props) {
  const alertsData = data.alertsData || { active: false, generating: false, alerts: [] };

  return (
    <NodeShell>
      <div className="w-[300px] rounded-xl border p-4 cursor-grab active:cursor-grabbing transition-all hover:border-[#555]" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <AlertIcon size={30}></AlertIcon>
          <div>
            <div className="text-md font-semibold" style={{ color: "var(--text)" }}>Alerts</div>
          </div>
        </div>

        {!alertsData.active && !alertsData.generating && (
          <div className="text-base text-center py-3" style={{ color: "var(--text-dim)" }}>
            Waiting for analysis...
          </div>
        )}

        {alertsData.generating && (
          <div className="text-base text-center py-3" style={{ color: "#F59E0B" }}>
            Generating alerts...
          </div>
        )}

        {alertsData.active && (
          <>
            {/* Severity counts */}
            <div className="flex items-center gap-2 mb-3">
              {Object.entries(
                alertsData.alerts.reduce((acc, a) => { acc[a.severity] = (acc[a.severity] || 0) + 1; return acc; }, {} as Record<string, number>)
              ).map(([sev, count]) => (
                <span key={sev} className="flex items-center gap-1 text-sm px-2 py-0.5 rounded" style={{ background: (SEV_COLORS[sev] || "#888") + "15", color: SEV_COLORS[sev] || "#888" }}>
                  <span className="w-[4px] h-[4px] rounded-full" style={{ background: SEV_COLORS[sev] }} />
                  {count} {sev.toLowerCase()}
                </span>
              ))}
            </div>

            {/* Alert list */}
            <div className="space-y-1.5">
              {alertsData.alerts.slice(0, 3).map((alert) => (
                <div key={alert.title} className="flex items-center gap-2 px-2 py-1.5 rounded" style={{ background: "var(--surface)" }}>
                  <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: SEV_COLORS[alert.severity] || "#888" }} />
                  <span className="text-sm truncate" style={{ color: "var(--text)" }}>{alert.title}</span>
                </div>
              ))}
              {alertsData.alerts.length > 3 && (
                <div className="text-sm text-center" style={{ color: "var(--text-dim)" }}>+{alertsData.alerts.length - 3} more</div>
              )}
            </div>
          </>
        )}
      </div>
    </NodeShell>
  );
}
