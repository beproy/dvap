import asyncio
import json
import logging
import secrets
from datetime import datetime, timezone

from app.agents.attack import AttackOutput
from app.agents.attack_tree import AttackTreeOutput
from app.agents.controls import ControlsOutput
from app.agents.maestro import MaestroOutput
from app.agents.stride import StrideOutput
from app.config import settings
from app.db.sqlite_client import db_conn
from app.orchestrator.graph import get_orchestrator
from app.orchestrator.persistence import load_system_description, update_analysis_run
from app.orchestrator.state import AnalysisState
from app.schemas.analysis import (
    AnalysisFindings,
    AnalysisRequest,
    AnalysisRunOut,
    AnalysisRunSummary,
    AnalysisStartResponse,
)

log = logging.getLogger(__name__)

# Module-level task set prevents GC from collecting background orchestrator tasks
# before they complete (asyncio.create_task alone doesn't keep tasks alive).
_active_tasks: set[asyncio.Task] = set()


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# ── SQLite helpers (sync, called via asyncio.to_thread) ──────────────────────

def _sqlite_insert_run(
    run_id: str, system_id: str, system_name: str, now: str
) -> None:
    with db_conn() as conn:
        conn.execute(
            "INSERT INTO analysis_runs "
            "(run_id, system_id, system_name, status, llm_backend, llm_model, started_at) "
            "VALUES (?, ?, ?, 'pending', ?, ?, ?)",
            (run_id, system_id, system_name, settings.llm_backend, "gemini-2.5-flash", now),
        )


def _sqlite_get_run(run_id: str) -> dict | None:
    with db_conn() as conn:
        row = conn.execute(
            "SELECT * FROM analysis_runs WHERE run_id = ?", (run_id,)
        ).fetchone()
        return dict(row) if row else None


def _sqlite_list_runs() -> list[dict]:
    with db_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM analysis_runs ORDER BY started_at DESC LIMIT 100"
        ).fetchall()
        return [dict(r) for r in rows]


def _sqlite_list_runs_by_system(system_id: str) -> list[dict]:
    with db_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM analysis_runs WHERE system_id = ? ORDER BY started_at DESC LIMIT 100",
            (system_id,),
        ).fetchall()
        return [dict(r) for r in rows]


def _sqlite_get_agent_outputs(run_id: str) -> list[dict]:
    with db_conn() as conn:
        rows = conn.execute(
            "SELECT agent_name, output_json, duration_seconds FROM agent_outputs WHERE run_id = ?",
            (run_id,),
        ).fetchall()
        return [dict(r) for r in rows]


# ── Background orchestrator task ─────────────────────────────────────────────

async def _run_orchestrator(run_id: str, initial_state: AnalysisState) -> None:
    """Invoke the compiled LangGraph graph; update run status on crash."""
    try:
        await update_analysis_run(run_id, status="running")
        orchestrator = get_orchestrator()
        await orchestrator.ainvoke(initial_state)
        # finalize_node has already written completed/failed status to SQLite
    except Exception as exc:
        log.exception("Orchestrator crashed for run %s", run_id)
        error_detail = f"{type(exc).__name__}: {exc}"[:500]
        await update_analysis_run(
            run_id,
            status="failed",
            error_message=error_detail,
            completed_at=_now_iso(),
        )


# ── Public service functions ──────────────────────────────────────────────────

async def start_analysis(
    system_id: str, request: AnalysisRequest
) -> AnalysisStartResponse | None:
    """Load the system, create a run record, and fire the orchestrator in the background.

    Returns None if system_id does not exist in Neo4j.
    """
    system = await load_system_description(system_id)
    if system is None:
        return None

    run_id = f"run_{secrets.token_hex(4)}"
    now = _now_iso()

    await asyncio.to_thread(_sqlite_insert_run, run_id, system_id, system.name, now)

    initial_state: AnalysisState = {
        "run_id": run_id,
        "system_id": system_id,
        "system": system,
        "stride": None,
        "maestro": None,
        "attack": None,
        "attack_tree": None,
        "controls": None,
        "errors": [],
        "timings": {},
    }

    # Keep a strong reference to prevent GC from silently collecting the task
    task = asyncio.create_task(_run_orchestrator(run_id, initial_state))
    _active_tasks.add(task)
    task.add_done_callback(_active_tasks.discard)

    return AnalysisStartResponse(
        run_id=run_id,
        system_id=system_id,
        status="pending",
        started_at=now,
        estimated_seconds=60,
    )


async def get_run(run_id: str) -> AnalysisRunOut | None:
    row = await asyncio.to_thread(_sqlite_get_run, run_id)
    if not row:
        return None
    return AnalysisRunOut(
        run_id=row["run_id"],
        system_id=row["system_id"],
        system_name=row["system_name"],
        status=row["status"],
        llm_backend=row["llm_backend"],
        llm_model=row["llm_model"],
        started_at=row["started_at"],
        completed_at=row.get("completed_at"),
        error_message=row.get("error_message"),
    )


async def list_runs(system_id: str | None = None) -> list[AnalysisRunSummary]:
    if system_id:
        rows = await asyncio.to_thread(_sqlite_list_runs_by_system, system_id)
    else:
        rows = await asyncio.to_thread(_sqlite_list_runs)
    return [
        AnalysisRunSummary(
            run_id=r["run_id"],
            system_id=r["system_id"],
            system_name=r["system_name"],
            status=r["status"],
            llm_model=r["llm_model"],
            started_at=r["started_at"],
            completed_at=r.get("completed_at"),
        )
        for r in rows
    ]


async def get_findings(run_id: str) -> AnalysisFindings | None:
    """Reassemble full agent findings from the SQLite audit trail.

    SQLite is the source of truth for run outputs; Neo4j is the queryable graph.
    """
    run_row = await asyncio.to_thread(_sqlite_get_run, run_id)
    if not run_row:
        return None

    agent_rows = await asyncio.to_thread(_sqlite_get_agent_outputs, run_id)
    outputs: dict[str, dict] = {r["agent_name"]: json.loads(r["output_json"]) for r in agent_rows}
    timings: dict[str, float] = {r["agent_name"]: r["duration_seconds"] for r in agent_rows}

    # Reconstruct typed outputs and build unified findings lists
    threats: list = []
    if "stride" in outputs:
        stride_out = StrideOutput.model_validate(outputs["stride"])
        threats.extend(stride_out.threats)
    if "maestro" in outputs:
        maestro_out = MaestroOutput.model_validate(outputs["maestro"])
        if maestro_out.is_ai_system:
            threats.extend(maestro_out.threats)

    mappings = []
    if "attack" in outputs:
        attack_out = AttackOutput.model_validate(outputs["attack"])
        mappings = attack_out.mappings

    paths = []
    if "attack_tree" in outputs:
        tree_out = AttackTreeOutput.model_validate(outputs["attack_tree"])
        paths = tree_out.paths

    recommendations = []
    if "controls" in outputs:
        controls_out = ControlsOutput.model_validate(outputs["controls"])
        recommendations = controls_out.recommendations

    error_msg = run_row.get("error_message") or ""
    errors = [e.strip() for e in error_msg.split(";") if e.strip()] if error_msg else []

    return AnalysisFindings(
        run_id=run_id,
        system_id=run_row["system_id"],
        status=run_row["status"],
        threats=threats,
        technique_mappings=mappings,
        attack_paths=paths,
        control_recommendations=recommendations,
        timings=timings,
        errors=errors,
    )
