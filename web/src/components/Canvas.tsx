"use client";

import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { toPng } from "html-to-image";

import SalesforceNode from "./nodes/SalesforceNode";
import VersionNode from "./nodes/VersionNode";
import BrightDataNode from "./nodes/BrightDataNode";
import TremorNode from "./nodes/TremorNode";
import AlertsNode from "./nodes/AlertsNode";
import SlackNode from "./nodes/SlackNode";
import TelegramNode from "./nodes/TelegramNode";
import WebhookNode from "./nodes/WebhookNode";
import RfpSourceNode from "./nodes/RfpSourceNode";
import StripeSourceNode from "./nodes/StripeSourceNode";
import SheetsNode from "./nodes/SheetsNode";
import JiraNode from "./nodes/JiraNode";

const nodeTypes = {
  salesforce: SalesforceNode,
  version: VersionNode,
  brightdata: BrightDataNode,
  tremor: TremorNode,
  alerts: AlertsNode,
  slack: SlackNode,
  telegram: TelegramNode,
  webhook: WebhookNode,
  rfpSource: RfpSourceNode,
  stripeSource: StripeSourceNode,
  sheets: SheetsNode,
  jira: JiraNode,
};

const edgeDefaults = { type: "smoothstep" as const };

export interface CanvasRef {
  exportPng: () => void;
  exportJson: () => void;
}

import { PIPELINES } from "./pipelines";

interface CanvasProps {
  onNodeClick?: (id: string) => void;
  versions?: import("@/app/page").VersionInfo[];
  discovering?: boolean;
  scrapingData?: import("@/app/page").ScrapingData;
  analysisData?: import("@/app/page").AnalysisData;
  alertsData?: import("@/app/page").AlertsData;
  notificationsSent?: boolean;
  locked?: boolean;
  onLockChange?: (interactive: boolean) => void;
  pipelineId?: string;
}

function CanvasInner({ onNodeClick, versions, discovering, scrapingData, analysisData, alertsData, notificationsSent, locked, onLockChange, pipelineId, canvasRef }: CanvasProps & { canvasRef: React.Ref<CanvasRef> }) {
  const pipeline = PIPELINES[pipelineId || "iga"];
  const [nodes, setNodes, onNodesChange] = useNodesState(pipeline.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(pipeline.edges);
  const flowRef = useRef<HTMLDivElement>(null);

  // Reset nodes/edges when pipeline changes
  useEffect(() => {
    const p = PIPELINES[pipelineId || "iga"];
    setNodes(p.nodes);
    setEdges(p.edges);
  }, [pipelineId, setNodes, setEdges]);

  // Update node data when state changes
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === "ver") return { ...n, data: { versions: versions || [], discovering: discovering || false } };
        if (n.id === "bd") return { ...n, data: { scrapingData: scrapingData || { active: false, scraping: false } } };
        if (n.id === "eng") return { ...n, data: { analysisData: analysisData || { active: false, analyzing: false, events: [] } } };
        if (n.id === "alerts") return { ...n, data: { alertsData: alertsData || { active: false, generating: false, alerts: [] } } };
        if (n.id === "slack" || n.id === "tg" || n.id === "wh") return { ...n, data: { sent: notificationsSent || false } };
        return n;
      })
    );
  }, [versions, discovering, scrapingData, analysisData, alertsData, notificationsSent, setNodes]);

  useImperativeHandle(canvasRef, () => ({
    exportPng: () => {
      if (flowRef.current) {
        toPng(flowRef.current, {
          backgroundColor: "#0A0A0F",
          skipFonts: true,
          fetchRequestInit: { mode: "no-cors" as RequestMode },
          filter: (node) => {
            if (node instanceof HTMLLinkElement) return false;
            return true;
          },
          includeQueryParams: true,
        }).then((dataUrl) => {
          const link = document.createElement("a");
          link.download = "tremor-pipeline.png";
          link.href = dataUrl;
          link.click();
        }).catch(() => {
          // Fallback: use canvas API directly
          alert("PNG export requires allowing cross-origin access. Use browser screenshot (Cmd+Shift+4) as fallback.");
        });
      }
    },
    exportJson: () => {
      const data = { nodes, edges, exportedAt: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const link = document.createElement("a");
      link.download = "tremor-pipeline.json";
      link.href = URL.createObjectURL(blob);
      link.click();
    },
  }));

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          { ...params, animated: true, style: { stroke: "#444", strokeWidth: 1.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#666", width: 12, height: 12 } },
          eds
        )
      );
    },
    [setEdges]
  );

  return (
    <div ref={flowRef} className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_event, node) => onNodeClick?.(node.id)}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.1, minZoom: 0.6 }}
        proOptions={{ hideAttribution: true }}
        zoomOnScroll={!locked}
        zoomOnPinch={!locked}
        zoomOnDoubleClick={!locked}
        panOnDrag={!locked}
        panOnScroll={!locked}
        preventScrolling={!locked}
        nodesDraggable={!locked}
        snapToGrid={true}
        snapGrid={[20, 20]}
        defaultEdgeOptions={edgeDefaults}
        style={{ background: "var(--bg)" }}
      >
        <Background variant={"dots" as any} gap={20} size={1.5} color="#444444" />
      <Controls showInteractive={true} position="bottom-right" onInteractiveChange={(interactive) => onLockChange?.(interactive)} />
      </ReactFlow>
    </div>
  );
}

const Canvas = forwardRef<CanvasRef, CanvasProps>(function Canvas(props, ref) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} canvasRef={ref} />
    </ReactFlowProvider>
  );
});

export default Canvas;
