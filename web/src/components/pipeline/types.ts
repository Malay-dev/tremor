export interface PipelineStep {
  id: string;
  label: string;
  type: "source" | "version" | "collector" | "engine" | "alerts" | "notify";
  status: "idle" | "running" | "complete" | "error";
  editable: boolean;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
}

export const DEFAULT_PIPELINE: PipelineStep[] = [
  {
    id: "source",
    label: "Source",
    type: "source",
    status: "complete",
    editable: true,
    input: {
      url: "https://developer.salesforce.com/docs/api/v61",
      application: "Salesforce",
      document_type: "API_DOC",
    },
    output: {
      content_preview: "# User Object\\n\\n| Field | Type | Required |\\n| id | string | yes |\\n| status | boolean | yes |\\n| email | string | yes |",
      content_length: 847,
      fetched_at: "2025-08-20T09:22:01Z",
    },
  },
  {
    id: "version",
    label: "Version Discovery",
    type: "version",
    status: "complete",
    editable: false,
    input: {
      source_url: "https://developer.salesforce.com/docs/api/v61",
      previous_hash: "a3f8c1...e7d2",
      current_hash: "b9e4f2...1a8c",
    },
    output: {
      version_before: "v61.0",
      version_after: "v62.0",
      content_changed: true,
      change_detected_at: "2025-08-20T09:22:03Z",
      pair_queued: true,
    },
  },
  {
    id: "collector",
    label: "Bright Data",
    type: "collector",
    status: "complete",
    editable: false,
    input: {
      collector_id: "c_8f2a91b4",
      target_url: "https://developer.salesforce.com/docs/api/v62",
      mode: "real-time",
    },
    output: {
      status: "success",
      self_healed: false,
      extraction_time_ms: 1847,
      rows_collected: 1,
      collector_healthy: true,
    },
  },
  {
    id: "engine",
    label: "Tremor Engine",
    type: "engine",
    status: "complete",
    editable: false,
    input: {
      before_contract: { entities: 1, endpoints: 2, auth_flows: ["API Key"] },
      after_contract: { entities: 1, endpoints: 3, auth_flows: ["OAuth 2.0"] },
    },
    output: {
      events_detected: 6,
      events: [
        { shift: "STATE_SPACE_EXPANDED", entity: "User.status", severity: "HIGH", before: "BOOLEAN", after: "ENUM(ACTIVE,INACTIVE,SUSPENDED)" },
        { shift: "BREAKING_REMOVAL", entity: "auth_flows", severity: "CRITICAL", before: "API Key", after: "OAuth 2.0" },
        { shift: "NULLABILITY_CHANGED", entity: "User.email", severity: "LOW", before: "required", after: "optional" },
        { shift: "NULLABILITY_CHANGED", entity: "User.department", severity: "HIGH", before: "optional", after: "required" },
        { shift: "DEPRECATION_ANNOUNCED", entity: "User.phone", severity: "MEDIUM", before: "active", after: "deprecated" },
        { shift: "SCOPE_WIDENED", entity: "POST /User/{id}/lifecycle", severity: "INFO", before: "absent", after: "added" },
      ],
      processing_time_ms: 3241,
    },
  },
  {
    id: "alerts",
    label: "Alerts",
    type: "alerts",
    status: "complete",
    editable: false,
    input: {
      events_count: 6,
      adapters: ["IGA", "RFP"],
    },
    output: {
      iga: {
        critical: 1,
        high: 3,
        summary: "Auth flow removed — connector will fail. Status field expanded — provisioning rules need update.",
        top_remediation: "Update connector auth to OAuth 2.0 immediately",
      },
      rfp: {
        critical: 0,
        high: 0,
        summary: "No procurement-relevant changes detected.",
      },
    },
  },
  {
    id: "notify",
    label: "Notify",
    type: "notify",
    status: "complete",
    editable: true,
    input: {
      channels: { slack: true, telegram: true, webhook: false, email: false },
      severity_threshold: "HIGH",
    },
    output: {
      slack: { sent: true, channel: "#iam-alerts", timestamp: "2025-08-20T09:22:09Z" },
      telegram: { sent: true, chat: "IAM Engineering", timestamp: "2025-08-20T09:22:09Z" },
    },
  },
];
