"""Graph Seeder — populates Neo4j with IGA topology for demo/testing."""

import logging

from neo4j import AsyncDriver

from tremor.graph.models import GraphEdge, GraphNode, NodeType, RelationType

logger = logging.getLogger(__name__)


# --- Sample IGA topology for Salesforce ---

SALESFORCE_NODES = [
    # Application
    GraphNode(
        node_id="app:salesforce",
        node_type=NodeType.APPLICATION,
        name="Salesforce",
        application="Salesforce",
        properties={"vendor": "Salesforce", "api_version": "v62.0"},
    ),
    # API Fields
    GraphNode(
        node_id="field:salesforce:User.status",
        node_type=NodeType.API_FIELD,
        name="User.status",
        application="Salesforce",
        properties={"object": "User", "field": "status", "type": "boolean"},
    ),
    GraphNode(
        node_id="field:salesforce:User.email",
        node_type=NodeType.API_FIELD,
        name="User.email",
        application="Salesforce",
        properties={"object": "User", "field": "email", "type": "string"},
    ),
    GraphNode(
        node_id="field:salesforce:User.department",
        node_type=NodeType.API_FIELD,
        name="User.department",
        application="Salesforce",
        properties={"object": "User", "field": "department", "type": "string"},
    ),
    GraphNode(
        node_id="field:salesforce:Account.level",
        node_type=NodeType.API_FIELD,
        name="Account.level",
        application="Salesforce",
        properties={"object": "Account", "field": "level", "type": "string"},
    ),
    # Connectors
    GraphNode(
        node_id="connector:sf-provisioning",
        node_type=NodeType.CONNECTOR,
        name="Salesforce Provisioning Connector",
        application="Salesforce",
        properties={"connector_type": "provisioning", "platform": "SailPoint"},
    ),
    GraphNode(
        node_id="connector:sf-correlation",
        node_type=NodeType.CONNECTOR,
        name="Salesforce Correlation Connector",
        application="Salesforce",
        properties={"connector_type": "correlation", "platform": "SailPoint"},
    ),
    # Attribute Mappings
    GraphNode(
        node_id="mapping:status-to-enabled",
        node_type=NodeType.ATTRIBUTE_MAPPING,
        name="status → accountEnabled",
        application="Salesforce",
        properties={"source": "User.status", "target": "accountEnabled"},
    ),
    GraphNode(
        node_id="mapping:email-to-identity",
        node_type=NodeType.ATTRIBUTE_MAPPING,
        name="email → correlationKey",
        application="Salesforce",
        properties={"source": "User.email", "target": "correlationKey"},
    ),
    GraphNode(
        node_id="mapping:dept-to-ou",
        node_type=NodeType.ATTRIBUTE_MAPPING,
        name="department → organizationalUnit",
        application="Salesforce",
        properties={"source": "User.department", "target": "organizationalUnit"},
    ),
    # Transformations
    GraphNode(
        node_id="transform:bool-to-enable-disable",
        node_type=NodeType.TRANSFORMATION,
        name="Boolean → Enable/Disable",
        properties={"logic": "true→enabled, false→disabled"},
    ),
    # Provisioning Rules
    GraphNode(
        node_id="rule:disable-on-inactive",
        node_type=NodeType.PROVISIONING_RULE,
        name="Disable Account on Inactive Status",
        properties={"condition": "status == false", "action": "disable_account"},
    ),
    GraphNode(
        node_id="rule:correlate-on-email",
        node_type=NodeType.PROVISIONING_RULE,
        name="Correlate Identity on Email",
        properties={"condition": "email matches", "action": "link_identity"},
    ),
    GraphNode(
        node_id="rule:assign-ou-by-dept",
        node_type=NodeType.PROVISIONING_RULE,
        name="Assign OU by Department",
        properties={"condition": "department present", "action": "set_ou"},
    ),
    # Access Decisions
    GraphNode(
        node_id="decision:account-lifecycle",
        node_type=NodeType.ACCESS_DECISION,
        name="Account Enable/Disable Decision",
        properties={"decision_type": "lifecycle"},
    ),
    GraphNode(
        node_id="decision:identity-correlation",
        node_type=NodeType.ACCESS_DECISION,
        name="Identity Correlation Decision",
        properties={"decision_type": "correlation"},
    ),
    # Entitlements
    GraphNode(
        node_id="entitlement:ad-group-salesforce",
        node_type=NodeType.ENTITLEMENT,
        name="AD Group: Salesforce Users",
        properties={"system": "Active Directory", "group": "SalesforceUsers"},
    ),
    GraphNode(
        node_id="entitlement:app-access-salesforce",
        node_type=NodeType.ENTITLEMENT,
        name="Salesforce Application Access",
        properties={"system": "SSO", "app": "Salesforce"},
    ),
    # Business Processes
    GraphNode(
        node_id="process:employee-offboarding",
        node_type=NodeType.BUSINESS_PROCESS,
        name="Employee Offboarding",
        properties={"owner": "IT Security", "sla": "24h"},
    ),
    GraphNode(
        node_id="process:access-review",
        node_type=NodeType.BUSINESS_PROCESS,
        name="Quarterly Access Review",
        properties={"owner": "Compliance", "frequency": "quarterly"},
    ),
]

