"""Source and snapshot models — what we monitor and what we've collected."""

from datetime import datetime
from enum import StrEnum
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class DocumentType(StrEnum):
    """What kind of document this is."""

    API_DOC = "API_DOC"
    RELEASE_NOTE = "RELEASE_NOTE"
    CHANGELOG = "CHANGELOG"
    SCHEMA = "SCHEMA"
    RFP = "RFP"
    PRODUCT_DOC = "PRODUCT_DOC"
    SECURITY_ADVISORY = "SECURITY_ADVISORY"


class SourceStatus(StrEnum):
    """Health of a monitored source."""

    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    ERROR = "ERROR"
    STALE = "STALE"  # No changes detected in a long time


class Source(BaseModel):
    """A monitored web artifact — one URL we track continuously."""

    source_id: UUID = Field(default_factory=uuid4)
    url: str
    application: str  # e.g. "Salesforce", "Workday"
    document_type: DocumentType
    collector_id: str | None = None  # Bright Data collector reference
    schedule: str | None = None  # e.g. "every 6h", "daily"
    status: SourceStatus = SourceStatus.ACTIVE
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_checked_at: datetime | None = None
    last_changed_at: datetime | None = None


class Snapshot(BaseModel):
    """One point-in-time capture of a source. Immutable once stored."""

    snapshot_id: UUID = Field(default_factory=uuid4)
    source_id: UUID
    captured_at: datetime = Field(default_factory=datetime.utcnow)
    content_hash: str  # SHA-256 of raw content — quick equality check
    raw_content: str | None = None  # HTML/markdown/text (or reference to S3)
    storage_path: str | None = None  # S3/local path if content is large
    version_label: str | None = None  # e.g. "v62.0", "Amendment 3"
    metadata: dict = Field(default_factory=dict)  # Anything extra from the collector


class SnapshotPair(BaseModel):
    """Two consecutive snapshots ready for comparison."""

    source_id: UUID
    before: Snapshot
    after: Snapshot