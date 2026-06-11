"""
Orchestrator persistence helpers.

Covers two responsibilities:
  1. Pre-fetch helpers (read from Neo4j to build agent inputs)
  2. Post-run helpers (write agent findings back to Neo4j + SQLite)
"""

import asyncio
import json
import logging
import re
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any

from app.db.neo4j_client import get_driver

if TYPE_CHECKING:
    from app.agents.attack import AttackOutput
    from app.agents.attack_tree import AttackTreeOutput
    from app.agents.controls import ControlsOutput
    from app.agents.maestro import MaestroOutput
    from app.agents.stride import StrideOutput
    from app.schemas.system import ComponentCreate, DataFlowCreate, SystemDescription

log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# STRIDE category → ATT&CK tactic mapping
# Used to broaden candidate retrieval beyond pure keyword matching.
# ---------------------------------------------------------------------------

_STRIDE_TO_TACTICS: dict[str, list[str]] = {
    "Spoofing":               ["credential-access", "initial-access"],
    "Tampering":              ["impact", "defense-evasion"],
    "Repudiation":            ["defense-evasion", "impact"],
    "Information Disclosure": ["collection", "exfiltration"],
    "Denial of Service":      ["impact"],
    "Elevation of Privilege": ["privilege-escalation", "lateral-movement"],
}

_STOP_WORDS: frozenset[str] = frozenset({
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "this", "that", "these",
    "those", "and", "or", "but", "not", "for", "as", "at", "by", "in",
    "of", "on", "to", "up", "via", "with", "from", "into", "through",
    "which", "when", "where", "who", "what", "how", "than", "then",
    "also", "such", "more", "most", "their", "they", "them", "its",
    "his", "her", "if", "any", "all", "both", "each", "some", "over",
    "other", "after", "before", "about", "against", "between", "out",
    "off", "its", "our", "your", "their", "use", "used", "using",
    "allow", "allows", "lead", "leads", "cause", "causes", "result",
})


def _extract_keywords(threats: list) -> list[str]:
    """Extract meaningful keywords from threat titles and descriptions."""
    words: set[str] = set()
    for t in threats:
        text = " ".join(filter(None, [
            getattr(t, "title", ""),
            getattr(t, "description", ""),
        ]))
        for token in re.split(r"[^a-zA-Z0-9]+", text.lower()):
            if len(token) >= 4 and token not in _STOP_WORDS:
                words.add(token)
    return list(words)[:20]  # cap to keep query params manageable


async def get_candidate_techniques(threats: list) -> list[dict[str, Any]]:
    """Query Neo4j for ATT&CK techniques relevant to the given threats.

    Two passes:
      1. Keyword pass — name or description contains a keyword from the threats.
      2. Tactic pass  — all techniques in tactics that match the STRIDE categories
                        of the threats (broadens coverage for less specific threats).

    Returns up to 50 deduplicated candidates, each as
    {id, name, tactic, description} with description truncated to 300 chars.
    """
    keywords = _extract_keywords(threats)

    tactics: set[str] = set()
    for t in threats:
        category = getattr(t, "category", None)
        if category and category in _STRIDE_TO_TACTICS:
            tactics.update(_STRIDE_TO_TACTICS[category])

    seen_ids: set[str] = set()
    results: list[dict[str, Any]] = []

    driver = get_driver()
    async with driver.session() as session:
        # Pass 1: keyword matching against name and description
        if keywords:
            kw_rows = await (await session.run(
                """
                MATCH (t:Technique)
                WHERE any(kw IN $keywords
                    WHERE toLower(t.name)        CONTAINS kw
                       OR toLower(t.description) CONTAINS kw)
                RETURN t.id AS id, t.name AS name, t.tactic AS tactic,
                       left(t.description, 300)  AS description
                ORDER BY t.id
                LIMIT 40
                """,
                keywords=keywords,
            )).data()
            for row in kw_rows:
                if row["id"] not in seen_ids:
                    seen_ids.add(row["id"])
                    results.append(dict(row))

        # Pass 2: tactic-based sweep for STRIDE-mapped tactics
        if tactics and len(results) < 50:
            tactic_rows = await (await session.run(
                """
                MATCH (t:Technique)
                WHERE t.tactic IN $tactics
                RETURN t.id AS id, t.name AS name, t.tactic AS tactic,
                       left(t.description, 300)  AS description
                ORDER BY t.id
                LIMIT 40
                """,
                tactics=list(tactics),
            )).data()
            for row in tactic_rows:
                if row["id"] not in seen_ids:
                    seen_ids.add(row["id"])
                    results.append(dict(row))
                    if len(results) >= 50:
                        break

    return results[:50]


