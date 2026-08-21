"""Graph models — node and relationship types for the impact graph."""

from enum import StrEnum

from pydantic import BaseModel, Field

# --- Node types ---


class NodeType(StrEnum):
    """Types of nodes in the impact graph."""

    # Source layer — external systems
    APPLICATION = "APPLICATION"  # e.g. Salesforce, Workday
    API_ENDPOINT = "API_ENDPOINT"  # e.g. /v2/users
    API_FIELD = "API_FIELD"  # e.g. User.status

    # Integration layer — connectors and mappings
    CONNECTOR = "CONNECTOR"  # e.g. Salesforce Provisioning Connector
    ATTRIBUTE_MAPPING = "ATTRIBUTE_MAPPING"  # e.g. User.status → accountEnabled
    TRANSFORMATION = "TRANSFORMATION"  # e.g. boolean → enable/disable

    # Logic layer — rules and workflows
    PROVISIONING_RULE = "PROVISIONING_RULE"  # e.g. "If status=false → disable"
    CORRELATION_RULE = "CORRELATION_RULE"  # e.g. "Match on email"
    WORKFLOW = "WORKFLOW"  # e.g. Joiner-Mover-Leaver

    # Decision layer — what actually happens
    ACCESS_DECISION = "ACCESS_DECISION"  # e.g. Grant/Revoke access
    ENTITLEMENT = "ENTITLEMENT"  # e.g. AD Group membership
    BUSINESS_PROCESS = "BUSINESS_PROCESS"  # e.g. Employee onboarding


# --- Relationship types ---


class RelationType(StrEnum):
    """Types of edges in the impact graph."""

    EXPOSES = "EXPOSES"  # Application → API_FIELD
    SERVES = "SERVES"  # Application → API_ENDPOINT
    CONTAINS = "CONTAINS"  # API_ENDPOINT → API_FIELD
    MAPS_TO = "MAPS_TO"  # API_FIELD → ATTRIBUTE_MAPPING
    READS_FROM = "READS_FROM"  # CONNECTOR → API_ENDPOINT
    TRANSFORMS = "TRANSFORMS"  # ATTRIBUTE_MAPPING → TRANSFORMATION
    DRIVES = "DRIVES"  # TRANSFORMATION → PROVISIONING_RULE
    EVALUATES = "EVALUATES"  # PROVISIONING_RULE → ACCESS_DECISION
    CONTROLS = "CONTROLS"  # ACCESS_DECISION → ENTITLEMENT
    AFFECTS = "AFFECTS"  # ENTITLEMENT → BUSINESS_PROCESS
    TRIGGERS = "TRIGGERS"  # WORKFLOW → PROVISIONING_RULE
    DEPENDS_ON = "DEPENDS_ON"  # Generic dependency


# --- Graph data models ---


class GraphNode(BaseModel):
    """A node in the impact graph."""

    node_id: str  # Unique identifier (e.g. "salesforce:User.status")
    node_type: NodeType
    name: str  # Human-readable name
    application: str | None = None  # Which app this belongs to
    properties: dict = Field(default_factory=dict)  # Extra metadata


class GraphEdge(BaseModel):
    """An edge (relationship) in the impact graph."""

    source_id: str  # From node
    target_id: str  # To node
    relation_type: RelationType
    properties: dict = Field(default_factory=dict)


class ImpactPath(BaseModel):
    """A single path from a changed entity to an affected downstream system."""

    nodes: list[GraphNode]
    edges: list[GraphEdge]
    depth: int  # How many hops from the source change
    risk_contribution: float = 0.0  # How much risk this path adds


class ImpactAnalysis(BaseModel):
    """Full impact analysis for a change event."""

    event_id: str
    source_entity: str  # e.g. "User.status"
    application: str
    paths: list[ImpactPath] = Field(default_factory=list)
    affected_systems: list[str] = Field(default_factory=list)
    total_risk_score: float = 0.0  # Aggregated from paths
    recommendations: list[str] = Field(default_factory=list)
