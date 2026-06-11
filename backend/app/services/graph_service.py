from app.db.neo4j_client import get_driver
from app.schemas.findings import (
    AttackPathDetail,
    AttackPathStep,
    AttackPathSummary,
    TechniqueOut,
)
from app.schemas.graph import GraphEdge, GraphNode, GraphResponse


async def get_system_graph(system_id: str) -> GraphResponse | None:
    """Return nodes and edges shaped for React Flow direct consumption."""
    async with get_driver().session() as session:
        # Confirm system exists
        exists_result = await session.run(
            "MATCH (s:System {id: $id}) RETURN s.id AS id", id=system_id
        )
        if not await exists_result.single():
            return None

        # Component nodes
        comp_result = await session.run(
            "MATCH (s:System {id: $id})-[:HAS_COMPONENT]->(c:Component) RETURN c",
            id=system_id,
        )
        comp_records = await comp_result.data()

        # Flow edges (properties live on the FLOWS_TO relationship)
        flow_result = await session.run(
            "MATCH (s:System {id: $id})-[:HAS_COMPONENT]->(c1:Component)"
            "-[f:FLOWS_TO]->(c2:Component)<-[:HAS_COMPONENT]-(s) "
            "RETURN c1.id AS source, c2.id AS target, f.protocol AS protocol",
            id=system_id,
        )
        flow_records = await flow_result.data()

        # Threat nodes linked to this system's components (empty until Phase 4)
        threat_result = await session.run(
            "MATCH (s:System {id: $id})-[:HAS_COMPONENT]->(c:Component)"
            "<-[:TARGETS]-(t:Threat) RETURN DISTINCT t",
            id=system_id,
        )
        threat_records = await threat_result.data()

        # Threat→Component targeting edges
        threat_edge_result = await session.run(
            "MATCH (s:System {id: $id})-[:HAS_COMPONENT]->(c:Component)"
            "<-[:TARGETS]-(t:Threat) RETURN t.id AS source, c.id AS target",
            id=system_id,
        )
        threat_edge_records = await threat_edge_result.data()

    nodes: list[GraphNode] = []
    edges: list[GraphEdge] = []
    edge_counter = 0

    for r in comp_records:
        c = r["c"]
        nodes.append(
            GraphNode(
                id=c["id"],
                type="component",
                label=c["name"],
                data={"component_type": c["type"]},
            )
        )

    for r in threat_records:
        t = r["t"]
        nodes.append(
            GraphNode(
                id=t["id"],
                type="threat",
                label=(t.get("description") or "")[:60],
                data={
                    "category": t.get("category", ""),
                    "likelihood": t.get("likelihood", ""),
                    "impact": t.get("impact", ""),
                },
            )
        )

    for r in flow_records:
        edges.append(
            GraphEdge(
                id=f"e{edge_counter}",
                source=r["source"],
                target=r["target"],
                type="flow",
                data={"protocol": r["protocol"]},
            )
        )
        edge_counter += 1

    for r in threat_edge_records:
        edges.append(
            GraphEdge(
                id=f"e{edge_counter}",
                source=r["source"],
                target=r["target"],
                type="targets",
                data={},
            )
        )
        edge_counter += 1

    return GraphResponse(system_id=system_id, nodes=nodes, edges=edges)


async def get_attack_paths(system_id: str) -> list[AttackPathSummary]:
    """Return attack path summaries linked to this system. Empty until Phase 4."""
    async with get_driver().session() as session:
        result = await session.run(
            # Paths reachable from techniques implemented by threats found in this system
            "MATCH (s:System {id: $id})-[:ANALYZED_BY]->(:AnalysisRun)"
            "-[:PRODUCED]->(:Threat)-[:IMPLEMENTS]->(tech:Technique) "
            "MATCH (ap:AttackPath)-[:STARTS_WITH|THEN]->(tech) "
            "WITH DISTINCT ap "
            "OPTIONAL MATCH (ap)-[:STARTS_WITH|THEN]->(:Technique) "
            "RETURN ap, count(*) AS step_count",
            id=system_id,
        )
        records = await result.data()

    return [
        AttackPathSummary(
            path_id=r["ap"]["id"],
            name=r["ap"]["name"],
            description=r["ap"].get("description", ""),
            severity=r["ap"].get("severity", "Unknown"),
            step_count=r["step_count"],
        )
        for r in records
    ]


async def get_attack_path(path_id: str) -> AttackPathDetail | None:
    """Return one attack path with its full ordered technique chain."""
    async with get_driver().session() as session:
        path_result = await session.run(
            "MATCH (ap:AttackPath {id: $id}) RETURN ap", id=path_id
        )
        path_record = await path_result.single()
        if not path_record:
            return None

        ap = path_record["ap"]

        steps_result = await session.run(
            "MATCH (ap:AttackPath {id: $id})-[r:STARTS_WITH|THEN]->(t:Technique) "
            "RETURN t, coalesce(r.sequence, 0) AS sequence "
            "ORDER BY sequence ASC",
            id=path_id,
        )
        steps_records = await steps_result.data()

    steps = [
        AttackPathStep(
            sequence=r["sequence"],
            technique=TechniqueOut(
                technique_id=r["t"]["id"],
                name=r["t"]["name"],
                tactic=r["t"].get("tactic", ""),
                description=r["t"].get("description", ""),
                url=r["t"].get("url", ""),
            ),
        )
        for r in steps_records
    ]

    return AttackPathDetail(
        path_id=ap["id"],
        name=ap["name"],
        description=ap.get("description", ""),
        severity=ap.get("severity", "Unknown"),
        steps=steps,
    )
