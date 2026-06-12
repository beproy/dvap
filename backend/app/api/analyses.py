from typing import Optional

from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.analysis import (
    AnalysisFindings,
    AnalysisRequest,
    AnalysisRunOut,
    AnalysisRunSummary,
    AnalysisStartResponse,
)
from app.services import analysis_service

# No router-level prefix — this file spans /systems/{id}/analyze and /analyses/...
# Both are registered under the /api prefix in main.py.
router = APIRouter(tags=["analyses"])


@router.post(
    "/systems/{system_id}/analyze",
    response_model=AnalysisStartResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Start a full multi-agent analysis run for a system",
)
async def start_analysis(system_id: str, body: AnalysisRequest) -> AnalysisStartResponse:
    result = await analysis_service.start_analysis(system_id, body)
    if result is None:
        raise HTTPException(status_code=404, detail=f"System '{system_id}' not found")
    return result


@router.get(
    "/analyses",
    response_model=list[AnalysisRunSummary],
    summary="List recent analysis runs (most recent first, up to 100)",
)
async def list_runs(
    system_id: Optional[str] = Query(None, description="Filter runs by system ID"),
) -> list[AnalysisRunSummary]:
    return await analysis_service.list_runs(system_id)


@router.get(
    "/analyses/{run_id}",
    response_model=AnalysisRunOut,
    summary="Get the status and metadata for an analysis run",
)
async def get_run(run_id: str) -> AnalysisRunOut:
    result = await analysis_service.get_run(run_id)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Analysis run '{run_id}' not found")
    return result


@router.get(
    "/analyses/{run_id}/findings",
    response_model=AnalysisFindings,
    summary="Get full agent findings for a completed analysis run",
)
async def get_findings(run_id: str) -> AnalysisFindings:
    result = await analysis_service.get_findings(run_id)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Analysis run '{run_id}' not found")
    return result
