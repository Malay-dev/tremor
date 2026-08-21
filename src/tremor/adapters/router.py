"""Adapter API — endpoints for domain-specific analysis."""

import logging

from fastapi import APIRouter, HTTPException

from tremor.adapters.base import (
    AdapterDomain,
    analyze_with_all,
    get_adapter,
    get_all_adapters,
)
from tremor.ingestion.gateway import processed_events

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/adapters", tags=["adapters"])


@router.get("/")
async def list_adapters():
    """List all registered domain adapters."""
    adapters = get_all_adapters()
    return {
        "adapters": [
            {"domain": domain.value, "type": adapter.__class__.__name__}
            for domain, adapter in adapters.items()
        ]
    }


@router.post("/analyze/{domain}")
async def analyze_domain(domain: str):
    """
    Run a specific domain adapter on all processed events.

    Returns domain-specific alerts with remediation steps.
    """
    try:
        adapter_domain = AdapterDomain(domain.upper())
    except ValueError:
        available = [d.value for d in AdapterDomain]
        raise HTTPException(
            status_code=400,
            detail=f"Unknown domain '{domain}'. Available: {available}",
        )

    adapter = get_adapter(adapter_domain)
    if not adapter:
        raise HTTPException(status_code=404, detail=f"Adapter '{domain}' not registered.")

    if not processed_events:
        return {
            "domain": domain.upper(),
            "status": "no_events",
            "message": "No change events to analyze. Run /ingest/process first.",
        }

    relevant = [e for e in processed_events if adapter.is_relevant(e)]
    if not relevant:
        return {
            "domain": domain.upper(),
            "status": "no_relevant_events",
            "total_events": len(processed_events),
            "relevant_events": 0,
            "message": f"No events relevant to the {domain.upper()} domain.",
        }

    analysis = adapter.analyze(relevant)

    return {
        "domain": analysis.domain.value,
        "executive_summary": analysis.executive_summary,
        "total_events": analysis.total_events,
        "critical_count": analysis.critical_count,
        "high_count": analysis.high_count,
        "alerts": [
            {
                "title": a.title,
                "severity": a.severity,
                "entity": a.entity,
                "shift": a.shift,
                "summary": a.summary,
                "affected_systems": a.affected_systems,
                "risk_score": a.risk_score,
                "tags": a.tags,
                "remediation": [
                    {
                        "priority": r.priority,
                        "action": r.action,
                        "system": r.system,
                        "assignee": r.assignee_hint,
                        "effort": r.effort,
                    }
                    for r in a.remediation
                ],
            }
            for a in analysis.alerts
        ],
    }


@router.post("/analyze")
async def analyze_all_domains():
    """
    Run all registered adapters on processed events.

    Returns a combined analysis across all domains.
    """
    if not processed_events:
        return {
            "status": "no_events",
            "message": "No change events to analyze. Run /ingest/process first.",
        }

    analyses = analyze_with_all(processed_events)

    return {
        "total_events": len(processed_events),
        "domains_analyzed": len(analyses),
        "results": [
            {
                "domain": a.domain.value,
                "executive_summary": a.executive_summary,
                "total_events": a.total_events,
                "critical_count": a.critical_count,
                "high_count": a.high_count,
                "alert_count": len(a.alerts),
            }
            for a in analyses
        ],
    }
