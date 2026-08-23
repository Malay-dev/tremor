"use client";

import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect } from "react";

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
  { id: "sf", type: "salesforce", position: { x: 80, y: 40 }, data: {} },
  { id: "ver", type: "version", position: { x: 20, y: 260 }, data: {} },
  { id: "bd", type: "brightdata", position: { x: 560, y: 200 }, data: {} },
  { id: "eng", type: "tremor", position: { x: 900, y: 180 }, data: {} },
  { id: "alerts", type: "alerts", position: { x: 1260, y: 200 }, data: {} },
  { id: "slack", type: "slack", position: { x: 1600, y: 100 }, data: {} },
  { id: "tg", type: "telegram", position: { x: 1600, y: 260 }, data: {} },
  { id: "wh", type: "webhook", position: { x: 1600, y: 420 }, data: {} },
];

const edgeDefaults = { type: "smoothstep" as const };
const initialEdges: Edge[] = [
  { id: "sf-ver", source: "sf", target: "ver", sourceHandle: "bottom", targetHandle: "top-t", animated: true, style: { stroke: "#444", strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#666", width: 14, height: 14 }, type: "smoothstep" },
  { id: "ver-bd", source: "ver", target: "bd", sourceHandle: "right", targetHandle: "left-t", animated: true, style: { stroke: "#444", strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#666", width: 14, height: 14 }, type: "smoothstep" },
  { id: "bd-eng", source: "bd", target: "eng", sourceHandle: "right", targetHandle: "left-t", animated: true, style: { stroke: "#444", strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#666", width: 14, height: 14 }, type: "smoothstep" },
  { id: "eng-alerts", source: "eng", target: "alerts", sourceHandle: "right", targetHandle: "left-t", animated: true, style: { stroke: "#444", strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#666", width: 14, height: 14 }, type: "smoothstep" },
];

export default function Canvas({ onNodeClick, versions, discovering, scrapingData, analysisData, alertsData }: { onNodeClick?: (id: string) => void; versions?: import("@/app/page").VersionInfo[]; discovering?: boolean; scrapingData?: import("@/app/page").ScrapingData; analysisData?: import("@/app/page").AnalysisData; alertsData?: import("@/app/page").AlertsData }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update node data when state changes
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === "ver") return { ...n, data: { versions: versions || [], discovering: discovering || false } };
        if (n.id === "bd") return { ...n, data: { scrapingData: scrapingData || { active: false, scraping: false } } };
        if (n.id === "eng") return { ...n, data: { analysisData: analysisData || { active: false, analyzing: false, events: [] } } };
        if (n.id === "alerts") return { ...n, data: { alertsData: alertsData || { active: false, generating: false, alerts: [] } } };
        return n;
      })
    );
  }, [versions, discovering, scrapingData, analysisData, alertsData, setNodes]);

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
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={(_event, node) => onNodeClick?.(node.id)}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.15 }}
      proOptions={{ hideAttribution: true }}
      zoomOnScroll={false}
      zoomOnPinch={false}
      zoomOnDoubleClick={false}
      panOnDrag={false}
      panOnScroll={false}
      preventScrolling={false}
      snapToGrid={true}
      snapGrid={[20, 20]}
      defaultEdgeOptions={edgeDefaults}
      style={{ background: "var(--bg)" }}
    >
      <Background variant={"dots" as any} gap={20} size={1.5} color="#444444" />
    </ReactFlow>
  );
}
