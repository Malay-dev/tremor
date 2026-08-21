"""Impact Traversal — walks the graph from a changed entity to find affected systems."""

import logging

from neo4j import AsyncDriver

from tremor.graph.models import (
    GraphEdge,
    GraphNode,
    ImpactAnalysis,
    ImpactPath,
    NodeType,
    RelationType,
)
from tremor.models.event import ChangeEvent, ImpactResult, Severity

logger = logging.getLogger(__name__)

# Risk weights per node type (deeper = more impact)
_RISK_WEIGHTS: dict[str, float] = {
    NodeType.API_FIELD: 0.1,
    NodeType.ATTRIBUTE_MAPPING: 0.2,
    NodeType.TRANSFORMATION: 0.2,
    NodeType.PROVISIONING_RULE: 0.3,
    NodeType.ACCESS_DECISION: 0.4,
    NodeType.ENTITLEMENT: 0.5,
    NodeType.BUSINESS_PROCESS: 0.6,
}

# Severity multipliers
_SEVERITY_MULTIPLIERS: dict[str, float] = {
    Severity.CRITICAL: 1.0,
    Severity.HIGH: 0.8,
    Severity.MEDIUM: 0.5,
    Severity.LOW: 0.2,
    Severity.INFO: 0.1,
}


class ImpactTraverser:
    """Traverses the impact graph to determine downstream effects of a change."""

    def __init__(self, driver: AsyncDriver):
        self.driver = driver

    async def analyze_impact(self, event: ChangeEvent) -> ImpactAnalysis:
        """
        Given a ChangeEvent, find all downstream systems affected.

        Strategy:
        1. Find the graph node matching the changed entity
        2. Walk all paths downstream (up to 6 hops)
        3. Collect affected systems and calculate risk
        4. Generate recommendations
        """
        entity_path = event.entity.path  # e.g. "User.status" or "Account.level"
        application = event.application

        # Find matching node - try field-level match first
        start_node_id = await self._find_start_node(entity_path, application)

        if not start_node_id:
            logger.warning(f"No graph node found for {application}:{entity_path}")
            return ImpactAnalysis(
                event_id=str(event.event_id),
                source_entity=entity_path,
                application=application,
                recommendations=[
                    (
                        f"Entity '{entity_path}' not mapped in the impact graph. "
                        "Consider adding it to track downstream dependencies."
                    ),
                ],
            )

        # Traverse downstream
        paths = await self._traverse_downstream(start_node_id)

        # Calculate risk
        severity_mult = _SEVERITY_MULTIPLIERS.get(event.severity, 0.5)
        affected_systems: list[str] = []
        total_risk = 0.0

        for path in paths:
            path_risk = sum(
                _RISK_WEIGHTS.get(n.node_type, 0.1) for n in path.nodes[1:]  # Skip source
            ) * severity_mult
            path.risk_contribution = min(path_risk, 1.0)
            total_risk += path.risk_contribution

            # Collect endpoint systems
            for node in path.nodes:
                if node.node_type in (
                    NodeType.ENTITLEMENT,
                    NodeType.BUSINESS_PROCESS,
                    NodeType.ACCESS_DECISION,
                ) and node.name not in affected_systems:
                    affected_systems.append(node.name)

        total_risk = min(total_risk / max(len(paths), 1), 1.0)

        # Generate recommendations
        recommendations = self._generate_recommendations(event, paths, affected_systems)

        analysis = ImpactAnalysis(
            event_id=str(event.event_id),
            source_entity=entity_path,
            application=application,
            paths=paths,
            affected_systems=affected_systems,
            total_risk_score=round(total_risk, 3),
            recommendations=recommendations,
        )

        logger.info(
            f"Impact analysis for {entity_path}: "
            f"{len(paths)} paths, {len(affected_systems)} affected systems, "
            f"risk={total_risk:.2f}"
        )
        return analysis

    async def _find_start_node(self, entity_path: str, application: str) -> str | None:
        """Find the graph node that matches the changed entity."""
        async with self.driver.session() as session:
            # Try exact field match: "field:{app}:{Entity.field}"
            node_id = f"field:{application.lower()}:{entity_path}"
            result = await session.run(
                "MATCH (n:Node {node_id: $node_id}) RETURN n.node_id AS id",
                node_id=node_id,
            )
            record = await result.single()
            if record:
                return record["id"]

            # Try fuzzy match on name
            result = await session.run(
                """
                MATCH (n:Node)
                WHERE n.name = $name AND toLower(n.application) = toLower($app)
                RETURN n.node_id AS id
                LIMIT 1
                """,
                name=entity_path,
                app=application,
            )
            record = await result.single()
            if record:
                return record["id"]

            # Try partial match (field name contains the path)
            result = await session.run(
                """
                MATCH (n:Node)
                WHERE n.name CONTAINS $name AND toLower(n.application) = toLower($app)
                RETURN n.node_id AS id
                LIMIT 1
                """,
                name=entity_path,
                app=application,
            )
            record = await result.single()
            return record["id"] if record else None

    async def _traverse_downstream(self, start_node_id: str, max_depth: int = 6) -> list[ImpactPath]:
        """Walk all paths downstream from the start node."""
        paths: list[ImpactPath] = []

        async with self.driver.session() as session:
            # Get all paths from start node to any leaf (up to max_depth hops)
            result = await session.run(
                """
                MATCH path = (start:Node {node_id: $start_id})-[*1..""" + str(max_depth) + """]->(end:Node)
                WHERE NOT (end)-->()
                RETURN
                    [n IN nodes(path) | {
                        node_id: n.node_id,
                        node_type: n.node_type,
                        name: n.name,
                        application: n.application
                    }] AS path_nodes,
                    [r IN relationships(path) | {
                        source_id: startNode(r).node_id,
                        target_id: endNode(r).node_id,
                        relation_type: type(r)
                    }] AS path_edges,
                    length(path) AS depth
                ORDER BY depth
                """,
                start_id=start_node_id,
            )

            async for record in result:
                nodes = [
                    GraphNode(
                        node_id=n["node_id"],
                        node_type=NodeType(n["node_type"]),
                        name=n["name"],
                        application=n.get("application", ""),
                    )
                    for n in record["path_nodes"]
                ]
                edges = [
                    GraphEdge(
                        source_id=e["source_id"],
                        target_id=e["target_id"],
                        relation_type=RelationType(e["relation_type"]),
                    )
                    for e in record["path_edges"]
                ]
                paths.append(ImpactPath(
                    nodes=nodes,
                    edges=edges,
                    depth=record["depth"],
                ))

            # Also get intermediate paths (not just to leaves)
            if not paths:
                result = await session.run(
                    """
                    MATCH path = (start:Node {node_id: $start_id})-[*1..""" + str(max_depth) + """]->(end:Node)
                    RETURN
                        [n IN nodes(path) | {
                            node_id: n.node_id,
                            node_type: n.node_type,
                            name: n.name,
                            application: n.application
                        }] AS path_nodes,
                        [r IN relationships(path) | {
                            source_id: startNode(r).node_id,
                            target_id: endNode(r).node_id,
                            relation_type: type(r)
                        }] AS path_edges,
                        length(path) AS depth
                    ORDER BY depth
                    LIMIT 20
                    """,
                    start_id=start_node_id,
                )
                async for record in result:
                    nodes = [
                        GraphNode(
                            node_id=n["node_id"],
                            node_type=NodeType(n["node_type"]),
                            name=n["name"],
                            application=n.get("application", ""),
                        )
                        for n in record["path_nodes"]
                    ]
                    edges = [
                        GraphEdge(
                            source_id=e["source_id"],
                            target_id=e["target_id"],
                            relation_type=RelationType(e["relation_type"]),
                        )
                        for e in record["path_edges"]
                    ]
                    paths.append(ImpactPath(
                        nodes=nodes,
                        edges=edges,
                        depth=record["depth"],
                    ))

        return paths

    def _generate_recommendations(
        self,
        event: ChangeEvent,
        paths: list[ImpactPath],
        affected_systems: list[str],
    ) -> list[str]:
        """Generate actionable recommendations based on the impact analysis."""
        recommendations: list[str] = []

        if not paths:
            return [f"No downstream dependencies found for {event.entity.path}."]

        # Based on shift type
        shift = event.shift.value
        entity = event.entity.path

        if "REMOVAL" in shift:
            recommendations.append(
                f"URGENT: '{entity}' has been removed. "
                f"Update or disable the following immediately: {', '.join(affected_systems[:5])}"
            )
        elif "DEPRECATION" in shift:
            recommendations.append(
                f"PLAN MIGRATION: '{entity}' is deprecated. "
                f"Schedule updates for: {', '.join(affected_systems[:5])}"
            )
        elif "TYPE_CHANGED" in shift or "STATE_SPACE" in shift:
            recommendations.append(
                f"UPDATE MAPPINGS: '{entity}' type/values changed. "
                f"Review transformation logic in attribute mappings."
            )
        elif "NULLABILITY" in shift:
            recommendations.append(
                f"CHECK REQUIRED HANDLING: '{entity}' nullability changed. "
                f"Verify correlation and provisioning rules handle the new contract."
            )

        # Based on affected systems
        if any("Offboarding" in s for s in affected_systems):
            recommendations.append(
                "SECURITY IMPACT: Employee offboarding process affected. "
                "Verify access revocation still works correctly."
            )

        if any("Access Review" in s for s in affected_systems):
            recommendations.append(
                "COMPLIANCE IMPACT: Access review process affected. "
                "Confirm audit trail and review workflows are intact."
            )

        # Depth-based urgency
        max_depth = max((p.depth for p in paths), default=0)
        if max_depth >= 4:
            recommendations.append(
                f"DEEP PROPAGATION: Change affects systems up to {max_depth} layers downstream. "
                "Consider a phased rollout with monitoring at each layer."
            )

        return recommendations

    async def to_impact_result(self, event: ChangeEvent, analysis: ImpactAnalysis) -> ImpactResult:
        """Convert an ImpactAnalysis to the simpler ImpactResult model."""
        # Build propagation path from the longest path
        propagation: list[str] = []
        if analysis.paths:
            longest = max(analysis.paths, key=lambda p: p.depth)
            propagation = [n.name for n in longest.nodes]

        return ImpactResult(
            event_id=event.event_id,
            affected_systems=analysis.affected_systems,
            propagation_path=propagation,
            risk_score=analysis.total_risk_score,
            recommendation=analysis.recommendations[0] if analysis.recommendations else "No action needed.",
        )
