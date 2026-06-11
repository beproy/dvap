import asyncio
import secrets
from datetime import datetime, timezone

from app.db.neo4j_client import get_driver
from app.db.sqlite_client import db_conn
from app.schemas.system import (
    ComponentOut,
    DataFlowOut,
    SystemCreate,
    SystemCreateResponse,
    SystemOut,
    SystemSummary,
)


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# ── SQLite helpers (called via asyncio.to_thread) ─────────────────────────────

def _sqlite_insert_system(
    system_id: str, name: str, description: str | None, component_count: int, now: str
) -> None:
    with db_conn() as conn:
        conn.execute(
            """INSERT INTO systems (system_id, name, description, component_count, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (system_id, name, description, component_count, now, now),
        )


def _sqlite_delete_system(system_id: str) -> None:
    with db_conn() as conn:
        conn.execute("DELETE FROM analysis_runs WHERE system_id = ?", (system_id,))
        conn.execute("DELETE FROM systems WHERE system_id = ?", (system_id,))


def _sqlite_list_systems() -> list[dict]:
    with db_conn() as conn:
        rows = conn.execute(
            "SELECT system_id, name, description, component_count, created_at "
            "FROM systems ORDER BY created_at DESC"
        ).fetchall()
        return [dict(r) for r in rows]


# ── Neo4j transaction functions ───────────────────────────────────────────────

async def _neo4j_create_tx(
    tx,
    system_id: str,
    name: str,
    description: str,
    created_at: str,
    components: list[dict],
    flows: list[dict],
) -> None:
    await tx.run(
        "CREATE (s:System {id: $id, name: $name, description: $description, created_at: $created_at})",
        id=system_id,
        name=name,
        description=description,
        created_at=created_at,
    )
    for comp in components:
        await tx.run(
            "MATCH (s:System {id: $system_id}) "
            "CREATE (c:Component {id: $id, name: $name, type: $type, description: $description}) "
            "CREATE (s)-[:HAS_COMPONENT]->(c)",
            system_id=system_id,
            id=comp["id"],
            name=comp["name"],
            type=comp["type"],
            description=comp["description"],
        )
    for flow in flows:
        await tx.run(
            "MATCH (src:Component {id: $source_id}) "
            "MATCH (dst:Component {id: $dest_id}) "
            "CREATE (src)-[:FLOWS_TO {data_type: $data_type, protocol: $protocol, is_encrypted: $is_encrypted}]->(dst)",
            source_id=flow["source_id"],
            dest_id=flow["dest_id"],
            data_type=flow["data_type"],
            protocol=flow["protocol"],
            is_encrypted=flow["is_encrypted"],
        )


async def _neo4j_delete_tx(tx, system_id: str) -> bool:
    result = await tx.run(
        "MATCH (s:System {id: $id}) "
        "OPTIONAL MATCH (s)-[:HAS_COMPONENT]->(c:Component) "
        "DETACH DELETE s, c "
        "RETURN count(s) AS deleted",
        id=system_id,
    )
    record = await result.single()
    return bool(record and record["deleted"] > 0)


# ── Public service functions ──────────────────────────────────────────────────

async def create_system(data: SystemCreate) -> SystemCreateResponse:
    system_id = f"sys_{secrets.token_hex(4)}"
    now = _now_iso()

    # Build component id map: name → generated id
    component_map: dict[str, str] = {
        comp.name: f"cmp_{secrets.token_hex(3)}" for comp in data.components
    }

    components_payload = [
        {"id": component_map[c.name], "name": c.name, "type": c.type, "description": c.description}
        for c in data.components
    ]
    flows_payload = [
        {
            "source_id": component_map[f.source],
            "dest_id": component_map[f.destination],
            "data_type": f.data_type,
            "protocol": f.protocol,
            "is_encrypted": f.is_encrypted,
        }
        for f in data.data_flows
    ]

    # Write to SQLite first — fast and rollback-capable
    await asyncio.to_thread(
        _sqlite_insert_system, system_id, data.name, data.description, len(data.components), now
    )

    try:
        async with get_driver().session() as session:
            await session.execute_write(
                _neo4j_create_tx,
                system_id,
                data.name,
                data.description,
                now,
                components_payload,
                flows_payload,
            )
    except Exception:
        # Roll back the SQLite row so the two stores stay consistent
        await asyncio.to_thread(_sqlite_delete_system, system_id)
        raise

    return SystemCreateResponse(
        system_id=system_id,
        name=data.name,
        component_count=len(data.components),
        flow_count=len(data.data_flows),
        created_at=now,
    )


async def get_system(system_id: str) -> SystemOut | None:
    async with get_driver().session() as session:
        # System + components
        result = await session.run(
            "MATCH (s:System {id: $id}) "
            "OPTIONAL MATCH (s)-[:HAS_COMPONENT]->(c:Component) "
            "RETURN s, collect(c) AS components",
            id=system_id,
        )
        record = await result.single()
        if not record or record["s"] is None:
            return None

        s_node = record["s"]
        raw_components = [c for c in record["components"] if c is not None]

        # Flows between this system's components
        flow_result = await session.run(
            "MATCH (s:System {id: $id})-[:HAS_COMPONENT]->(c1:Component)"
            "-[f:FLOWS_TO]->(c2:Component)<-[:HAS_COMPONENT]-(s) "
            "RETURN c1.id AS source, c2.id AS destination, "
            "f.data_type AS data_type, f.protocol AS protocol, f.is_encrypted AS is_encrypted",
            id=system_id,
        )
        raw_flows = await flow_result.data()

    components = [
        ComponentOut(
            component_id=c["id"],
            name=c["name"],
            type=c["type"],
            description=c.get("description") or "",
        )
        for c in raw_components
    ]
    flows = [
        DataFlowOut(
            source=r["source"],
            destination=r["destination"],
            data_type=r["data_type"],
            protocol=r["protocol"],
            is_encrypted=r["is_encrypted"],
        )
        for r in raw_flows
    ]

    return SystemOut(
        system_id=s_node["id"],
        name=s_node["name"],
        description=s_node.get("description"),
        created_at=s_node["created_at"],
        components=components,
        data_flows=flows,
    )


async def list_systems() -> list[SystemSummary]:
    rows = await asyncio.to_thread(_sqlite_list_systems)
    return [
        SystemSummary(
            system_id=r["system_id"],
            name=r["name"],
            description=r.get("description"),
            component_count=r["component_count"],
            created_at=r["created_at"],
        )
        for r in rows
    ]


async def delete_system(system_id: str) -> bool:
    # Delete Neo4j first; if it fails, SQLite is untouched (consistent)
    async with get_driver().session() as session:
        found = await session.execute_write(_neo4j_delete_tx, system_id)
    if not found:
        return False
    await asyncio.to_thread(_sqlite_delete_system, system_id)
    return True
