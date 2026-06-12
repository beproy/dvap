from typing import Any, Literal

from pydantic import BaseModel, Field, ConfigDict


# ── Input models ──────────────────────────────────────────────────────────────

class AnalysisOptions(BaseModel):
    """Behavioural options forwarded to agents at run time."""

    include_low_severity: bool = Field(True, description="Include low-severity threats in output")

    model_config = ConfigDict(
        json_schema_extra={"example": {"include_low_severity": True}}
    )


class AnalysisRequest(BaseModel):
    """Request body for POST /api/systems/{system_id}/analyze."""

    agents: list[str] = Field(
        ...,
        description="Agents to invoke. Valid values: stride, maestro, attack, attack_tree, controls",
        min_length=1,
    )
    options: AnalysisOptions = Field(default_factory=AnalysisOptions)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "agents": ["stride", "maestro", "attack", "attack_tree", "controls"],
                "options": {"include_low_severity": True},
            }
        }
    )


# ── Output models ─────────────────────────────────────────────────────────────

AnalysisStatus = Literal["pending", "running", "completed", "failed"]


class AnalysisStartResponse(BaseModel):
    """202 Accepted response for POST /api/systems/{system_id}/analyze."""

    run_id: str = Field(..., description="Unique identifier for this analysis run")
    system_id: str
    status: AnalysisStatus
    started_at: str = Field(..., description="ISO 8601 timestamp when the run was queued")
    estimated_seconds: int = Field(..., description="Rough estimate of how long the run will take")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "run_id": "run_9d4e1f2a",
                "system_id": "sys_8f3a2b1c",
                "status": "pending",
                "started_at": "2026-06-10T14:25:03Z",
                "estimated_seconds": 15,
            }
        }
    )


class AnalysisRunOut(BaseModel):
    """Full analysis run record returned by GET /api/analyses/{run_id}."""

    run_id: str
    system_id: str
    system_name: str
    status: AnalysisStatus
    llm_backend: str
    llm_model: str
    started_at: str
    completed_at: str | None = None
    error_message: str | None = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "run_id": "run_9d4e1f2a",
                "system_id": "sys_8f3a2b1c",
                "system_name": "Customer Portal",
                "status": "completed",
                "llm_backend": "gemini",
                "llm_model": "gemini-2.5-flash",
                "started_at": "2026-06-10T14:25:03Z",
                "completed_at": "2026-06-10T14:25:20Z",
                "error_message": None,
            }
        }
    )


class AnalysisRunSummary(BaseModel):
    """Lightweight run record for GET /api/analyses list responses."""

    run_id: str
    system_id: str
    system_name: str
    status: AnalysisStatus
    llm_model: str
    started_at: str
    completed_at: str | None = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "run_id": "run_9d4e1f2a",
                "system_id": "sys_8f3a2b1c",
                "system_name": "Customer Portal",
                "status": "completed",
                "llm_model": "gemini-2.5-flash",
                "started_at": "2026-06-10T14:25:03Z",
                "completed_at": "2026-06-10T14:25:20Z",
            }
        }
    )


class AnalysisFindings(BaseModel):
    """Full findings for a completed analysis run, assembled from SQLite agent outputs.

    Returned by GET /api/analyses/{run_id}/findings.
    """

    run_id: str
    system_id: str
    status: AnalysisStatus
    # Typed as list[Any] to accommodate StrideThreat | MaestroThreat union without
    # requiring a discriminator field — FastAPI serialises the actual Pydantic objects.
    threats: list[Any] = Field(default_factory=list)
    technique_mappings: list[Any] = Field(default_factory=list)
    attack_paths: list[Any] = Field(default_factory=list)
    control_recommendations: list[Any] = Field(default_factory=list)
    timings: dict[str, float] = Field(default_factory=dict)
    errors: list[str] = Field(default_factory=list)
