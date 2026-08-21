"""Ingestion Gateway — receives data from Bright Data collectors."""

import hashlib
import logging
from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from tremor.models.event import ChangeEvent
from tremor.models.sources import DocumentType, Snapshot, SnapshotPair, Source

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ingest", tags=["ingestion"])


# --- Request schemas ---


class CollectorPayload(BaseModel):
    """What Bright Data sends us (or what we poll for)."""

    collector_id: str
    source_url: str
    application: str
    document_type: DocumentType
    content: str  # Raw HTML/text/markdown
    version_label: str | None = None
    metadata: dict = {}


# --- In-memory storage (replace with DB later) ---

sources: dict[str, Source] = {}  # keyed by URL
snapshots: dict[UUID, list[Snapshot]] = {}  # keyed by source_id
pending_pairs: list[SnapshotPair] = []  # ready for processing
processed_events: list[ChangeEvent] = []  # all detected changes


# --- Helpers ---


def compute_hash(content: str) -> str:
    return hashlib.sha256(content.encode()).hexdigest()


def get_or_create_source(payload: CollectorPayload) -> Source:
    if payload.source_url in sources:
        source = sources[payload.source_url]
        source.last_checked_at = datetime.now(UTC)
        return source

    source = Source(
        url=payload.source_url,
        application=payload.application,
        document_type=payload.document_type,
        collector_id=payload.collector_id,
    )
    sources[payload.source_url] = source
    snapshots[source.source_id] = []
    return source


# --- Endpoints ---


@router.post("/webhook")
async def receive_collector_data(payload: CollectorPayload):
    """
    Receive a new snapshot from Bright Data.

    Flow:
    1. Get or create the Source
    2. Hash the content
    3. If unchanged from last snapshot → skip
    4. If changed → store snapshot, create pair, queue for processing
    """
    source = get_or_create_source(payload)
    content_hash = compute_hash(payload.content)

    # Check if content actually changed
    source_snapshots = snapshots[source.source_id]
    if source_snapshots and source_snapshots[-1].content_hash == content_hash:
        return {
            "status": "unchanged",
            "source": source.application,
            "message": "Content hash matches previous snapshot. No processing needed.",
        }

    # New content — store snapshot
    new_snapshot = Snapshot(
        source_id=source.source_id,
        content_hash=content_hash,
        raw_content=payload.content,
        version_label=payload.version_label,
        metadata=payload.metadata,
    )
    source_snapshots.append(new_snapshot)
    source.last_changed_at = datetime.now(UTC)

    # If we have a previous snapshot, create a pair for comparison
    if len(source_snapshots) >= 2:
        pair = SnapshotPair(
            source_id=source.source_id,
            before=source_snapshots[-2],
            after=new_snapshot,
        )
        pending_pairs.append(pair)

        return {
            "status": "changed",
            "source": source.application,
            "snapshot_id": str(new_snapshot.snapshot_id),
            "message": "Change detected. Queued for semantic analysis.",
            "pair_queued": True,
        }

    return {
        "status": "first_snapshot",
        "source": source.application,
        "snapshot_id": str(new_snapshot.snapshot_id),
        "message": "First snapshot stored. Need one more to detect changes.",
    }


@router.get("/sources")
async def list_sources():
    """List all monitored sources."""
    return list(sources.values())


@router.get("/pending")
async def list_pending_pairs():
    """List snapshot pairs waiting for analysis."""
    return [
        {
            "source_id": str(p.source_id),
            "before_snapshot": str(p.before.snapshot_id),
            "after_snapshot": str(p.after.snapshot_id),
            "before_captured": p.before.captured_at.isoformat(),
            "after_captured": p.after.captured_at.isoformat(),
        }
        for p in pending_pairs
    ]


@router.post("/process")
async def process_pending_pairs():
    """
    Process all pending snapshot pairs through extraction + diffing.

    This triggers the full pipeline:
    1. LLM extraction on both snapshots → SemanticContracts
    2. Semantic diff → ChangeEvents
    3. Store events for retrieval
    """
    from tremor.engine.pipeline import Pipeline

    if not pending_pairs:
        return {"status": "idle", "message": "No pending pairs to process."}

    try:
        pipeline = Pipeline.create()
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    results = []
    pairs_to_process = list(pending_pairs)  # Copy since we'll clear
    pending_pairs.clear()

    for pair in pairs_to_process:
        # Look up source info
        source = next(
            (s for s in sources.values() if s.source_id == pair.source_id), None
        )
        if not source:
            logger.warning(f"Source not found for pair with source_id={pair.source_id}")
            continue

        result = await pipeline.process_pair(
            pair=pair,
            source_url=source.url,
            application=source.application,
        )

        if result.events:
            processed_events.extend(result.events)

        impact_summary = []
        for impact in result.impacts:
            impact_summary.append({
                "entity": impact.source_entity,
                "affected_systems": impact.affected_systems,
                "risk_score": impact.total_risk_score,
                "top_recommendation": impact.recommendations[0] if impact.recommendations else None,
            })

        results.append({
            "application": result.application,
            "source_url": result.source_url,
            "events_detected": len(result.events),
            "impacts": impact_summary,
            "error": result.error,
        })

    total_events = sum(r["events_detected"] for r in results)
    total_impacts = sum(len(r["impacts"]) for r in results)
    return {
        "status": "processed",
        "pairs_processed": len(results),
        "total_events": total_events,
        "total_impacts": total_impacts,
        "results": results,
    }


@router.get("/events")
async def list_events(severity: str | None = None, limit: int = 50):
    """List all detected change events, optionally filtered by severity."""
    events = processed_events

    if severity:
        events = [e for e in events if e.severity.value == severity.upper()]

    # Most recent first
    sorted_events = sorted(events, key=lambda e: e.timestamp, reverse=True)[:limit]

    return {
        "total": len(events),
        "returned": len(sorted_events),
        "events": [
            {
                "event_id": str(e.event_id),
                "timestamp": e.timestamp.isoformat(),
                "application": e.application,
                "shift": e.shift.value,
                "severity": e.severity.value,
                "entity": e.entity.path,
                "reasoning": e.reasoning,
                "before": e.before.value,
                "after": e.after.value,
            }
            for e in sorted_events
        ],
    }
