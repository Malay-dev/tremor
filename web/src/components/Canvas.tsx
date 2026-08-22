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
  { id: "s1", type: "source", position: { x: 0, y: 20 }, data: { label: "Salesforce API", logo: "salesforce", status: "active", lastSync: "2m ago" } },
  { id: "s2", type: "source", position: { x: 0, y: 140 }, data: { label: "Workday Docs", logo: "workday", status: "active", lastSync: "1h ago" } },
  { id: "s3", type: "source", position: { x: 0, y: 260 }, data: { label: "Stripe Changelog", logo: "stripe", status: "idle", lastSync: "6h ago" } },
  { id: "c1", type: "collector", position: { x: 300, y: 110 }, data: { collectorId: "c_8f2a91b4", selfHealing: true } },
  { id: "e1", type: "engine", position: { x: 610, y: 80 }, data: {} },
  { id: "ev1", type: "event", position: { x: 950, y: 50 }, data: { events: [
    { label: "STATE_SPACE_EXPANDED", severity: "high" },
    { label: "BREAKING_REMOVAL", severity: "critical" },
    { label: "NULLABILITY_CHANGED", severity: "medium" },
    { label: "DEPRECATION_ANNOUNCED", severity: "low" },
  ] } },
  { id: "i1", type: "impact", position: { x: 1270, y: 50 }, data: { systems: [
    { name: "Provisioning Connector", risk: "high" },
    { name: "Lifecycle Workflows", risk: "high" },
    { name: "Identity Correlation", risk: "medium" },
    { name: "Employee Offboarding", risk: "high" },
  ] } },
  { id: "a1", type: "action", position: { x: 1570, y: 90 }, data: { actions: [
    { label: "Slack", type: "slack", sent: true },
    { label: "Telegram", type: "telegram", sent: true },
    { label: "Jira", type: "jira", sent: false },
  ] } },
];

const EDGES: Edge[] = [
  { id: "e-s1c1", source: "s1", target: "c1", animated: true, style: { stroke: "#FF2D7B", strokeWidth: 1.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#FF2D7B", width: 12, height: 12 } },
  { id: "e-s2c1", source: "s2", target: "c1", animated: true, style: { stroke: "#FF2D7B", strokeWidth: 1.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#FF2D7B", width: 12, height: 12 } },
  { id: "e-s3c1", source: "s3", target: "c1", style: { stroke: "#2A2A30", strokeWidth: 1, strokeDasharray: "3 3" } },
  { id: "e-c1e1", source: "c1", target: "e1", animated: true, style: { stroke: "#2DE2FF", strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#2DE2FF", width: 12, height: 12 } },
  { id: "e-e1ev", source: "e1", target: "ev1", animated: true, style: { stroke: "#B44DFF", strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#B44DFF", width: 12, height: 12 } },
  { id: "e-evim", source: "ev1", target: "i1", animated: true, style: { stroke: "#FF8A2D", strokeWidth: 1.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#FF8A2D", width: 12, height: 12 } },
  { id: "e-ima1", source: "i1", target: "a1", animated: true, style: { stroke: "#2DFF6D", strokeWidth: 1.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#2DFF6D", width: 12, height: 12 } },
];

export default function Canvas() {
  const [nodes, , onNodesChange] = useNodesState(NODES);
  const [edges, , onEdgesChange] = useEdgesState(EDGES);

  return (
    <section id="playground" className="w-full h-[72vh] relative glitch-line">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.4}
        maxZoom={2}
        defaultEdgeOptions={{ type: "smoothstep" }}
      >
        <Background gap={40} size={1} color="#1A1A1F" />
        <Controls showInteractive={false} position="bottom-right" />
      </ReactFlow>
    </section>
  );
}
