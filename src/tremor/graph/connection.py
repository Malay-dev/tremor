"""Neo4j connection manager."""

import logging
import os

from neo4j import AsyncDriver, AsyncGraphDatabase

logger = logging.getLogger(__name__)


class Neo4jConnection:
    """Manages Neo4j driver lifecycle."""

    _driver: AsyncDriver | None = None

    @classmethod
    def get_driver(cls) -> AsyncDriver:
        """Get or create the Neo4j async driver."""
        if cls._driver is None:
            uri = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
            user = os.environ.get("NEO4J_USER", "neo4j")
            password = os.environ.get("NEO4J_PASSWORD", "password")

            cls._driver = AsyncGraphDatabase.driver(uri, auth=(user, password))
            logger.info(f"Neo4j driver created for {uri}")

        return cls._driver

    @classmethod
    async def close(cls):
        """Close the driver connection."""
        if cls._driver:
            await cls._driver.close()
            cls._driver = None
            logger.info("Neo4j driver closed")

    @classmethod
    async def verify_connectivity(cls) -> bool:
        """Check if Neo4j is reachable."""
        try:
            driver = cls.get_driver()
            await driver.verify_connectivity()
            return True
        except Exception as e:  # noqa: BLE001
            logger.warning(f"Neo4j not reachable: {e}")
            return False
