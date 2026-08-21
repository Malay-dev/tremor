#!/usr/bin/env python3
"""
Tremor End-to-End Demo
======================

Runs the full Tremor pipeline without a running server:
  1. Ingest two document versions
  2. Extract semantic contracts (Gemini Flash)
  3. Diff contracts → ChangeEvents
  4. Traverse impact graph (Neo4j)
  5. Run domain adapters (IGA + RFP)
  6. Print full structured output

Usage:
    # With Gemini + Neo4j (full demo)
    uv run python demo/run_demo.py

    # Without Gemini (uses pre-built contracts, skip extraction)
    uv run python demo/run_demo.py --skip-extraction

    # Without Neo4j (skip graph traversal)
    uv run python demo/run_demo.py --skip-graph
"""

import argparse
import asyncio
import json
import os
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from dotenv import load_dotenv

load_dotenv()

from tremor.adapters.base import analyze_with_all
from tremor.engine.differ import SemanticDiffer
from tremor.extraction.extractor import SemanticExtractor
from tremor.graph.connection import Neo4jConnection
from tremor.graph.seeder import GraphSeeder
from tremor.graph.traversal import ImpactTraverser
from tremor.models.entities import (
    Attribute,
    AttributeType,
    Endpoint,
    Entity,
    SemanticContract,
)

# Ensure adapters are registered
import tremor.adapters  # noqa: F401

# ─── Demo Data ───────────────────────────────────────────────────────────────

SALESFORCE_V61 = """# Salesforce User API — v61.0

## Base URL
`https://api.salesforce.com/services/data/v61.0/sobjects/User`

## Authentication
API Key authentication via `Authorization: Bearer <api_key>` header.

## Endpoints

### GET /User/{id}
Returns a single user record.

### GET /User
Query users with SOQL.

## Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | yes | Unique Salesforce record ID (18 chars) |
| email | string | yes | User's primary email address |
| status | boolean | yes | Whether the user account is active (true = active) |
| username | string | yes | Unique login identifier |
| department | string | no | Organizational department |
| title | string | no | Job title |
| manager_id | string | no | ID of the user's manager |
| phone | string | no | Business phone number |
| last_login | datetime | no | Timestamp of most recent login |

## Rate Limits
- 15,000 API calls per 24-hour period
- 100 concurrent requests per user
"""

SALESFORCE_V62 = """# Salesforce User API — v62.0

## Base URL
`https://api.salesforce.com/services/data/v62.0/sobjects/User`

## Authentication
OAuth 2.0 Bearer Token via `Authorization: Bearer <access_token>` header.
API Key authentication is no longer supported as of v62.0.

## Endpoints

### GET /User/{id}
Returns a single user record.

### GET /User
Query users with SOQL.

### POST /User/{id}/lifecycle (NEW)
Trigger lifecycle state transitions.

## Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | yes | Unique Salesforce record ID (18 chars) |
| email | string | no | User's primary email address (optional since v62) |
| status | enum(ACTIVE,INACTIVE,SUSPENDED,PENDING_REVIEW) | yes | User lifecycle state |
| username | string | yes | Unique login identifier |
| department | string | yes | Organizational department (now required) |
| title | string | no | Job title |
| manager_id | string | yes | ID of the user's manager (now required for provisioning) |
| phone | string | no | Business phone number (deprecated — use contact_methods) |
| last_login | datetime | no | Timestamp of most recent login |
| contact_methods | array | no | List of contact methods (replaces phone) |
| risk_score | float | no | AI-calculated account risk score (0.0-1.0) |

## Rate Limits
- 25,000 API calls per 24-hour period
- 200 concurrent requests per user

## Deprecation Notices
- phone field: Deprecated. Use contact_methods array instead. Removal in v64.
- API Key authentication: Removed. Use OAuth 2.0.
"""

# ─── Helpers ─────────────────────────────────────────────────────────────────


def print_header(text: str) -> None:
    print(f"\n{'═' * 70}")
    print(f"  {text}")
    print(f"{'═' * 70}\n")


def print_section(text: str) -> None:
    print(f"\n  ── {text} {'─' * (60 - len(text))}\n")


def print_event(event, index: int) -> None:
    severity_icons = {
        "CRITICAL": "🔴",
        "HIGH": "🟠",
        "MEDIUM": "🟡",
        "LOW": "🟢",
        "INFO": "⚪",
    }
    icon = severity_icons.get(event.severity.value, "⚪")
    print(f"  {icon} #{index + 1} [{event.severity.value}] {event.shift.value}")
    print(f"     Entity: {event.entity.path}")
    print(f"     Before: {event.before.value}")
    print(f"     After:  {event.after.value}")
    print(f"     Reason: {event.reasoning}")
    print()


# ─── Main Demo ───────────────────────────────────────────────────────────────


