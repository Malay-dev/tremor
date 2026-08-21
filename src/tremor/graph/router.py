"""Graph API — endpoints for seeding, querying topology, and impact analysis."""

import logging

from fastapi import APIRouter, HTTPException

from tremor.graph.connection import Neo4jConnection
from tremor.graph.seeder import GraphSeeder
from tremor.graph.traversal import ImpactTraverser
from tremor.ingestion.gateway import processed_events

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/graph", tags=["graph"])


@router.post("/seed")
async def seed_graph():
    """
    Seed the impact graph with sample IGA topology.

    Creates nodes and relationships representing:
    - Salesforce API fields
    - Connectors and attribute mappings
    - Provisioning rules and access decisions
    - Entitlements and business processes
    """
    if not await Neo4jConnection.verify_connectivity():
        raise HTTPException(
            status_code=503,
            detail="Neo4j is not reachable. Ensure it's running and NEO4J_URI is configured.",
        )

    driver = Neo4jConnection.get_driver()
    seeder = GraphSeeder(driver)
    result = await seeder.seed_salesforce_topology()
    return {"status": "seeded", **result}


@router.get("/topology")
async def get_topology():
    """Get a summary of the current graph topology."""
    if not await Neo4jConnection.verify_connectivity():
        raise HTTPException(status_code=503, detail="Neo4j is not reachable.")

    driver = Neo4jConnection.get_driver()
    seeder = GraphSeeder(driver)
    return await seeder.get_topology_summary()


@router.get("/impact/{event_id}")
async def get_impact(event_id: str):
    """
    Analyze the downstream impact of a specific change event.

    Traverses the graph from the changed entity to find all affected systems,
    calculate risk scores, and generate recommendations.
    """
    # Find the event
    event = next((e for e in processed_events if str(e.event_id) == event_id), None)
    if not event:
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found.")

    if not await Neo4jConnection.verify_connectivity():
        raise HTTPException(status_code=503, detail="Neo4j is not reachable.")

    driver = Neo4jConnection.get_driver()
    traverser = ImpactTraverser(driver)
    analysis = await traverser.analyze_impact(event)

    return {
        "event_id": analysis.event_id,
        "source_entity": analysis.source_entity,
        "application": analysis.application,
        "affected_systems": analysis.affected_systems,
        "total_risk_score": analysis.total_risk_score,
        "recommendations": analysis.recommendations,
        "propagation_paths": [
            {
                "depth": p.depth,
                "risk_contribution": round(p.risk_contribution, 3),
                "nodes": [{"name": n.name, "type": n.node_type.value} for n in p.nodes],
                "edges": [e.relation_type.value for e in p.edges],
            }
            for p in analysis.paths
        ],
    }


@router.post("/impact/all")
async def analyze_all_events():
    """Run impact analysis on all processed events that have graph matches."""
    if not processed_events:
        return {"status": "no_events", "message": "No change events to analyze."}

    if not await Neo4jConnection.verify_connectivity():
        raise HTTPException(status_code=503, detail="Neo4j is not reachable.")

    driver = Neo4jConnection.get_driver()
    traverser = ImpactTraverser(driver)

    results = []
    for event in processed_events:
        analysis = await traverser.analyze_impact(event)
        results.append({
            "event_id": str(event.event_id),
            "entity": event.entity.path,
            "shift": event.shift.value,
            "severity": event.severity.value,
            "affected_systems": analysis.affected_systems,
            "risk_score": analysis.total_risk_score,
            "recommendations": analysis.recommendations[:2],  # Top 2
        })

    impacted = [r for r in results if r["affected_systems"]]
    return {
        "total_events": len(results),
        "events_with_impact": len(impacted),
        "results": results,
    }
