from fastapi import APIRouter, HTTPException, Query

from app.db.neo4j_client import get_driver
from app.schemas.findings import ControlOut, TechniqueDetail, TechniqueListResponse, TechniqueOut, ThreatOut

router = APIRouter(tags=["reference"])


@router.get(
    "/techniques",
    response_model=TechniqueListResponse,
    summary="List ATT&CK techniques, paginated and optionally filtered by tactic",
)
async def list_techniques(
    tactic: str | None = Query(None, description="Filter by ATT&CK tactic (e.g. initial-access)"),
    limit: int = Query(50, ge=1, le=200, description="Page size"),
    offset: int = Query(0, ge=0, description="Page offset"),
) -> TechniqueListResponse:
    async with get_driver().session() as session:
        count_result = await session.run(
            "MATCH (t:Technique) "
            "WHERE ($tactic IS NULL OR t.tactic = $tactic) "
            "RETURN count(t) AS total",
            tactic=tactic,
        )
        count_record = await count_result.single()
        total = count_record["total"] if count_record else 0

        items_result = await session.run(
            "MATCH (t:Technique) "
            "WHERE ($tactic IS NULL OR t.tactic = $tactic) "
            "RETURN t.id AS technique_id, t.name AS name, t.tactic AS tactic, "
            "t.description AS description, t.url AS url "
            "ORDER BY t.id "
            "SKIP $offset LIMIT $limit",
            tactic=tactic,
            offset=offset,
            limit=limit,
        )
        rows = await items_result.data()

    items = [
        TechniqueOut(
            technique_id=r["technique_id"],
            name=r["name"] or "",
            tactic=r["tactic"] or "",
            description=r["description"] or "",
            url=r["url"] or "",
        )
        for r in rows
    ]
    return TechniqueListResponse(total=total, limit=limit, offset=offset, items=items)


@router.get(
    "/techniques/{technique_id}",
    response_model=TechniqueDetail,
    summary="Get one ATT&CK technique with related threats and mitigating controls",
)
async def get_technique(technique_id: str) -> TechniqueDetail:
    async with get_driver().session() as session:
        result = await session.run(
            "MATCH (t:Technique {id: $id}) "
            "OPTIONAL MATCH (thr:Threat)-[:IMPLEMENTS]->(t) "
            "OPTIONAL MATCH (c:Control)-[:MITIGATES]->(t) "
            "RETURN t, collect(DISTINCT thr) AS threats, collect(DISTINCT c) AS controls",
            id=technique_id,
        )
        record = await result.single()

    if not record or record["t"] is None:
        raise HTTPException(status_code=404, detail=f"Technique '{technique_id}' not found")

    t = record["t"]
    threats = [
        ThreatOut(
            threat_id=thr["id"],
            category=thr.get("category", ""),
            description=thr.get("description", ""),
            likelihood=thr.get("likelihood", ""),
            impact=thr.get("impact", ""),
            source_agent=thr.get("source_agent", ""),
        )
        for thr in record["threats"]
        if thr is not None
    ]
    controls = [
        ControlOut(
            id=c["id"],
            framework=c.get("framework", ""),
            control_id=c.get("control_id", ""),
            name=c.get("name", ""),
            description=c.get("description", ""),
        )
        for c in record["controls"]
        if c is not None
    ]

    return TechniqueDetail(
        technique_id=t["id"],
        name=t.get("name", ""),
        tactic=t.get("tactic", ""),
        description=t.get("description", ""),
        url=t.get("url", ""),
        related_threats=threats,
        controls=controls,
    )


@router.get(
    "/controls",
    response_model=list[ControlOut],
    summary="List security controls, optionally filtered by framework (e.g. CIS, NIST)",
)
async def list_controls(
    framework: str | None = Query(None, description="Filter by framework name (e.g. CIS, NIST)"),
) -> list[ControlOut]:
    async with get_driver().session() as session:
        result = await session.run(
            "MATCH (c:Control) "
            "WHERE ($framework IS NULL OR c.framework = $framework) "
            "RETURN c.id AS id, c.framework AS framework, c.control_id AS control_id, "
            "c.name AS name, c.description AS description "
            "ORDER BY c.framework, c.control_id",
            framework=framework,
        )
        rows = await result.data()

    return [
        ControlOut(
            id=r["id"],
            framework=r["framework"] or "",
            control_id=r["control_id"] or "",
            name=r["name"] or "",
            description=r["description"] or "",
        )
        for r in rows
    ]