async def run_demo(skip_extraction: bool = False, skip_graph: bool = False) -> dict:
    """Run the full Tremor demo pipeline."""
    output = {}

    print_header("TREMOR — Change Intelligence Demo")
    print("  Salesforce User API: v61.0 → v62.0")
    print("  Detecting semantic changes and predicting integration impact.\n")

    # ─── Step 1: Extraction ──────────────────────────────────────────────────

    if skip_extraction:
        print_section("Step 1: Semantic Extraction (SKIPPED — using pre-built contracts)")
        before_contract = _build_mock_v61_contract()
        after_contract = _build_mock_v62_contract()
    else:
        print_section("Step 1: Semantic Extraction (Gemini 2.5 Flash)")
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            print("  ⚠️  GEMINI_API_KEY not set. Using pre-built contracts.")
            before_contract = _build_mock_v61_contract()
            after_contract = _build_mock_v62_contract()
        else:
            extractor = SemanticExtractor(api_key=api_key)
            print("  Extracting v61.0...")
            before_contract = await extractor.extract(
                SALESFORCE_V61,
                "https://developer.salesforce.com/docs/api/v61",
                "Salesforce",
            )
            print(f"    ✓ {len(before_contract.entities)} entities, {len(before_contract.endpoints)} endpoints")

            print("  Extracting v62.0...")
            after_contract = await extractor.extract(
                SALESFORCE_V62,
                "https://developer.salesforce.com/docs/api/v62",
                "Salesforce",
            )
            print(f"    ✓ {len(after_contract.entities)} entities, {len(after_contract.endpoints)} endpoints")

    output["extraction"] = {
        "before": {
            "entities": len(before_contract.entities),
            "endpoints": len(before_contract.endpoints),
            "auth_flows": before_contract.auth_flows,
        },
        "after": {
            "entities": len(after_contract.entities),
            "endpoints": len(after_contract.endpoints),
            "auth_flows": after_contract.auth_flows,
        },
    }

    # ─── Step 2: Change Detection ────────────────────────────────────────────

    print_section("Step 2: Semantic Change Detection")
    differ = SemanticDiffer()
    events = differ.diff(before_contract, after_contract)
    print(f"  Detected {len(events)} semantic changes:\n")

    for i, event in enumerate(events):
        print_event(event, i)

    output["change_events"] = [
        {
            "event_id": str(e.event_id),
            "shift": e.shift.value,
            "severity": e.severity.value,
            "entity": e.entity.path,
            "before": e.before.value,
            "after": e.after.value,
            "reasoning": e.reasoning,
            "confidence": e.confidence,
        }
        for e in events
    ]

    # ─── Step 3: Impact Graph ────────────────────────────────────────────────

    if skip_graph:
        print_section("Step 3: Impact Graph Traversal (SKIPPED — Neo4j not available)")
        output["impact_graph"] = {"skipped": True}
    else:
        print_section("Step 3: Impact Graph Traversal (Neo4j)")
        if await Neo4jConnection.verify_connectivity():
            driver = Neo4jConnection.get_driver()

            # Seed graph
            seeder = GraphSeeder(driver)
            await seeder.seed_salesforce_topology()
            print("  ✓ Graph seeded with Salesforce IGA topology (20 nodes, 18 edges)")

            # Traverse for each event
            traverser = ImpactTraverser(driver)
            impact_results = []

            for event in events:
                analysis = await traverser.analyze_impact(event)
                if analysis.affected_systems:
                    impact_results.append(analysis)
                    print(f"\n  🌐 {event.entity.path} ({event.shift.value})")
                    print(f"     Affected: {', '.join(analysis.affected_systems)}")
                    print(f"     Risk: {analysis.total_risk_score:.2f}")
                    if analysis.paths:
                        longest = max(analysis.paths, key=lambda p: p.depth)
                        path_str = " → ".join(n.name for n in longest.nodes)
                        print(f"     Path: {path_str}")

            output["impact_graph"] = {
                "events_with_impact": len(impact_results),
                "results": [
                    {
                        "entity": a.source_entity,
                        "affected_systems": a.affected_systems,
                        "risk_score": a.total_risk_score,
                        "recommendations": a.recommendations,
                    }
                    for a in impact_results
                ],
            }

            await Neo4jConnection.close()
        else:
            print("  ⚠️  Neo4j not reachable. Skipping graph traversal.")
            output["impact_graph"] = {"skipped": True, "reason": "Neo4j not reachable"}

    # ─── Step 4: Domain Adapter Analysis ─────────────────────────────────────

    print_section("Step 4: Domain Adapter Analysis")
    analyses = analyze_with_all(events)

    for analysis in analyses:
        print(f"\n  📋 {analysis.domain.value} Domain")
        print(f"     {analysis.executive_summary}")
        print(f"     Critical: {analysis.critical_count} | High: {analysis.high_count}")

        for alert in analysis.alerts[:3]:
            print(f"\n     [{alert.severity}] {alert.title}")
            print(f"       {alert.summary[:120]}...")
            if alert.remediation:
                print(f"       → Step 1: {alert.remediation[0].action}")
                print(f"         System: {alert.remediation[0].system}")
                print(f"         Effort: {alert.remediation[0].effort}")

    output["domain_analysis"] = [
        {
            "domain": a.domain.value,
            "executive_summary": a.executive_summary,
            "critical_count": a.critical_count,
            "high_count": a.high_count,
            "alerts": [
                {
                    "title": alert.title,
                    "severity": alert.severity,
                    "entity": alert.entity,
                    "shift": alert.shift,
                    "summary": alert.summary,
                    "affected_systems": alert.affected_systems,
                    "risk_score": alert.risk_score,
                    "tags": alert.tags,
                    "remediation": [
                        {
                            "priority": r.priority,
                            "action": r.action,
                            "system": r.system,
                            "assignee": r.assignee_hint,
                            "effort": r.effort,
                        }
                        for r in alert.remediation
                    ],
                }
                for alert in a.alerts
            ],
        }
        for a in analyses
    ]

    # ─── Summary ─────────────────────────────────────────────────────────────

    print_header("DEMO COMPLETE")
    print(f"  Changes detected:     {len(events)}")
    print(f"  Domains analyzed:     {len(analyses)}")
    total_critical = sum(a.critical_count for a in analyses)
    total_high = sum(a.high_count for a in analyses)
    print(f"  Critical alerts:      {total_critical}")
    print(f"  High priority alerts: {total_high}")
    print(f"\n  Structured output saved to demo/output/demo_result.json")
    print()

    return output