async def get_candidate_controls() -> list[dict[str, Any]]:
    """Return all seeded CIS v8 Control nodes from Neo4j.

    Controls are a small, fixed set (18 nodes) — no filtering needed.
    """
    driver = get_driver()
    async with driver.session() as session:
        rows = await (await session.run(
            """
            MATCH (c:Control)
            RETURN c.id AS id, c.framework AS framework,
                   c.control_id AS control_id, c.name AS name,
                   c.description AS description, c.category AS category
            ORDER BY c.control_id
            """
        )).data()
    return [dict(r) for r in rows]


# ---------------------------------------------------------------------------
# SQLite helpers (sync — called via asyncio.to_thread)
# ---------------------------------------------------------------------------

def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _sqlite_save_agent_output(
    run_id: str,
    agent_name: str,
    output_json: str,
    duration_seconds: float,
    created_at: str,
) -> None:
    from app.db.sqlite_client import db_conn
    with db_conn() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO agent_outputs "
            "(run_id, agent_name, output_json, duration_seconds, created_at) "
            "VALUES (?, ?, ?, ?, ?)",
            (run_id, agent_name, output_json, duration_seconds, created_at),
        )


def _sqlite_update_run(
    run_id: str,
    status: str,
    error_message: str | None,
    completed_at: str | None,
) -> None:
    from app.db.sqlite_client import db_conn
    with db_conn() as conn:
        conn.execute(
            "UPDATE analysis_runs "
            "SET status = ?, error_message = ?, completed_at = ? "
            "WHERE run_id = ?",
            (status, error_message, completed_at, run_id),
        )


async def save_agent_output(
    run_id: str,
    agent_name: str,
    output_dict: dict[str, Any],
    duration_seconds: float,
) -> None:
    """Persist raw agent output JSON to SQLite (audit trail)."""
    await asyncio.to_thread(
        _sqlite_save_agent_output,
        run_id,
        agent_name,
        json.dumps(output_dict),
        duration_seconds,
        _now_iso(),
    )


async def update_analysis_run(
    run_id: str,
    status: str,
    error_message: str | None = None,
    completed_at: str | None = None,
) -> None:
    """Update analysis_runs row status (and optional completion fields)."""
    await asyncio.to_thread(_sqlite_update_run, run_id, status, error_message, completed_at)


# ---------------------------------------------------------------------------
# Neo4j read helper — called by analysis_service to build the agent input
# ---------------------------------------------------------------------------

async def load_system_description(system_id: str) -> "SystemDescription | None":
    """Load a SystemDescription from Neo4j for use as agent input.

    Returns None if no System with the given id exists.
    """
    from app.schemas.system import ComponentCreate, DataFlowCreate, SystemDescription

    driver = get_driver()
    async with driver.session() as session:
        comp_result = await session.run(
            "MATCH (s:System {id: $id})-[:HAS_COMPONENT]->(c:Component) "
            "RETURN s.name AS sys_name, s.description AS sys_desc, "
            "c.name AS name, c.type AS type, c.description AS description",
            id=system_id,
        )
        comp_rows = await comp_result.data()
        if not comp_rows:
            return None

        # Flows stored as FLOWS_TO relationships; return source/dest as component names
        flow_result = await session.run(
            "MATCH (s:System {id: $id})-[:HAS_COMPONENT]->(c1:Component)"
            "-[f:FLOWS_TO]->(c2:Component)<-[:HAS_COMPONENT]-(s) "
            "RETURN c1.name AS source, c2.name AS destination, "
            "f.data_type AS data_type, f.protocol AS protocol, "
            "f.is_encrypted AS is_encrypted",
            id=system_id,
        )
        flow_rows = await flow_result.data()

    first = comp_rows[0]
    return SystemDescription(
        name=first["sys_name"],
        description=first["sys_desc"] or "",
        components=[
            ComponentCreate(
                name=r["name"],
                type=r["type"],
                description=r.get("description") or "",
            )
            for r in comp_rows
        ],
        data_flows=[
            DataFlowCreate(
                source=r["source"],
                destination=r["destination"],
                data_type=r["data_type"],
                protocol=r["protocol"],
                is_encrypted=r["is_encrypted"],
            )
            for r in flow_rows
        ],
    )


# ---------------------------------------------------------------------------
# Neo4j write helpers — one per agent
# ---------------------------------------------------------------------------