SALESFORCE_EDGES = [
    # Application → Fields
    GraphEdge(source_id="app:salesforce", target_id="field:salesforce:User.status", relation_type=RelationType.EXPOSES),
    GraphEdge(source_id="app:salesforce", target_id="field:salesforce:User.email", relation_type=RelationType.EXPOSES),
    GraphEdge(source_id="app:salesforce", target_id="field:salesforce:User.department", relation_type=RelationType.EXPOSES),
    GraphEdge(source_id="app:salesforce", target_id="field:salesforce:Account.level", relation_type=RelationType.EXPOSES),
    # Fields → Mappings
    GraphEdge(source_id="field:salesforce:User.status", target_id="mapping:status-to-enabled", relation_type=RelationType.MAPS_TO),
    GraphEdge(source_id="field:salesforce:User.email", target_id="mapping:email-to-identity", relation_type=RelationType.MAPS_TO),
    GraphEdge(source_id="field:salesforce:User.department", target_id="mapping:dept-to-ou", relation_type=RelationType.MAPS_TO),
    # Mappings → Transformations / Rules
    GraphEdge(source_id="mapping:status-to-enabled", target_id="transform:bool-to-enable-disable", relation_type=RelationType.TRANSFORMS),
    GraphEdge(source_id="transform:bool-to-enable-disable", target_id="rule:disable-on-inactive", relation_type=RelationType.DRIVES),
    GraphEdge(source_id="mapping:email-to-identity", target_id="rule:correlate-on-email", relation_type=RelationType.DRIVES),
    GraphEdge(source_id="mapping:dept-to-ou", target_id="rule:assign-ou-by-dept", relation_type=RelationType.DRIVES),
    # Rules → Decisions
    GraphEdge(source_id="rule:disable-on-inactive", target_id="decision:account-lifecycle", relation_type=RelationType.EVALUATES),
    GraphEdge(source_id="rule:correlate-on-email", target_id="decision:identity-correlation", relation_type=RelationType.EVALUATES),
    # Decisions → Entitlements
    GraphEdge(source_id="decision:account-lifecycle", target_id="entitlement:ad-group-salesforce", relation_type=RelationType.CONTROLS),
    GraphEdge(source_id="decision:account-lifecycle", target_id="entitlement:app-access-salesforce", relation_type=RelationType.CONTROLS),
    GraphEdge(source_id="decision:identity-correlation", target_id="entitlement:app-access-salesforce", relation_type=RelationType.CONTROLS),
    # Entitlements → Business Processes
    GraphEdge(source_id="entitlement:ad-group-salesforce", target_id="process:employee-offboarding", relation_type=RelationType.AFFECTS),
    GraphEdge(source_id="entitlement:app-access-salesforce", target_id="process:access-review", relation_type=RelationType.AFFECTS),
]


class GraphSeeder:
    """Seeds Neo4j with IGA topology data."""

    def __init__(self, driver: AsyncDriver):
        self.driver = driver

    async def seed_salesforce_topology(self) -> dict:
        """Seed the full Salesforce IGA topology."""
        async with self.driver.session() as session:
            # Clear existing data
            await session.run("MATCH (n) DETACH DELETE n")

            # Create constraints for uniqueness
            await session.run(
                "CREATE CONSTRAINT IF NOT EXISTS FOR (n:Node) REQUIRE n.node_id IS UNIQUE"
            )

            # Create nodes
            for node in SALESFORCE_NODES:
                await session.run(
                    """
                    CREATE (n:Node {
                        node_id: $node_id,
                        node_type: $node_type,
                        name: $name,
                        application: $application
                    })
                    SET n += $properties
                    SET n:""" + node.node_type.value,
                    node_id=node.node_id,
                    node_type=node.node_type.value,
                    name=node.name,
                    application=node.application or "",
                    properties=node.properties,
                )

            # Create relationships
            for edge in SALESFORCE_EDGES:
                await session.run(
                    f"""
                    MATCH (a:Node {{node_id: $source_id}})
                    MATCH (b:Node {{node_id: $target_id}})
                    CREATE (a)-[r:{edge.relation_type.value}]->(b)
                    SET r += $properties
                    """,
                    source_id=edge.source_id,
                    target_id=edge.target_id,
                    properties=edge.properties,
                )

            logger.info(
                f"Seeded graph: {len(SALESFORCE_NODES)} nodes, {len(SALESFORCE_EDGES)} edges"
            )

        return {
            "nodes_created": len(SALESFORCE_NODES),
            "edges_created": len(SALESFORCE_EDGES),
            "topology": "Salesforce IGA",
        }

    async def get_topology_summary(self) -> dict:
        """Get a summary of the current graph topology."""
        async with self.driver.session() as session:
            # Count nodes by type
            result = await session.run(
                "MATCH (n:Node) RETURN n.node_type AS type, count(n) AS count ORDER BY count DESC"
            )
            node_counts = {record["type"]: record["count"] async for record in result}

            # Count relationships
            result = await session.run(
                "MATCH ()-[r]->() RETURN type(r) AS type, count(r) AS count ORDER BY count DESC"
            )
            edge_counts = {record["type"]: record["count"] async for record in result}

            # Total
            result = await session.run("MATCH (n) RETURN count(n) AS nodes")
            total_nodes = await result.single()

            result = await session.run("MATCH ()-[r]->() RETURN count(r) AS edges")
            total_edges = await result.single()

        return {
            "total_nodes": total_nodes["nodes"] if total_nodes else 0,
            "total_edges": total_edges["edges"] if total_edges else 0,
            "nodes_by_type": node_counts,
            "edges_by_type": edge_counts,
        }