# ─── Mock contracts (for --skip-extraction) ──────────────────────────────────


def _build_mock_v61_contract() -> SemanticContract:
    return SemanticContract(
        source_url="https://developer.salesforce.com/docs/api/v61",
        application="Salesforce",
        version="v61.0",
        extracted_at="2025-01-15T10:00:00Z",
        entities=[
            Entity(
                name="User",
                kind="API_OBJECT",
                description="Salesforce User record",
                attributes=[
                    Attribute(name="id", type=AttributeType.STRING, required=True),
                    Attribute(name="email", type=AttributeType.STRING, required=True),
                    Attribute(name="status", type=AttributeType.BOOLEAN, required=True,
                              description="Whether the user account is active"),
                    Attribute(name="username", type=AttributeType.STRING, required=True),
                    Attribute(name="department", type=AttributeType.STRING, required=False),
                    Attribute(name="title", type=AttributeType.STRING, required=False),
                    Attribute(name="manager_id", type=AttributeType.STRING, required=False),
                    Attribute(name="phone", type=AttributeType.STRING, required=False),
                    Attribute(name="last_login", type=AttributeType.DATETIME, required=False),
                ],
            ),
        ],
        endpoints=[
            Endpoint(path="/User/{id}", method="GET", description="Get single user"),
            Endpoint(path="/User", method="GET", description="Query users"),
        ],
        auth_flows=["API Key"],
        rate_limits=["15,000 calls per 24h"],
    )


def _build_mock_v62_contract() -> SemanticContract:
    return SemanticContract(
        source_url="https://developer.salesforce.com/docs/api/v62",
        application="Salesforce",
        version="v62.0",
        extracted_at="2025-06-15T10:00:00Z",
        entities=[
            Entity(
                name="User",
                kind="API_OBJECT",
                description="Salesforce User record",
                attributes=[
                    Attribute(name="id", type=AttributeType.STRING, required=True),
                    Attribute(name="email", type=AttributeType.STRING, required=False),
                    Attribute(name="status", type=AttributeType.ENUM, required=True,
                              allowed_values=["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING_REVIEW"],
                              description="User lifecycle state"),
                    Attribute(name="username", type=AttributeType.STRING, required=True),
                    Attribute(name="department", type=AttributeType.STRING, required=True),
                    Attribute(name="title", type=AttributeType.STRING, required=False),
                    Attribute(name="manager_id", type=AttributeType.STRING, required=True),
                    Attribute(name="phone", type=AttributeType.STRING, required=False, deprecated=True),
                    Attribute(name="last_login", type=AttributeType.DATETIME, required=False),
                    Attribute(name="contact_methods", type=AttributeType.ARRAY, required=False),
                    Attribute(name="risk_score", type=AttributeType.FLOAT, required=False),
                ],
            ),
        ],
        endpoints=[
            Endpoint(path="/User/{id}", method="GET", description="Get single user"),
            Endpoint(path="/User", method="GET", description="Query users"),
            Endpoint(path="/User/{id}/lifecycle", method="POST", description="Trigger lifecycle state transitions"),
        ],
        auth_flows=["OAuth 2.0"],
        rate_limits=["25,000 calls per 24h"],
        deprecation_notices=["phone field: Use contact_methods", "API Key auth: Removed in v62"],
    )


# ─── Entry point ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Tremor end-to-end demo")
    parser.add_argument("--skip-extraction", action="store_true", help="Use pre-built contracts")
    parser.add_argument("--skip-graph", action="store_true", help="Skip Neo4j graph traversal")
    args = parser.parse_args()

    output = asyncio.run(run_demo(
        skip_extraction=args.skip_extraction,
        skip_graph=args.skip_graph,
    ))

    # Save structured output
    output_dir = Path(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)
    with open(output_dir / "demo_result.json", "w") as f:
        json.dump(output, f, indent=2, default=str)
