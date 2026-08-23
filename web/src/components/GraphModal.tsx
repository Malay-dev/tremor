"use client";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function GraphModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-[90%] max-w-[800px] rounded-2xl border overflow-hidden"
        style={{ background: "#FAFAFA", borderColor: "#E5E5E5", boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#E5E5E5" }}>
          <div>
            <h3 className="text-[15px] font-semibold" style={{ color: "#0F172A" }}>Impact Graph</h3>
            <p className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>Neo4j dependency traversal — downstream impact propagation</p>
          </div>
          <button onClick={onClose} className="text-[20px] leading-none px-2 py-1 rounded hover:bg-[#EBEBEB]" style={{ color: "#64748B" }}>×</button>
        </div>

        {/* Graph visualization */}
        <div className="px-6 py-8" style={{ background: "#0A0A0F" }}>
          <div className="space-y-3">
            {/* Level 1 */}
            <div className="flex items-center gap-3">
              <span className="w-[8px] h-[8px] rounded-full bg-[#EF4444]" />
              <span className="text-[13px] font-mono text-white">User.status</span>
              <span className="text-[11px] ml-auto" style={{ color: "#888" }}>API_FIELD</span>
            </div>
            <div className="pl-6 border-l-2 ml-1 space-y-3" style={{ borderColor: "#333" }}>
              {/* Level 2 */}
              <div className="flex items-center gap-3 pl-3">
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#1a1a2a", color: "#888" }}>MAPS_TO</span>
                <span className="text-[12px] font-mono text-white">status → accountEnabled</span>
              </div>
              <div className="pl-6 border-l-2 ml-4 space-y-3" style={{ borderColor: "#333" }}>
                {/* Level 3 */}
                <div className="flex items-center gap-3 pl-3">
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#1a1a2a", color: "#888" }}>TRANSFORMS</span>
                  <span className="text-[12px] font-mono text-white">Boolean → Enable/Disable</span>
                </div>
                <div className="pl-6 border-l-2 ml-4 space-y-3" style={{ borderColor: "#333" }}>
                  {/* Level 4 */}
                  <div className="flex items-center gap-3 pl-3">
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#1a1a2a", color: "#888" }}>DRIVES</span>
                    <span className="text-[12px] font-mono text-white">Disable Account on Inactive</span>
                  </div>
                  <div className="pl-6 border-l-2 ml-4 space-y-3" style={{ borderColor: "#333" }}>
                    {/* Level 5 */}
                    <div className="flex items-center gap-3 pl-3">
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#1a1a2a", color: "#888" }}>EVALUATES</span>
                      <span className="text-[12px] font-mono text-white">Account Lifecycle Decision</span>
                    </div>
                    <div className="pl-6 border-l-2 ml-4 space-y-3" style={{ borderColor: "#444" }}>
                      {/* Level 6 — affected */}
                      <div className="flex items-center gap-3 pl-3">
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#1a1a2a", color: "#888" }}>CONTROLS</span>
                        <span className="w-[6px] h-[6px] rounded-full bg-[#EF4444]" />
                        <span className="text-[12px] font-mono" style={{ color: "#EF4444" }}>AD Group: Salesforce Users</span>
                      </div>
                      <div className="flex items-center gap-3 pl-3">
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#1a1a2a", color: "#888" }}>AFFECTS</span>
                        <span className="w-[6px] h-[6px] rounded-full bg-[#EF4444]" />
                        <span className="text-[12px] font-mono" style={{ color: "#EF4444" }}>Employee Offboarding</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t" style={{ borderColor: "#E5E5E5" }}>
          <div className="text-[11px]" style={{ color: "#94A3B8" }}>
            6 hops • 5 systems affected • Risk: 0.85
          </div>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[12px] font-medium" style={{ background: "#0F172A", color: "white" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
