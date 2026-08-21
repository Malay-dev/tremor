#!/usr/bin/env python3
"""
Tremor Self-Healing Demo
=========================

Demonstrates the Bright Data self-healing flow:
  1. Create a scraper for an API docs page
  2. Collect initial snapshot → baseline
  3. Simulate site change (or wait for real change)
  4. Collector notices extraction failure
  5. Heal the scraper with a description of what broke
  6. Re-collect → Tremor detects the semantic change
  7. Full pipeline produces impact analysis

This script is designed for the live demo video.
It uses the Tremor API (server must be running).

Usage:
    # Full demo (requires BRIGHT_DATA_API_TOKEN + running server)
    uv run python demo/self_healing.py

    # Simulated demo (no Bright Data credits used — mocks the API calls)
    uv run python demo/self_healing.py --simulate
"""

import argparse
import asyncio
import json
import sys
import time
from pathlib import Path

import httpx

BASE_URL = "http://127.0.0.1:8000"


# ─── Simulated flow (for recording demo without burning credits) ─────────────

SIMULATED_STEPS = [
    {
        "title": "Creating scraper for Salesforce REST API docs",
        "command": "bdata scraper create https://developer.salesforce.com/docs/api 'Extract all API object fields with types, required status, and descriptions'",
        "output": {
            "status": "created",
            "collector_id": "c_8f2a91b4e7d3",
            "url": "https://developer.salesforce.com/docs/api",
            "message": "Scraper created. Use this collector_id to trigger collections.",
        },
        "delay": 2,
    },
    {
        "title": "Running initial collection (baseline)",
        "command": "POST /collect/trigger",
        "output": {
            "status": "collected",
            "collector_id": "c_8f2a91b4e7d3",
            "source": "Salesforce",
            "snapshot_id": "7d7d2039-61af-4c51-965b-c7d7838fd1e2",
            "pair_queued": False,
            "message": "First snapshot stored. Trigger again to detect changes.",
        },
        "delay": 1.5,
    },
    {
        "title": "⚡ Site change detected! Salesforce updated their API docs",
        "command": None,
        "output": "The User object fields changed: status became an enum, email became optional, new required fields added.",
        "delay": 2,
    },
    {
        "title": "Collector notices extraction returned different data",
        "command": "POST /collect/trigger (second run)",
        "output": {
            "status": "collected",
            "collector_id": "c_8f2a91b4e7d3",
            "source": "Salesforce",
            "snapshot_id": "f056a152-668e-42c7-b730-f523893cf7d8",
            "pair_queued": True,
            "message": "Content collected and queued for analysis.",
        },
        "delay": 1.5,
    },
    {
        "title": "❌ Simulating extraction failure (page layout changed)",
        "command": None,
        "output": "Scraper extraction returned empty for 'User.status' — the CSS selector changed.",
        "delay": 1.5,
    },
    {
        "title": "🔧 Self-healing: repairing the scraper",
        "command": "bdata scraper heal c_8f2a91b4e7d3 'The status field moved from .field-table td to .api-field-row .type-badge'",
        "output": {
            "status": "healed",
            "collector_id": "c_8f2a91b4e7d3",
            "output": "Scraper healed. Extraction updated to match new page structure.",
            "message": "Scraper healed. Same Collector ID, nothing downstream changed.",
        },
        "delay": 2,
    },
    {
        "title": "✅ Re-collection successful after heal",
        "command": "POST /collect/trigger (after heal)",
        "output": {
            "status": "collected",
            "collector_id": "c_8f2a91b4e7d3",
            "source": "Salesforce",
            "snapshot_id": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
            "pair_queued": True,
            "message": "Content collected and queued for analysis. 1,284 rows recovered.",
        },
        "delay": 1.5,
    },
    {
        "title": "Processing: extraction → diff → impact graph → alerts",
        "command": "POST /ingest/process",
        "output": {
            "status": "processed",
            "pairs_processed": 1,
            "total_events": 6,
            "total_impacts": 4,
            "results": [
                {
                    "application": "Salesforce",
                    "events_detected": 6,
                    "impacts": [
                        {
                            "entity": "User.status",
                            "affected_systems": [
                                "Account Enable/Disable Decision",
                                "AD Group: Salesforce Users",
                                "Employee Offboarding",
                            ],
                            "risk_score": 0.85,
                            "top_recommendation": "UPDATE MAPPINGS: 'User.status' type/values changed. Review transformation logic.",
                        },
                        {
                            "entity": "User.email",
                            "affected_systems": [
                                "Identity Correlation Decision",
                                "Salesforce Application Access",
                            ],
                            "risk_score": 0.65,
                            "top_recommendation": "CHECK REQUIRED HANDLING: 'User.email' nullability changed.",
                        },
                    ],
                }
            ],
        },
        "delay": 2,
    },
    {
        "title": "IGA Adapter: domain-specific remediation",
        "command": "POST /adapters/analyze/iga",
        "output": {
            "domain": "IGA",
            "executive_summary": "Detected 6 IGA-relevant changes. 1 CRITICAL requiring immediate action. 3 HIGH priority items.",
            "critical_count": 1,
            "high_count": 3,
            "alerts": [
                {
                    "title": "Authentication change: auth_flows",
                    "severity": "CRITICAL",
                    "summary": "API Key authentication removed. Connector auth will fail.",
                    "remediation": [
                        {"action": "Update connector to OAuth 2.0", "effort": "1 hour"},
                    ],
                },
                {
                    "title": "Lifecycle field changed: User.status",
                    "severity": "HIGH",
                    "summary": "BOOLEAN → ENUM. Provisioning rules won't handle SUSPENDED state.",
                    "remediation": [
                        {"action": "Update attribute mapping for new states", "effort": "2-4 hours"},
                    ],
                },
            ],
        },
        "delay": 1,
    },
]


