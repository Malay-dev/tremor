import type { Node, Edge, MarkerType } from "@xyflow/react";

const marker = { type: "arrowclosed" as const, color: "#666", width: 14, height: 14 };
const edgeStyle = { stroke: "#444", strokeWidth: 3 };

export interface PipelineConfig {
  id: string;
  label: string;
  nodes: Node[];
  edges: Edge[];
  versions: Array<{ file: string; status: "old" | "previous" | "new" }>;
  analysisEvents: Array<{ shift: string; entity: string; severity: string; before: string; after: string }>;
  alerts: Array<{ title: string; severity: string; entity: string; summary: string; remediation: string; effort: string }>;
  toasts: Array<{ id: string; channel: string; target: string; message: string; iconType: "slack" | "telegram" | "webhook" | "sheets" | "jira" }>;
  sourceUrl: string;
  application: string;
}

export const PIPELINES: Record<string, PipelineConfig> = {
  iga: {
    id: "iga",
    label: "IGA — Salesforce",
    sourceUrl: "https://developer.salesforce.com/docs/marketing/pardot/guide/overview",
    application: "Salesforce Pardot",
    nodes: [
      { id: "sf", type: "salesforce", position: { x: -20, y: -40 }, data: {} },
      { id: "ver", type: "version", position: { x: 0, y: 260 }, data: {} },
      { id: "bd", type: "brightdata", position: { x: 380, y: 120 }, data: {} },
      { id: "eng", type: "tremor", position: { x: 760, y: 160 }, data: {} },
      { id: "alerts", type: "alerts", position: { x: 1280, y: 260 }, data: {} },
      { id: "slack", type: "slack", position: { x: 1140, y: -100 }, data: {} },
      { id: "tg", type: "telegram", position: { x: 1320, y: 0 }, data: {} },
      { id: "wh", type: "webhook", position: { x: 1400, y: 120 }, data: {} },
    ],
    edges: [
      { id: "sf-ver", source: "sf", target: "ver", sourceHandle: "bottom", targetHandle: "top-t", animated: true, style: edgeStyle, markerEnd: marker, type: "smoothstep" },
      { id: "ver-bd", source: "ver", target: "bd", sourceHandle: "right", targetHandle: "left-t", animated: true, style: edgeStyle, markerEnd: marker, type: "smoothstep" },
      { id: "bd-eng", source: "bd", target: "eng", sourceHandle: "right", targetHandle: "left-t", animated: true, style: edgeStyle, markerEnd: marker, type: "smoothstep" },
      { id: "eng-alerts", source: "eng", target: "alerts", sourceHandle: "right", targetHandle: "left-t", animated: true, style: edgeStyle, markerEnd: marker, type: "smoothstep" },
      { id: "alerts-slack", source: "alerts", target: "slack", sourceHandle: "top", targetHandle: "left-t", animated: true, style: edgeStyle, markerEnd: marker, type: "smoothstep" },
      { id: "alerts-tg", source: "alerts", target: "tg", sourceHandle: "top", targetHandle: "left-t", animated: true, style: edgeStyle, markerEnd: marker, type: "smoothstep" },
      { id: "alerts-wh", source: "alerts", target: "wh", sourceHandle: "top", targetHandle: "left-t", animated: true, style: edgeStyle, markerEnd: marker, type: "smoothstep" },
    ],
    versions: [
      { file: "accounts-v3.html", status: "old" },
      { file: "accounts-v4.html", status: "previous" },
      { file: "account-v5.html", status: "new" },
    ],
    analysisEvents: [
      { shift: "BREAKING_REMOVAL", entity: "auth_flows", severity: "CRITICAL", before: "API Key", after: "OAuth 2.0" },
      { shift: "STATE_SPACE_EXPANDED", entity: "User.status", severity: "HIGH", before: "BOOLEAN", after: "ENUM(ACTIVE,INACTIVE,SUSPENDED)" },
      { shift: "NULLABILITY_CHANGED", entity: "User.department", severity: "HIGH", before: "optional", after: "required" },
      { shift: "NULLABILITY_CHANGED", entity: "User.manager_id", severity: "HIGH", before: "optional", after: "required" },
      { shift: "DEPRECATION_ANNOUNCED", entity: "User.phone", severity: "MEDIUM", before: "active", after: "deprecated" },
      { shift: "SCOPE_WIDENED", entity: "POST /User/{id}/lifecycle", severity: "INFO", before: "absent", after: "added" },
    ],
    alerts: [
      { title: "Auth flow removed", severity: "CRITICAL", entity: "auth_flows", summary: "Connector authentication will fail immediately", remediation: "Update connector auth to OAuth 2.0", effort: "1 hour" },
      { title: "Status field expanded", severity: "HIGH", entity: "User.status", summary: "Provisioning rules won't handle SUSPENDED state", remediation: "Update attribute mapping for new states", effort: "2-4 hours" },
      { title: "Department now required", severity: "HIGH", entity: "User.department", summary: "Integrations not providing it will fail", remediation: "Review ABAC policies referencing this attribute", effort: "1 hour" },
      { title: "Phone field deprecated", severity: "MEDIUM", entity: "User.phone", summary: "Plan migration before removal", remediation: "Schedule connector update in next maintenance", effort: "1 sprint" },
    ],
    toasts: [
      { id: "slack", channel: "Slack", target: "#iam-alerts", message: "⚠️ CRITICAL: Auth flow removed — connector authentication will fail. Update to OAuth 2.0 immediately.", iconType: "slack" },
      { id: "telegram", channel: "Telegram", target: "IAM Engineering", message: "🔴 BREAKING_REMOVAL: auth_flows changed from API Key to OAuth 2.0. 5 systems affected. Risk: 0.85", iconType: "telegram" },
      { id: "webhook", channel: "Webhook", target: "ServiceNow", message: "IGA-2847 created: \"Update Salesforce connector auth\" — Priority: Critical, Effort: 1 hour", iconType: "webhook" },
    ],
  },

  rfp: {
    id: "rfp",
    label: "RFP — Government Portal",
    sourceUrl: "https://sam.gov/opp/abc123/view",
    application: "SAM.gov",
    nodes: [
      { id: "sf", type: "rfpSource", position: { x: -20, y: -40 }, data: {} },
      { id: "ver", type: "version", position: { x: 0, y: 260 }, data: {} },
      { id: "bd", type: "brightdata", position: { x: 380, y: 120 }, data: {} },
      { id: "eng", type: "tremor", position: { x: 760, y: 160 }, data: {} },
      { id: "alerts", type: "alerts", position: { x: 1280, y: 260 }, data: {} },
      { id: "sheets", type: "sheets", position: { x: 1200, y: -60 }, data: {} },
      { id: "wh", type: "webhook", position: { x: 1380, y: 80 }, data: {} },
    ],
    edges: [
      { id: "sf-ver", source: "sf", target: "ver", sourceHandle: "bottom", targetHandle: "top-t", animated: true, style: edgeStyle, markerEnd: marker, type: "smoothstep" },
      { id: "ver-bd", source: "ver", target: "bd", sourceHandle: "right", targetHandle: "left-t", animated: true, style: edgeStyle, markerEnd: marker, type: "smoothstep" },
      { id: "bd-eng", source: "bd", target: "eng", sourceHandle: "right", targetHandle: "left-t", animated: true, style: edgeStyle, markerEnd: marker, type: "smoothstep" },
      { id: "eng-alerts", source: "eng", target: "alerts", sourceHandle: "right", targetHandle: "left-t", animated: true, style: edgeStyle, markerEnd: marker, type: "smoothstep" },
      { id: "alerts-sheets", source: "alerts", target: "sheets", sourceHandle: "top", targetHandle: "left-t", animated: true, style: edgeStyle, markerEnd: marker, type: "smoothstep" },
      { id: "alerts-wh", source: "alerts", target: "wh", sourceHandle: "top", targetHandle: "left-t", animated: true, style: edgeStyle, markerEnd: marker, type: "smoothstep" },
    ],
    versions: [
      { file: "solicitation-v1.html", status: "old" },
      { file: "amendment-001.html", status: "previous" },
      { file: "amendment-002.html", status: "new" },
    ],
    analysisEvents: [
      { shift: "TEMPORAL_SHIFT", entity: "submission_deadline", severity: "CRITICAL", before: "2026-09-01", after: "2026-08-25" },
      { shift: "DEPENDENCY_ADDED", entity: "certification_required", severity: "HIGH", before: "none", after: "ISO 27001 required" },
      { shift: "SCOPE_NARROWED", entity: "eligible_vendors", severity: "HIGH", before: "all NAICS 541512", after: "small business only" },
      { shift: "CONSTRAINT_ADDED", entity: "budget_ceiling", severity: "MEDIUM", before: "$5M", after: "$3.5M (reduced)" },
    ],
    alerts: [
      { title: "Deadline moved up", severity: "CRITICAL", entity: "submission_deadline", summary: "Submission deadline shortened by 7 days", remediation: "Recalculate internal timeline immediately", effort: "1 hour" },
      { title: "New certification required", severity: "HIGH", entity: "certification_required", summary: "ISO 27001 now mandatory for eligibility", remediation: "Verify certification status, update compliance matrix", effort: "2 hours" },
      { title: "Eligibility narrowed", severity: "HIGH", entity: "eligible_vendors", summary: "Now restricted to small business set-aside", remediation: "Re-evaluate bid/no-bid decision", effort: "30 min" },
      { title: "Budget reduced", severity: "MEDIUM", entity: "budget_ceiling", summary: "Contract ceiling reduced from $5M to $3.5M", remediation: "Revise pricing strategy", effort: "4 hours" },
    ],
    toasts: [
      { id: "sheets", channel: "Google Sheets", target: "Tender Tracker", message: "📄 New row added: SAM.gov Amendment-002 — Deadline moved to Aug 25, ISO 27001 now required, small business set-aside", iconType: "sheets" },
      { id: "webhook", channel: "Webhook", target: "Procurement System", message: "RFP-ALERT: Eligibility changed on SAM.gov/abc123 — requires immediate bid/no-bid review", iconType: "webhook" },
    ],
  },

  api: {
    id: "api",
    label: "API — Stripe Docs",
    sourceUrl: "https://stripe.com/docs/api/charges",
    application: "Stripe",
    nodes: [
      { id: "sf", type: "stripeSource", position: { x: -20, y: -40 }, data: {} },
      { id: "ver", type: "version", position: { x: 0, y: 260 }, data: {} },
      { id: "bd", type: "brightdata", position: { x: 380, y: 120 }, data: {} },
      { id: "eng", type: "tremor", position: { x: 760, y: 160 }, data: {} },
      { id: "alerts", type: "alerts", position: { x: 1280, y: 260 }, data: {} },
      { id: "jira", type: "jira", position: { x: 1140, y: -80 }, data: {} },
      { id: "slack", type: "slack", position: { x: 1300, y: 20 }, data: {} },
      { id: "wh", type: "webhook", position: { x: 1400, y: 140 }, data: {} },
    ],
    edges: [
      { id: "sf-ver", source: "sf", target: "ver", sourceHandle: "bottom", targetHandle: "top-t", animated: true, style: edgeStyle, markerEnd: marker, type: "smoothstep" },
      { id: "ver-bd", source: "ver", target: "bd", sourceHandle: "right", targetHandle: "left-t", animated: true, style: edgeStyle, markerEnd: marker, type: "smoothstep" },
      { id: "bd-eng", source: "bd", target: "eng", sourceHandle: "right", targetHandle: "left-t", animated: true, style: edgeStyle, markerEnd: marker, type: "smoothstep" },
      { id: "eng-alerts", source: "eng", target: "alerts", sourceHandle: "right", targetHandle: "left-t", animated: true, style: edgeStyle, markerEnd: marker, type: "smoothstep" },
      { id: "alerts-jira", source: "alerts", target: "jira", sourceHandle: "top", targetHandle: "left-t", animated: true, style: edgeStyle, markerEnd: marker, type: "smoothstep" },
      { id: "alerts-slack", source: "alerts", target: "slack", sourceHandle: "top", targetHandle: "left-t", animated: true, style: edgeStyle, markerEnd: marker, type: "smoothstep" },
      { id: "alerts-wh", source: "alerts", target: "wh", sourceHandle: "top", targetHandle: "left-t", animated: true, style: edgeStyle, markerEnd: marker, type: "smoothstep" },
    ],
    versions: [
      { file: "charges-2024-12.html", status: "old" },
      { file: "charges-2025-06.html", status: "previous" },
      { file: "charges-2025-08.html", status: "new" },
    ],
    analysisEvents: [
      { shift: "DEPRECATION_ANNOUNCED", entity: "POST /v1/charges", severity: "HIGH", before: "active", after: "deprecated (use PaymentIntents)" },
      { shift: "BREAKING_REMOVAL", entity: "source_field", severity: "CRITICAL", before: "string", after: "removed" },
      { shift: "TYPE_CHANGED", entity: "amount", severity: "MEDIUM", before: "integer (cents)", after: "integer (minor units)" },
      { shift: "SCOPE_WIDENED", entity: "POST /v1/payment_intents/confirm", severity: "INFO", before: "existing", after: "new params added" },
    ],
    alerts: [
      { title: "Charges endpoint deprecated", severity: "HIGH", entity: "POST /v1/charges", summary: "Migrate to PaymentIntents before removal", remediation: "Update all charge creation flows to use PaymentIntents API", effort: "1-2 days" },
      { title: "Source field removed", severity: "CRITICAL", entity: "source_field", summary: "Breaking change — field no longer accepted", remediation: "Replace source with payment_method parameter", effort: "4 hours" },
      { title: "Amount unit clarification", severity: "MEDIUM", entity: "amount", summary: "Now documented as minor units (may affect non-USD)", remediation: "Verify currency handling in billing service", effort: "2 hours" },
    ],
    toasts: [
      { id: "jira", channel: "Jira", target: "ENG-4521", message: "🎫 Ticket created: \"Migrate Stripe Charges to PaymentIntents\" — Priority: High, Sprint: Current, Assignee: Payments Team", iconType: "jira" },
      { id: "slack", channel: "Slack", target: "#payments-eng", message: "🔴 CRITICAL: Stripe source_field removed in latest API version. Billing service will fail on next deploy.", iconType: "slack" },
      { id: "webhook", channel: "Webhook", target: "PagerDuty", message: "ALERT: Stripe API breaking change detected — source field removed. Immediate action required.", iconType: "webhook" },
    ],
  },
};
