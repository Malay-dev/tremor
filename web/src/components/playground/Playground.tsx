"use client";

import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  MarkerType,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import SourceNode from "../nodes/SourceNode";
import CollectorNode from "../nodes/CollectorNode";
import EngineNode from "../nodes/EngineNode";
import EventNode from "../nodes/EventNode";
import ImpactNode from "../nodes/ImpactNode";
import ActionNode from "../nodes/ActionNode";
import EventTicker from "./EventTicker";

const nodeTypes = {
  source: SourceNode,
  collector: CollectorNode,
  engine: EngineNode,
  event: EventNode,
  impact: ImpactNode,
  action: ActionNode,
};

const defaultNodes: Node[] = [
  {
    id: "src-1",
    type: "source",
    position: { x: 60, y: 60 },
    data: { label: "Salesforce API", status: "active", lastSync: "2m ago", icon: "🔵" },
  },
  {
    id: "src-2",
    type: "source",
    position: { x: 60, y: 210 },
    data: { label: "Workday Docs", status: "active", lastSync: "1h ago", icon: "🟢" },
  },
  {
    id: "src-3",
    type: "source",
    position: { x: 60, y: 360 },
    data: { label: "Stripe Changelog", status: "stale", lastSync: "6h ago", icon: "🟣" },
  },
  {
    id: "collector",
    type: "collector",
    position: { x: 370, y: 160 },
    data: {
      collectorId: "c_8f2a91b4",
      healthy: true,
      selfHealing: true,
      lastRun: "2m ago",
    },
  },
  {
    id: "engine",
    type: "engine",
    position: { x: 680, y: 120 },
    data: {},
  },
  {
    id: "events",
    type: "event",
    position: { x: 1020, y: 70 },
    data: {
      events: [
        { label: "STATE_SPACE_EXPANDED", severity: "high", entity: "User.status" },
        { label: "BREAKING_REMOVAL", severity: "critical", entity: "auth_flows" },
        { label: "NULLABILITY_CHANGED", severity: "medium", entity: "User.email" },
        { label: "DEPRECATION_ANNOUNCED", severity: "low", entity: "User.phone" },
      ],
    },
  },
  {
    id: "impact",
    type: "impact",
    position: { x: 1340, y: 60 },
    data: {
      paths: [
        { system: "Provisioning Connector", risk: "high" },
        { system: "Lifecycle Workflows", risk: "high" },
        { system: "Identity Correlation", risk: "medium" },
        { system: "Access Reviews", risk: "medium" },
        { system: "Employee Offboarding", risk: "high" },
      ],
    },
  },
  {
    id: "actions",
    type: "action",
    position: { x: 1640, y: 100 },
    data: {
      actions: [
        { label: "Slack Alert", type: "slack", status: "sent" },
        { label: "Telegram", type: "telegram", status: "sent" },
        { label: "Jira Ticket", type: "webhook", status: "pending" },
      ],
    },
  },
];

const defaultEdges: Edge[] = [
  { id: "e1", source: "src-1", target: "collector", animated: true, style: { stroke: "#6366F1", strokeWidth: 1.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#6366F1", width: 16, height: 16 } },
  { id: "e2", source: "src-2", target: "collector", animated: true, style: { stroke: "#6366F1", strokeWidth: 1.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#6366F1", width: 16, height: 16 } },
  { id: "e3", source: "src-3", target: "collector", style: { stroke: "#374151", strokeWidth: 1, strokeDasharray: "4 4" } },
  { id: "e4", source: "collector", target: "engine", animated: true, style: { stroke: "#06B6D4", strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#06B6D4", width: 16, height: 16 } },
  { id: "e5", source: "engine", target: "events", animated: true, style: { stroke: "#8B5CF6", strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#8B5CF6", width: 16, height: 16 } },
  { id: "e6", source: "events", target: "impact", animated: true, style: { stroke: "#F59E0B", strokeWidth: 1.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#F59E0B", width: 16, height: 16 } },
  { id: "e7", source: "impact", target: "actions", animated: true, style: { stroke: "#10B981", strokeWidth: 1.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#10B981", width: 16, height: 16 } },
];

export default function Playground() {
  const [nodes, , onNodesChange] = useNodesState(defaultNodes);
  const [edges, , onEdgesChange] = useEdgesState(defaultEdges);

  return (
    <section
      id="playground"
      className="relative w-full"
      style={{ background: "var(--canvas-bg)" }}
    >
      {/* Section header */}
      <div className="px-8 pt-8 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--canvas-text)" }}>
            Workflow Playground
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--canvas-muted)" }}>
            Drag nodes, explore the pipeline, click to inspect.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg" style={{ color: "var(--emerald)", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--emerald)] animate-pulse" />
            Pipeline Active
          </span>
        </div>
      </div>

      {/* Canvas */}
      <div className="w-full h-[70vh]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          minZoom={0.3}
          maxZoom={2}
          defaultEdgeOptions={{ type: "smoothstep" }}
        >
          <Background gap={24} size={1} color="#1E2740" />
          <Controls showInteractive={false} position="bottom-right" />
        </ReactFlow>
      </div>

      {/* Bottom event ticker */}
      <EventTicker />
    </section>
  );
}
