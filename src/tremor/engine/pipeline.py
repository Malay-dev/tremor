"""Processing Pipeline — orchestrates extraction, diffing, and impact analysis."""

import logging
import os
from dataclasses import dataclass, field

from tremor.engine.differ import SemanticDiffer
from tremor.extraction.extractor import SemanticExtractor
from tremor.graph.connection import Neo4jConnection
from tremor.graph.models import ImpactAnalysis
from tremor.graph.traversal import ImpactTraverser
from tremor.models.entities import SemanticContract
from tremor.models.event import ChangeEvent
from tremor.models.sources import SnapshotPair

logger = logging.getLogger(__name__)


@dataclass
class ProcessingResult:
    """Result of processing a single snapshot pair."""

    source_url: str
    application: str
    events: list[ChangeEvent] = field(default_factory=list)
    impacts: list[ImpactAnalysis] = field(default_factory=list)
    error: str | None = None


class Pipeline:
    """
    End-to-end processing pipeline.

    SnapshotPair → Extract both → Diff → ChangeEvents
    """

    def __init__(self, extractor: SemanticExtractor, differ: SemanticDiffer):
        self.extractor = extractor
        self.differ = differ
        # Cache contracts to avoid re-extracting the "before" on the next run
        self._contract_cache: dict[str, SemanticContract] = {}  # keyed by snapshot_id

    @classmethod
    def create(cls) -> Pipeline:
        """Factory that reads config from environment."""
        api_key = os.environ.get("GEMINI_API_KEY", "")
        model = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

        if not api_key:
            raise RuntimeError("GEMINI_API_KEY environment variable is required")

        extractor = SemanticExtractor(api_key=api_key, model=model)
        differ = SemanticDiffer()
        return cls(extractor=extractor, differ=differ)

    async def process_pair(self, pair: SnapshotPair, source_url: str, application: str) -> ProcessingResult:
        """
        Process a single snapshot pair through extraction and diffing.

        Args:
            pair: The before/after snapshot pair
            source_url: URL of the monitored source
            application: Application name (e.g., "Salesforce")

        Returns:
            ProcessingResult with detected ChangeEvents or an error
        """
        try:
            # Extract "before" contract (check cache first)
            before_key = str(pair.before.snapshot_id)
            if before_key in self._contract_cache:
                before_contract = self._contract_cache[before_key]
                logger.info(f"Using cached contract for before snapshot {before_key}")
            else:
                before_contract = await self.extractor.extract(
                    raw_content=pair.before.raw_content or "",
                    source_url=source_url,
                    application=application,
                )
                self._contract_cache[before_key] = before_contract

            # Extract "after" contract
            after_contract = await self.extractor.extract(
                raw_content=pair.after.raw_content or "",
                source_url=source_url,
                application=application,
            )
            # Cache it — it becomes "before" for the next pair
            after_key = str(pair.after.snapshot_id)
            self._contract_cache[after_key] = after_contract

            # Diff
            events = self.differ.diff(before_contract, after_contract)

            # Impact analysis (if Neo4j is available)
            impacts: list[ImpactAnalysis] = []
            if events and await Neo4jConnection.verify_connectivity():
                driver = Neo4jConnection.get_driver()
                traverser = ImpactTraverser(driver)
                for event in events:
                    analysis = await traverser.analyze_impact(event)
                    if analysis.affected_systems:
                        impacts.append(analysis)
                logger.info(f"Impact analysis: {len(impacts)}/{len(events)} events have downstream impact")
            elif events:
                logger.info("Neo4j not available — skipping impact analysis")

            logger.info(
                f"Processed pair for {application}: "
                f"{len(events)} change events detected"
            )
            return ProcessingResult(
                source_url=source_url,
                application=application,
                events=events,
                impacts=impacts,
            )

        except Exception as e:
            logger.exception("Error processing pair for %s", application)
            return ProcessingResult(
                source_url=source_url,
                application=application,
                error=str(e),
            )
