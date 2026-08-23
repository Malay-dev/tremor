"use client";
import NodeShell from "./NodeShell";

interface VersionInfo {
  file: string;
  status: "old" | "previous" | "new";
}

interface Props {
  data: { versions?: VersionInfo[]; discovering?: boolean };
}

export default function VersionNode({ data }: Props) {
  const versions = data.versions || [];
  const discovering = data.discovering || false;

  return (
    <NodeShell>
      <div className="w-[320px] rounded-xl border p-4 cursor-grab active:cursor-grabbing transition-all hover:border-[#555]" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="text-md font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-dim)" }}>
          Version Discovery
          {discovering && <span className="ml-2 text-sm normal-case tracking-normal" style={{ color: "#3D7FFC" }}>scanning...</span>}
        </div>

        {versions.length === 0 && !discovering && (
          <div className="text-base py-3 text-center" style={{ color: "var(--text-dim)" }}>
            Waiting for source...
          </div>
        )}

        {versions.length > 0 && (
          <div className="space-y-1.5">
            {versions.map((v) => (
              <div
                key={v.file}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded"
                style={{
                  background: v.status === "new" ? "rgba(16, 185, 129, 0.08)" : "var(--surface)",
                  border: v.status === "new" ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid transparent",
                }}
              >
                <span
                  className="w-[5px] h-[5px] rounded-full shrink-0"
                  style={{
                    background: v.status === "new" ? "#10B981" : v.status === "previous" ? "#3D7FFC" : "#666",
                  }}
                />
                <span className="text-md font-mono flex-1" style={{ color: v.status === "new" ? "#10B981" : "var(--text)" }}>
                  {v.file}
                </span>
                {v.status === "new" && (
                  <span className="text-[9px] font-semibold" style={{ color: "#10B981" }}>NEW</span>
                )}
              </div>
            ))}
          </div>
        )}

        {versions.some((v) => v.status === "new") && (
          <div className="mt-3 pt-3 border-t flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
            <span className="px-2 py-1 rounded text-md font-mono" style={{ background: "var(--surface)", color: "var(--text-dim)" }}>v4</span>
            <span className="text-md" style={{ color: "var(--text-dim)" }}>→</span>
            <span className="px-2 py-1 rounded text-md font-mono" style={{ background: "rgba(16,185,129,0.08)", color: "#10B981" }}>v5</span>
          </div>
        )}
      </div>
    </NodeShell>
  );
}
