import asyncio
import logging

from neo4j import AsyncDriver, AsyncGraphDatabase

from app.config import settings

logger = logging.getLogger(__name__)

_driver: AsyncDriver | None = None

_CONSTRAINTS: list[str] = [
    "CREATE CONSTRAINT system_id IF NOT EXISTS FOR (s:System) REQUIRE s.id IS UNIQUE",
    "CREATE CONSTRAINT component_id IF NOT EXISTS FOR (c:Component) REQUIRE c.id IS UNIQUE",
    "CREATE CONSTRAINT threat_id IF NOT EXISTS FOR (t:Threat) REQUIRE t.id IS UNIQUE",
    "CREATE CONSTRAINT technique_id IF NOT EXISTS FOR (t:Technique) REQUIRE t.id IS UNIQUE",
    "CREATE CONSTRAINT attack_path_id IF NOT EXISTS FOR (a:AttackPath) REQUIRE a.id IS UNIQUE",
    "CREATE CONSTRAINT control_id IF NOT EXISTS FOR (c:Control) REQUIRE c.id IS UNIQUE",
    "CREATE CONSTRAINT analysis_run_id IF NOT EXISTS FOR (r:AnalysisRun) REQUIRE r.id IS UNIQUE",
]

_INDEXES: list[str] = [
    "CREATE INDEX threat_category IF NOT EXISTS FOR (t:Threat) ON (t.category)",
    "CREATE INDEX technique_tactic IF NOT EXISTS FOR (t:Technique) ON (t.tactic)",
    "CREATE INDEX control_framework IF NOT EXISTS FOR (c:Control) ON (c.framework)",
]


def get_driver() -> AsyncDriver:
    if _driver is None:
        raise RuntimeError("Neo4j driver not initialised — call init_neo4j() first")
    return _driver


async def init_neo4j() -> None:
    """Open the driver and create constraints/indexes, with retry for slow Neo4j startup."""
    global _driver
    _driver = AsyncGraphDatabase.driver(
        settings.neo4j_uri,
        auth=(settings.neo4j_user, settings.neo4j_password),
    )
    await _apply_schema(max_attempts=10, base_delay=2.0)


async def close_neo4j() -> None:
    global _driver
    if _driver is not None:
        await _driver.close()
        _driver = None


async def _apply_schema(max_attempts: int, base_delay: float) -> None:
    """Run constraint and index statements, retrying with exponential backoff.

    Neo4j can take 20-40 s after its healthcheck passes before it accepts queries.
    """
    for attempt in range(1, max_attempts + 1):
        try:
            async with _driver.session() as session:
                for stmt in _CONSTRAINTS + _INDEXES:
                    await session.run(stmt)
            logger.info("Neo4j constraints and indexes applied")
            return
        except Exception as exc:
            if attempt == max_attempts:
                raise RuntimeError(
                    f"Neo4j schema init failed after {max_attempts} attempts"
                ) from exc
            delay = base_delay * (2 ** (attempt - 1))
            logger.warning(
                "Neo4j not ready (attempt %d/%d), retrying in %.1fs — %s",
                attempt,
                max_attempts,
                delay,
                exc,
            )
            await asyncio.sleep(delay)
