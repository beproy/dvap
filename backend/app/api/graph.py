from fastapi import APIRouter, HTTPException

from app.schemas.findings import AttackPathDetail, AttackPathSummary
from app.schemas.graph import GraphResponse
from app.services import graph_service

# No router-level prefix — spans /systems/{id}/graph, /systems/{id}/attack-paths,
# and /attack-paths/{id}. All registered under the /api prefix in main.py.
router = APIRouter(tags=["graph"])


@router.get(
    "/systems/{system_id}/graph",
    response_model=GraphResponse,
    summary="Return the full graph for a system in React Flow format (nodes + edges)",
)
async def get_system_graph(system_id: str) -> GraphResponse:
    result = await graph_service.get_system_graph(system_id)
    if result is None:
        raise HTTPException(status_code=404, detail=f"System '{system_id}' not found")
    return result


@router.get(
    "/systems/{system_id}/attack-paths",
    response_model=list[AttackPathSummary],
    summary="List all attack paths identified for a system (populated in Phase 4)",
)
async def get_attack_paths(system_id: str) -> list[AttackPathSummary]:
    return await graph_service.get_attack_paths(system_id)


@router.get(
    "/attack-paths/{path_id}",
    response_model=AttackPathDetail,
    summary="Get one attack path with its full ordered technique chain",
)
async def get_attack_path(path_id: str) -> AttackPathDetail:
    result = await graph_service.get_attack_path(path_id)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Attack path '{path_id}' not found")
    return result
