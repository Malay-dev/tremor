"""Entity and contract models — what the Semantic Extractor produces from a document."""
  
from enum import StrEnum
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class AttributeType(StrEnum):
    """Data types the engine understands."""

    STRING = "STRING"
    INTEGER = "INTEGER"
    FLOAT = "FLOAT"
    BOOLEAN = "BOOLEAN"
    ENUM = "ENUM"
    ARRAY = "ARRAY"
    OBJECT = "OBJECT"
    DATE = "DATE"
    DATETIME = "DATETIME"
    URL = "URL"
    UNKNOWN = "UNKNOWN"


class Attribute(BaseModel):
    """A single property of an entity."""

    name: str  # e.g. "status"
    type: AttributeType
    required: bool = True
    description: str | None = None
    allowed_values: list[str] | None = None  # For enums
    constraints: list[str] = Field(default_factory=list)  # e.g. ["max_length:255", "non-nullable"]
    deprecated: bool = False


class Entity(BaseModel):
    """A thing described in a document — an API object, a form, a requirement."""

    entity_id: UUID = Field(default_factory=uuid4)
    name: str  # e.g. "User"
    kind: str  # e.g. "API_OBJECT", "ENDPOINT", "WORKFLOW"
    description: str | None = None
    attributes: list[Attribute] = Field(default_factory=list)
    relationships: list[str] = Field(default_factory=list)  # References to other entity names


class Endpoint(BaseModel):
    """An API endpoint extracted from documentation."""

    path: str  # e.g. "/v2/users/{id}"
    method: str  # GET, POST, PUT, DELETE, PATCH
    description: str | None = None
    parameters: list[Attribute] = Field(default_factory=list)
    response_fields: list[Attribute] = Field(default_factory=list)
    auth_required: bool = True
    deprecated: bool = False


class SemanticContract(BaseModel):
    """
    The full semantic model extracted from one version of a document.

    This is what gets compared between versions to detect changes.
    Two SemanticContracts go into the Change Engine → ChangeEvents come out.
    """

    contract_id: UUID = Field(default_factory=uuid4)
    source_url: str
    application: str
    version: str | None = None
    extracted_at: str  # ISO timestamp

    # What we found
    entities: list[Entity] = Field(default_factory=list)
    endpoints: list[Endpoint] = Field(default_factory=list)

    # Document-level metadata
    auth_flows: list[str] = Field(default_factory=list)  # e.g. ["OAuth2", "API Key"]
    rate_limits: list[str] = Field(default_factory=list)  # e.g. ["100 req/min"]
    deprecation_notices: list[str] = Field(default_factory=list)
