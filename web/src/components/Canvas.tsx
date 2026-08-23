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

const nodeTypes = {
  salesforce: SalesforceNode,
  version: VersionNode,
  brightdata: BrightDataNode,
  tremor: TremorNode,
  alerts: AlertsNode,
  slack: SlackNode,
  telegram: TelegramNode,
  webhook: WebhookNode,
};

const initialNodes: Node[] = [
  { id: "sf", type: "salesforce", position: { x: -20, y: -40 }, data: {} },
  { id: "ver", type: "version", position: { x: 0, y: 260 }, data: {} },
  { id: "bd", type: "brightdata", position: { x: 380, y: 120 }, data: {} },
  { id: "eng", type: "tremor", position: { x: 760, y: 160 }, data: {} },
  { id: "alerts", type: "alerts", position: { x: 1280, y: 260 }, data: {} },
  { id: "slack", type: "slack", position: { x: 1140, y: -100 }, data: {} },
  { id: "tg", type: "telegram", position: { x: 1320, y: 0 }, data: {} },
  { id: "wh", type: "webhook", position: { x: 1400, y: 120 }, data: {} },
];

const edgeDefaults = { type: "smoothstep" as const };
const initialEdges: Edge[] = [
  { id: "sf-ver", source: "sf", target: "ver", sourceHandle: "bottom", targetHandle: "top-t", animated: true, style: { stroke: "#444", strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#666", width: 14, height: 14 }, type: "smoothstep" },
  { id: "ver-bd", source: "ver", target: "bd", sourceHandle: "right", targetHandle: "left-t", animated: true, style: { stroke: "#444", strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#666", width: 14, height: 14 }, type: "smoothstep" },
  { id: "bd-eng", source: "bd", target: "eng", sourceHandle: "right", targetHandle: "left-t", animated: true, style: { stroke: "#444", strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#666", width: 14, height: 14 }, type: "smoothstep" },
  { id: "eng-alerts", source: "eng", target: "alerts", sourceHandle: "right", targetHandle: "left-t", animated: true, style: { stroke: "#444", strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#666", width: 14, height: 14 }, type: "smoothstep" },
  { id: "alerts-slack", source: "alerts", target: "slack", sourceHandle: "top", targetHandle: "left-t", animated: true, style: { stroke: "#444", strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#666", width: 14, height: 14 }, type: "smoothstep" },
  { id: "alerts-tg", source: "alerts", target: "tg", sourceHandle: "top", targetHandle: "left-t", animated: true, style: { stroke: "#444", strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#666", width: 14, height: 14 }, type: "smoothstep" },
  { id: "alerts-wh", source: "alerts", target: "wh", sourceHandle: "top", targetHandle: "left-t", animated: true, style: { stroke: "#444", strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#666", width: 14, height: 14 }, type: "smoothstep" },
];

export interface CanvasRef {
  exportPng: () => void;
  exportJson: () => void;
}

interface CanvasProps {
  onNodeClick?: (id: string) => void;
  versions?: import("@/app/page").VersionInfo[];
  discovering?: boolean;
  scrapingData?: import("@/app/page").ScrapingData;
  analysisData?: import("@/app/page").AnalysisData;
  alertsData?: import("@/app/page").AlertsData;
  notificationsSent?: boolean;
  locked?: boolean;
}

function CanvasInner({ onNodeClick, versions, discovering, scrapingData, analysisData, alertsData, notificationsSent, locked, canvasRef }: CanvasProps & { canvasRef: React.Ref<CanvasRef> }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const flowRef = useRef<HTMLDivElement>(null);

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
      <Controls showInteractive={true} position="bottom-right" />
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
