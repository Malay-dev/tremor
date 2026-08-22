"use client";

import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import SourceNode from "./nodes/SourceNode";
import CollectorNode from "./nodes/CollectorNode";
import EngineNode from "./nodes/EngineNode";
import EventNode from "./nodes/EventNode";
import ImpactNode from "./nodes/ImpactNode";
import ActionNode from "./nodes/ActionNode";

const nodeTypes = {
  source: SourceNode,
  collector: CollectorNode,
  engine: EngineNode,
  event: EventNode,
  impact: ImpactNode,
  action: ActionNode,
};

const NODES: Node[] = [
  // Sources
  { id: "s1", type: "source", position: { x: 0, y: 0 }, data: { label: "Salesforce API", logo: "salesforce", status: "active", lastSync: "2 min ago" } },
  { id: "s2", type: "source", position: { x: 0, y: 130 }, data: { label: "Workday Docs", logo: "workday", status: "active", lastSync: "1 hr ago" } },
  { id: "s3", type: "source", position: { x: 0, y: 260 }, data: { label: "Stripe Changelog", logo: "stripe", status: "idle", lastSync: "6 hr ago" } },
  // Collector
  { id: "c1", type: "collector", position: { x: 300, y: 100 }, data: { collectorId: "c_8f2a91b4", selfHealing: true } },
  // Engine
  { id: "e1", type: "engine", position: { x: 620, y: 80 }, data: {} },
  // Events
  { id: "ev1", type: "event", position: { x: 970, y: 40 }, data: { events: [
    { label: "STATE_SPACE_EXPANDED", severity: "high" },
    { label: "BREAKING_REMOVAL", severity: "critical" },
    { label: "NULLABILITY_CHANGED", severity: "medium" },
    { label: "DEPRECATION_ANNOUNCED", severity: "low" },
  ]} },
  // Impact
  { id: "i1", type: "impact", position: { x: 1290, y: 40 }, data: { systems: [
    { name: "Provisioning Connector", risk: "high" },
    { name: "Lifecycle Workflows", risk: "high" },
    { name: "Identity Correlation", risk: "medium" },
    { name: "Employee Offboarding", risk: "high" },
  ]} },
  // Actions
  { id: "a1", type: "action", position: { x: 1600, y: 80 }, data: { actions: [
    { label: "Slack", type: "slack", sent: true },
    { label: "Telegram", type: "telegram", sent: true },
    { label: "Jira", type: "jira", sent: false },
  ]} },
];

const edgeStyle = { strokeWidth: 1.5, stroke: "#2C2D33" };
const activeEdge = { strokeWidth: 1.5, stroke: "#7C5CFC" };
const marker = { type: MarkerType.ArrowClosed as const, color: "#7C5CFC", width: 14, height: 14 };

const EDGES: Edge[] = [
  { id: "s1-c1", source: "s1", target: "c1", animated: true, style: activeEdge, markerEnd: marker },
  { id: "s2-c1", source: "s2", target: "c1", animated: true, style: activeEdge, markerEnd: marker },
  { id: "s3-c1", source: "s3", target: "c1", style: edgeStyle },
  { id: "c1-e1", source: "c1", target: "e1", animated: true, style: activeEdge, markerEnd: marker },
  { id: "e1-ev1", source: "e1", target: "ev1", animated: true, style: activeEdge, markerEnd: marker },
  { id: "ev1-i1", source: "ev1", target: "i1", animated: true, style: activeEdge, markerEnd: marker },
  { id: "i1-a1", source: "i1", target: "a1", animated: true, style: activeEdge, markerEnd: marker },
];

export default function Canvas() {
  const [nodes, , onNodesChange] = useNodesState(NODES);
  const [edges, , onEdgesChange] = useEdgesState(EDGES);

  return (
    <section id="playground" className="w-full h-[75vh] border-t" style={{ borderColor: "var(--border-subtle)" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.4}
        maxZoom={2}
        defaultEdgeOptions={{ type: "smoothstep" }}
      >
        <Background gap={32} size={1} color="#1C1D22" />
        <Controls showInteractive={false} position="bottom-right" />
      </ReactFlow>
    </section>
  );
}
