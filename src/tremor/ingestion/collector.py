"""Collector Router — endpoints for managing Bright Data scraper lifecycle."""

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from tremor.ingestion.brightdata import BrightDataClient
from tremor.ingestion.gateway import (
    CollectorPayload,
    compute_hash,
    get_or_create_source,
    pending_pairs,
    snapshots,
)
from tremor.models.sources import DocumentType, Snapshot, SnapshotPair

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/collect", tags=["collector"])


# ─── Request schemas ─────────────────────────────────────────────────────────


class CreateScraperRequest(BaseModel):
    """Request to create a new Bright Data scraper."""

    url: str
    description: str  # Plain-language description of what to extract


class HealScraperRequest(BaseModel):
    """Request to heal a broken scraper."""

    collector_id: str
    description: str  # What broke or what to fix


class TriggerCollectionRequest(BaseModel):
    """Request to trigger a collection and feed results into Tremor."""

    collector_id: str
    url: str
    application: str  # e.g. "Salesforce"
    document_type: DocumentType = DocumentType.API_DOC


class BatchCollectionRequest(BaseModel):
    """Request to trigger batch collection on multiple URLs."""

    collector_id: str
    urls: list[str]
    application: str
    document_type: DocumentType = DocumentType.API_DOC


# ─── Endpoints ───────────────────────────────────────────────────────────────


@router.post("/create")
async def create_scraper(request: CreateScraperRequest):
    """
    Create a new Bright Data scraper for a target URL.

    Uses bdata CLI. Takes 5-15 minutes for typical sites.
    Returns the Collector ID (c_xxxxx) to use in subsequent calls.
    """
    try:
        client = BrightDataClient()
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    try:
        collector_id = client.create_scraper(request.url, request.description)
        return {
            "status": "created",
            "collector_id": collector_id,
            "url": request.url,
            "message": "Scraper created. Use this collector_id to trigger collections.",
        }
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Failed to create scraper: {e}")


@router.post("/heal")
async def heal_scraper(request: HealScraperRequest):
    """
    Heal a broken scraper when the target site changes.

    The self-healing capability: same Collector ID, nothing downstream breaks.
    """
    try:
        client = BrightDataClient()
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    try:
        output = client.heal_scraper(request.collector_id, request.description)
        return {
            "status": "healed",
            "collector_id": request.collector_id,
            "output": output,
            "message": "Scraper healed. Same Collector ID, nothing downstream changed.",
        }
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Failed to heal scraper: {e}")


@router.post("/trigger")
async def trigger_collection(request: TriggerCollectionRequest):
    """
    Trigger a real-time scrape and feed results directly into Tremor's pipeline.

    This is the main integration point:
    1. Triggers Bright Data scraper on the URL
    2. Waits for structured results
    3. Feeds content into the ingestion pipeline (same as /ingest/webhook)
    4. Creates snapshot pair if content changed

    Use this for the demo flow: trigger → process → see events.
    """
    try:
        client = BrightDataClient()
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    try:
        # Collect via Bright Data
        logger.info(f"Triggering collection: {request.collector_id} → {request.url}")
        content = await client.collect_page(request.collector_id, request.url)

        # Feed into ingestion pipeline (reuse existing logic)
        payload = CollectorPayload(
            collector_id=request.collector_id,
            source_url=request.url,
            application=request.application,
            document_type=request.document_type,
            content=content,
        )

        source = get_or_create_source(payload)
        content_hash = compute_hash(content)

        source_snapshots = snapshots[source.source_id]
        if source_snapshots and source_snapshots[-1].content_hash == content_hash:
            return {
                "status": "unchanged",
                "collector_id": request.collector_id,
                "source": request.application,
                "message": "Bright Data returned same content. No change detected.",
            }

        new_snapshot = Snapshot(
            source_id=source.source_id,
            content_hash=content_hash,
            raw_content=content,
        )
        source_snapshots.append(new_snapshot)

        pair_queued = False
        if len(source_snapshots) >= 2:
            pair = SnapshotPair(
                source_id=source.source_id,
                before=source_snapshots[-2],
                after=new_snapshot,
            )
            pending_pairs.append(pair)
            pair_queued = True

        return {
            "status": "collected",
            "collector_id": request.collector_id,
            "source": request.application,
            "snapshot_id": str(new_snapshot.snapshot_id),
            "pair_queued": pair_queued,
            "message": (
                "Content collected and queued for analysis."
                if pair_queued
                else "First snapshot stored. Trigger again to detect changes."
            ),
        }

    except TimeoutError:
        raise HTTPException(
            status_code=504, detail="Bright Data scrape timed out. Try again."
        )
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Collection failed: {e}")


@router.post("/batch")
async def batch_collection(request: BatchCollectionRequest):
    """
    Trigger batch collection on multiple URLs.

    Useful for monitoring several pages at once (e.g., multiple API doc pages).
    """
    try:
        client = BrightDataClient()
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    try:
        collection_id = await client.trigger_collection(request.collector_id, request.urls)
        results = await client.get_results(collection_id)

        collected = 0
        for i, result in enumerate(results):
            url = request.urls[i] if i < len(request.urls) else request.urls[0]
            content = str(result) if isinstance(result, dict) else result

            payload = CollectorPayload(
                collector_id=request.collector_id,
                source_url=url,
                application=request.application,
                document_type=request.document_type,
                content=content,
            )

            source = get_or_create_source(payload)
            content_hash = compute_hash(content)
            source_snapshots = snapshots[source.source_id]

            if source_snapshots and source_snapshots[-1].content_hash == content_hash:
                continue

            new_snapshot = Snapshot(
                source_id=source.source_id,
                content_hash=content_hash,
                raw_content=content,
            )
            source_snapshots.append(new_snapshot)
            collected += 1

            if len(source_snapshots) >= 2:
                pair = SnapshotPair(
                    source_id=source.source_id,
                    before=source_snapshots[-2],
                    after=new_snapshot,
                )
                pending_pairs.append(pair)

        return {
            "status": "batch_collected",
            "collector_id": request.collector_id,
            "collection_id": collection_id,
            "urls_processed": len(results),
            "new_snapshots": collected,
            "message": f"Batch complete. {collected} new snapshots. Run /ingest/process to analyze.",
        }

    except TimeoutError:
        raise HTTPException(status_code=504, detail="Batch collection timed out.")
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Batch collection failed: {e}")