async def persist_stride_findings(
    run_id: str, system_id: str, output: "StrideOutput"
) -> None:
    """Write STRIDE Threat nodes and :TARGETS relationships into Neo4j."""
    driver = get_driver()
    async with driver.session() as session:
        for i, threat in enumerate(output.threats):
            threat_id = f"thr_{run_id}_{i}"
            await session.run(
                "MERGE (t:Threat {id: $id}) "
                "SET t += {run_id: $run_id, title: $title, category: $category, "
                "description: $description, likelihood: $likelihood, "
                "impact: $impact, attack_vector: $attack_vector, source_agent: 'stride'}",
                id=threat_id,
                run_id=run_id,
                title=threat.title,
                category=threat.category,
                description=threat.description,
                likelihood=threat.likelihood,
                impact=threat.impact,
                attack_vector=threat.attack_vector,
            )
            # Silent no-op if component_name doesn't match any component in the system
            await session.run(
                "MATCH (t:Threat {id: $id}) "
                "MATCH (c:Component)<-[:HAS_COMPONENT]-(s:System {id: $system_id}) "
                "WHERE c.name = $component_name "
                "MERGE (t)-[:TARGETS]->(c)",
                id=threat_id,
                system_id=system_id,
                component_name=threat.component_name,
            )


async def persist_maestro_findings(
    run_id: str, system_id: str, output: "MaestroOutput"
) -> None:
    """Write MAESTRO Threat nodes into Neo4j; no-op if is_ai_system is False."""
    if not output.is_ai_system or not output.threats:
        return

    driver = get_driver()
    async with driver.session() as session:
        for i, threat in enumerate(output.threats):
            threat_id = f"thr_{run_id}_m{i}"  # 'm' prefix avoids collisions with STRIDE IDs
            await session.run(
                "MERGE (t:Threat {id: $id}) "
                "SET t += {run_id: $run_id, title: $title, category: $layer, "
                "description: $description, likelihood: $likelihood, "
                "impact: $impact, abuse_case: $abuse_case, source_agent: 'maestro'}",
                id=threat_id,
                run_id=run_id,
                title=threat.title,
                layer=threat.layer,
                description=threat.description,
                likelihood=threat.likelihood,
                impact=threat.impact,
                abuse_case=threat.abuse_case,
            )
            await session.run(
                "MATCH (t:Threat {id: $id}) "
                "MATCH (c:Component)<-[:HAS_COMPONENT]-(s:System {id: $system_id}) "
                "WHERE c.name = $component_name "
                "MERGE (t)-[:TARGETS]->(c)",
                id=threat_id,
                system_id=system_id,
                component_name=threat.component_name,
            )


async def persist_attack_mappings(run_id: str, output: "AttackOutput") -> None:
    """Link Threat nodes to Technique nodes via :MAPPED_TO."""
    if not output.mappings:
        return

    driver = get_driver()
    async with driver.session() as session:
        for mapping in output.mappings:
            for technique_id in mapping.technique_ids:
                await session.run(
                    "MATCH (thr:Threat {run_id: $run_id}) WHERE thr.title = $title "
                    "MATCH (tech:Technique {id: $technique_id}) "
                    "MERGE (thr)-[:MAPPED_TO]->(tech)",
                    run_id=run_id,
                    title=mapping.threat_title,
                    technique_id=technique_id,
                )


async def persist_attack_paths(
    run_id: str, system_id: str, output: "AttackTreeOutput"
) -> None:
    """Write AttackPath nodes and :HAS_STEP relationships into Neo4j."""
    driver = get_driver()
    async with driver.session() as session:
        for i, path in enumerate(output.paths):
            path_id = f"ap_{run_id}_{i}"
            await session.run(
                "MERGE (p:AttackPath {id: $id}) "
                "SET p += {run_id: $run_id, system_id: $system_id, "
                "name: $name, objective: $objective, severity: $severity}",
                id=path_id,
                run_id=run_id,
                system_id=system_id,
                name=path.name,
                objective=path.objective,
                severity=path.severity,
            )
            for step in path.steps:
                await session.run(
                    "MATCH (p:AttackPath {id: $path_id}) "
                    "MATCH (tech:Technique {id: $technique_id}) "
                    "MERGE (p)-[:HAS_STEP {sequence: $sequence, description: $description}]->(tech)",
                    path_id=path_id,
                    technique_id=step.technique_id,
                    sequence=step.sequence,
                    description=step.description,
                )


async def persist_controls(run_id: str, output: "ControlsOutput") -> None:
    """Link Control nodes to Threats they mitigate for this run via :MITIGATES."""
    if not output.recommendations:
        return

    driver = get_driver()
    async with driver.session() as session:
        for rec in output.recommendations:
            for threat_title in rec.addresses_threats:
                await session.run(
                    "MATCH (ctrl:Control {control_id: $control_id}) "
                    "MATCH (thr:Threat {run_id: $run_id}) WHERE thr.title = $title "
                    "MERGE (ctrl)-[:MITIGATES]->(thr)",
                    control_id=rec.control_id,
                    run_id=run_id,
                    title=threat_title,
                )