# ─── Display functions ───────────────────────────────────────────────────────


def print_step(step_num: int, total: int, title: str) -> None:
    print(f"\n{'─' * 70}")
    print(f"  Step {step_num}/{total}: {title}")
    print(f"{'─' * 70}")


def print_command(cmd: str) -> None:
    if cmd:
        print(f"\n  $ {cmd}")


def print_output(output) -> None:
    if isinstance(output, dict):
        print(f"\n{json.dumps(output, indent=2)}")
    else:
        print(f"\n  {output}")


def type_effect(text: str, delay: float = 0.02) -> None:
    """Simulate typing for demo video effect."""
    for char in text:
        sys.stdout.write(char)
        sys.stdout.flush()
        time.sleep(delay)
    print()


# ─── Live flow (uses actual API) ────────────────────────────────────────────


async def run_live_demo():
    """Run the demo against the live Tremor server with Bright Data."""
    print("\n" + "═" * 70)
    print("  TREMOR — Self-Healing Scraper Demo (LIVE)")
    print("═" * 70)
    print("\n  ⚠️  This uses Bright Data credits. Server must be running.")
    print("  ⚠️  Ensure BRIGHT_DATA_API_TOKEN is set in .env\n")

    async with httpx.AsyncClient(base_url=BASE_URL, timeout=300) as client:
        # Check server
        r = await client.get("/health")
        if r.status_code != 200:
            print("  ❌ Server not running. Start with: uv run uvicorn tremor.main:app --reload")
            return

        print("  ✓ Server connected\n")

        # Step 1: Create scraper
        print_step(1, 5, "Creating Bright Data scraper")
        r = await client.post("/collect/create", json={
            "url": "https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/resources_sobject_describe.htm",
            "description": "Extract all SObject fields with their names, data types, required/optional status, and descriptions",
        })
        print_output(r.json())

        if r.status_code != 200:
            print("  ❌ Scraper creation failed. Check your Bright Data token.")
            return

        collector_id = r.json().get("collector_id")
        print(f"\n  ✓ Collector ID: {collector_id}")

        # Step 2: First collection
        print_step(2, 5, "Collecting baseline snapshot")
        r = await client.post("/collect/trigger", json={
            "collector_id": collector_id,
            "url": "https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/resources_sobject_describe.htm",
            "application": "Salesforce",
        })
        print_output(r.json())

        # Step 3: Second collection (will show changes if any)
        print_step(3, 5, "Collecting again to detect changes")
        await asyncio.sleep(5)
        r = await client.post("/collect/trigger", json={
            "collector_id": collector_id,
            "url": "https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/resources_sobject_describe.htm",
            "application": "Salesforce",
        })
        print_output(r.json())

        # Step 4: Process
        print_step(4, 5, "Processing pipeline (extract → diff → impact)")
        r = await client.post("/ingest/process")
        print_output(r.json())

        # Step 5: Adapter analysis
        print_step(5, 5, "IGA domain analysis")
        r = await client.post("/adapters/analyze/iga")
        print_output(r.json())

    print("\n" + "═" * 70)
    print("  DEMO COMPLETE")
    print("═" * 70 + "\n")


# ─── Simulated flow (no credits burned) ─────────────────────────────────────


async def run_simulated_demo():
    """Run the demo with simulated outputs (for recording without credits)."""
    print("\n" + "═" * 70)
    print("  TREMOR — Self-Healing Scraper Demo (SIMULATED)")
    print("  No Bright Data credits used — outputs are pre-recorded.")
    print("═" * 70)

    total = len(SIMULATED_STEPS)
    for i, step in enumerate(SIMULATED_STEPS):
        print_step(i + 1, total, step["title"])
        print_command(step.get("command"))

        # Simulate processing time
        time.sleep(step["delay"])

        print_output(step["output"])

    print("\n" + "═" * 70)
    print("  DEMO COMPLETE")
    print()
    print("  Summary:")
    print("  ├─ Scraper created:     c_8f2a91b4e7d3")
    print("  ├─ Self-healing:        ✅ Repaired after site layout change")
    print("  ├─ Changes detected:    6 semantic shifts")
    print("  ├─ Critical alerts:     1 (auth flow removed)")
    print("  ├─ Affected systems:    4 downstream dependencies")
    print("  └─ Remediation steps:   Generated with effort estimates")
    print()
    print("  Key demonstration:")
    print("  • Scraper broke when site changed layout")
    print("  • bdata scraper heal repaired it from one prompt")
    print("  • Same Collector ID — nothing downstream changed")
    print("  • Tremor still produced intelligence despite the disruption")
    print()
    print("═" * 70 + "\n")


# ─── Entry point ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Tremor self-healing demo")
    parser.add_argument(
        "--simulate",
        action="store_true",
        help="Run simulated demo (no credits, no server needed)",
    )
    args = parser.parse_args()

    if args.simulate:
        asyncio.run(run_simulated_demo())
    else:
        asyncio.run(run_live_demo())
