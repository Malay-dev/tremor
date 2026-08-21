
"""Data Contracts: Core semantic event models — Tremor's primary output contract."""

from datetime import datetime
from enum import StrEnum
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class SemanticShift(StrEnum):
    """Classification of how meaning changed - not just that it changed"""
    STATE_SPACE_EXPANDED = "STATE_SPACE_EXPANDED"
    STATE_SPACE_CONTRACTED = "STATE_SPACE_CONTRACTED"
    TYPE_CHANGED = "TYPE_CHANGED"
    NULLABILITY_CHANGED = "NULLABILITY_CHANGED"
    CARDINALITY_CHANGED = "CARDINALITY_CHANGED"
    CONSTRAINT_ADDED = "CONSTRAINT_ADDED"
    CONSTRAINT_REMOVED = "CONSTRAINT_REMOVED"
    DEPRECATION_ANNOUNCED = "DEPRECATION_ANNOUNCED"
    BREAKING_REMOVAL = "BREAKING_REMOVAL"
    BEHAVIOR_INVERSION = "BEHAVIOR_INVERSION"
    SCOPE_NARROWED = "SCOPE_NARROWED"
    SCOPE_WIDENED = "SCOPE_WIDENED"
    TEMPORAL_SHIFT = "TEMPORAL_SHIFT"
    AUTHORITY_CHANGED = "AUTHORITY_CHANGED"
    DEPENDENCY_ADDED = "DEPENDENCY_ADDED"
    DEPENDENCY_REMOVED = "DEPENDENCY_REMOVED"
    SEMANTIC_RENAME = "SEMANTIC_RENAME"


class Severity(StrEnum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"

class EntityKind(StrEnum):
    FIELD = "FIELD"
    ENDPOINT = "ENDPOINT"
    FLOW = "FLOW"
    REQUIREMENT = "REQUIREMENT"
    DEADLINE = "DEADLINE"
    PERMISSION = "PERMISSION"
    OBJECT = "OBJECT"

class ChangeCategory(StrEnum):
    SCHEMA = "SCHEMA"
    BEHAVIOR = "BEHAVIOR"
    SECURITY = "SECURITY"
    POLICY = "POLICY"
    REQUIREMENT = "REQUIREMENT"
    LIFECYCLE = "LIFECYCLE"


class EntityRef(BaseModel):
    """Reference to the entity that changed."""

    kind: EntityKind
    path: str  # e.g. "User.status"
    parent: str | None = None  # e.g. "User"
  
  
class ValueSnapshot(BaseModel):
    """What a value looked like before or after."""

    value: str
    semantic_type: str | None = None  # e.g. "BINARY_STATE", "MULTI_STATE"
    constraints: list[str] = Field(default_factory=list)


class Evidence(BaseModel):
    """Proof of the change — for audit and explainability."""

    before_snippet: str
    after_snippet: str
    location: str | None = None  # section/page/URL anchor
  

class ChangeEvent(BaseModel):
    """The core Tremor output. One detected semantic change."""

    event_id: UUID = Field(default_factory=uuid4)
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    # Source
    source_url: str
    application: str  # e.g. "Salesforce", "Workday"
    document_type: str  # e.g. "API_DOC", "RELEASE_NOTE"
    version_before: str | None = None
    version_after: str | None = None

    # The change
    shift: SemanticShift
    category: ChangeCategory
    entity: EntityRef
    before: ValueSnapshot
    after: ValueSnapshot

    # Assessment
    severity: Severity
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning: str  # Why this severity

    # Evidence
    evidence: Evidence
  
  
class ImpactResult(BaseModel):
    """What downstream systems are affected by a ChangeEvent."""
  
    event_id: UUID
    affected_systems: list[str]  # e.g. ["Salesforce Connector", "Provisioning Workflow"]
    propagation_path: list[str]  # e.g. ["User.status", "Connector", "Workflow"]
    risk_score: float = Field(ge=0.0, le=1.0)
    recommendation: str