from fastapi import APIRouter, HTTPException, status

from app.schemas.system import SystemCreate, SystemCreateResponse, SystemOut, SystemSummary
from app.services import system_service

router = APIRouter(prefix="/systems", tags=["systems"])


@router.post(
    "/",
    response_model=SystemCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new system for threat analysis",
)
async def create_system(body: SystemCreate) -> SystemCreateResponse:
    return await system_service.create_system(body)


@router.get(
    "/",
    response_model=list[SystemSummary],
    summary="List all registered systems",
)
async def list_systems() -> list[SystemSummary]:
    return await system_service.list_systems()


@router.get(
    "/{system_id}",
    response_model=SystemOut,
    summary="Get a system with its components and data flows",
)
async def get_system(system_id: str) -> SystemOut:
    result = await system_service.get_system(system_id)
    if result is None:
        raise HTTPException(status_code=404, detail=f"System '{system_id}' not found")
    return result


@router.delete(
    "/{system_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a system and all its analysis runs",
)
async def delete_system(system_id: str) -> None:
    found = await system_service.delete_system(system_id)
    if not found:
        raise HTTPException(status_code=404, detail=f"System '{system_id}' not found")
