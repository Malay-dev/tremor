"""Demo API — endpoints for the frontend playground. Returns mock or real data based on DEMO_MODE."""

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from tremor.demo import is_demo_mode
from tremor.demo.mock_data import (
    MOCK_ALERTS,
    MOCK_ANALYSIS,
    MOCK_SCRAPING,
    MOCK_VERSIONS,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/demo", tags=["demo"])


class DiscoverRequest(BaseModel):
    url: str
    application: str


class ScrapeRequest(BaseModel):
    url: str
    application: str


class AnalyzeRequest(BaseModel):
    application: str


class AlertsRequest(BaseModel):
    application: str
    domain: str = "IGA"


class NotifyRequest(BaseModel):
    application: str
    channels: list[str] = ["slack", "telegram", "webhook"]


# ─── Endpoints ───────────────────────────────────────────────────────────────


@router.post("/discover")
async def discover_versions(request: DiscoverRequest):
    """Discover versions for a source URL."""
    if is_demo_mode():
        app_key = _resolve_app_key(request.application)
        versions = MOCK_VERSIONS.get(app_key, MOCK_VERSIONS["salesforce"])
        return {"status": "discovered", "application": request.application, "versions": versions}

    # Real mode — would call Bright Data or scrape logic
    raise HTTPException(status_code=501, detail="Real discovery not implemented in this endpoint. Use /collect/trigger.")


@router.post("/scrape")
async def scrape_versions(request: ScrapeRequest):
    """Scrape the discovered versions via Bright Data."""
    if is_demo_mode():
        return {"status": "scraped", "application": request.application, **MOCK_SCRAPING}

    raise HTTPException(status_code=501, detail="Real scraping not implemented in this endpoint. Use /collect/trigger.")


@router.post("/analyze")
async def analyze_changes(request: AnalyzeRequest):
    """Run semantic analysis on scraped content."""
    if is_demo_mode():
        app_key = _resolve_app_key(request.application)
        analysis = MOCK_ANALYSIS.get(app_key, MOCK_ANALYSIS["salesforce"])
        return {"status": "analyzed", "application": request.application, **analysis}

    raise HTTPException(status_code=501, detail="Real analysis not implemented in this endpoint. Use /ingest/process.")


@router.post("/alerts")
async def generate_alerts(request: AlertsRequest):
    """Generate domain-specific alerts."""
    if is_demo_mode():
        app_key = _resolve_app_key(request.application)
        alerts = MOCK_ALERTS.get(app_key, MOCK_ALERTS["salesforce"])
        return {"status": "generated", "application": request.application, **alerts}

    raise HTTPException(status_code=501, detail="Real alerts not implemented in this endpoint. Use /adapters/analyze.")


@router.post("/notify")
async def send_notifications(request: NotifyRequest):
    """Send notifications to configured channels."""
    if is_demo_mode():
        results = {ch: {"sent": True, "timestamp": "2026-08-23T09:22:09Z"} for ch in request.channels}
        return {"status": "notified", "application": request.application, "channels": results}

    raise HTTPException(status_code=501, detail="Real notifications not implemented in this endpoint. Use pipeline.")


@router.get("/status")
async def demo_status():
    """Check if demo mode is enabled."""
    return {"demo_mode": is_demo_mode()}


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _resolve_app_key(application: str) -> str:
    """Resolve application name to a mock data key."""
    app_lower = application.lower()
    if "salesforce" in app_lower or "pardot" in app_lower:
        return "salesforce"
    if "sam" in app_lower or "gov" in app_lower or "rfp" in app_lower:
        return "sam.gov"
    if "stripe" in app_lower:
        return "stripe"
    return "salesforce"
