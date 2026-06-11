"""
LangGraph node functions — one per specialist agent, plus finalize_node.

Each node:
  - Pulls what it needs from AnalysisState
  - Runs its agent
  - Persists output to SQLite (audit) and Neo4j (graph)
  - Returns a partial state dict that LangGraph merges back

On any exception the node records an error string and returns immediately;
the graph continues to finalize_node which marks the run failed.
"""

import logging
import time
from datetime import datetime, timezone

from app.agents.attack import AttackAgent, AttackAgentInput, AttackOutput, TechniqueCandidate, ThreatInput
from app.agents.attack_tree import AttackTreeAgent, AttackTreeAgentInput
from app.agents.controls import ControlCandidate, ControlsAgent, ControlsAgentInput
from app.agents.maestro import MaestroAgent
from app.agents.stride import StrideAgent
from app.llm import get_llm_provider
from app.orchestrator.persistence import (
    get_candidate_controls,
    get_candidate_techniques,
    persist_attack_mappings,
    persist_attack_paths,
    persist_controls,
    persist_maestro_findings,
    persist_stride_findings,
    save_agent_output,
    update_analysis_run,
)
from app.orchestrator.state import AnalysisState

log = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Internal helper
# ---------------------------------------------------------------------------

def _collect_threats(state: AnalysisState) -> list[ThreatInput]:
    """Flatten STRIDE + MAESTRO outputs into a unified ThreatInput list."""
    threats: list[ThreatInput] = []
    if state.get("stride"):
        for t in state["stride"].threats:
            threats.append(ThreatInput(
                title=t.title,
                description=t.description,
                category=t.category,
            ))
    if state.get("maestro") and state["maestro"].is_ai_system:
        for t in state["maestro"].threats:
            threats.append(ThreatInput(
                title=t.title,
                description=t.description,
                category=t.layer,
            ))
    return threats


# ---------------------------------------------------------------------------
# Nodes
# ---------------------------------------------------------------------------

async def stride_node(state: AnalysisState) -> dict:
    start = time.monotonic()
    try:
        agent = StrideAgent(get_llm_provider())
        result = await agent.run(state["system"])
        await save_agent_output(
            state["run_id"], "stride",
            result.output.model_dump(),
            result.duration_seconds,
        )
        await persist_stride_findings(state["run_id"], state["system_id"], result.output)
        return {
            "stride": result.output,
            "timings": {"stride": result.duration_seconds},
        }
    except Exception as exc:
        log.exception("STRIDE agent failed")
        return {
            "errors": [f"stride: {type(exc).__name__}: {exc}"],
            "timings": {"stride": time.monotonic() - start},
        }


async def maestro_node(state: AnalysisState) -> dict:
    start = time.monotonic()
    try:
        agent = MaestroAgent(get_llm_provider())
        result = await agent.run(state["system"])
        await save_agent_output(
            state["run_id"], "maestro",
            result.output.model_dump(),
            result.duration_seconds,
        )
        await persist_maestro_findings(state["run_id"], state["system_id"], result.output)
        return {
            "maestro": result.output,
            "timings": {"maestro": result.duration_seconds},
        }
    except Exception as exc:
        log.exception("MAESTRO agent failed")
        return {
            "errors": [f"maestro: {type(exc).__name__}: {exc}"],
            "timings": {"maestro": time.monotonic() - start},
        }


async def attack_node(state: AnalysisState) -> dict:
    start = time.monotonic()
    try:
        all_threats = _collect_threats(state)
        if not all_threats:
            log.warning("[attack] no threats to map — skipping agent")
            empty = AttackOutput(mappings=[], unmapped_threats=[])
            await save_agent_output(state["run_id"], "attack", empty.model_dump(), 0.0)
            return {"attack": empty, "timings": {"attack": 0.0}}

        candidates_raw = await get_candidate_techniques(all_threats)
        candidates = [TechniqueCandidate(**c) for c in candidates_raw]

        agent = AttackAgent(get_llm_provider())
        result = await agent.run(AttackAgentInput(
            threats=all_threats,
            candidate_techniques=candidates,
        ))
        await save_agent_output(
            state["run_id"], "attack",
            result.output.model_dump(),
            result.duration_seconds,
        )
        await persist_attack_mappings(state["run_id"], result.output)
        return {
            "attack": result.output,
            "timings": {"attack": result.duration_seconds},
        }
    except Exception as exc:
        log.exception("ATT&CK agent failed")
        return {
            "errors": [f"attack: {type(exc).__name__}: {exc}"],
            "timings": {"attack": time.monotonic() - start},
        }


async def attack_tree_node(state: AnalysisState) -> dict:
    start = time.monotonic()
    try:
        attack_out = state.get("attack")
        if not attack_out or not attack_out.mappings:
            log.warning("[attack_tree] no ATT&CK mappings — skipping agent")
            return {"timings": {"attack_tree": 0.0}}

        all_threats = _collect_threats(state)
        agent = AttackTreeAgent(get_llm_provider())
        result = await agent.run(AttackTreeAgentInput(
            system_name=state["system"].name,
            system_description=state["system"].description,
            threats=all_threats,
            technique_mappings=attack_out.mappings,
        ))
        await save_agent_output(
            state["run_id"], "attack_tree",
            result.output.model_dump(),
            result.duration_seconds,
        )
        await persist_attack_paths(state["run_id"], state["system_id"], result.output)
        return {
            "attack_tree": result.output,
            "timings": {"attack_tree": result.duration_seconds},
        }
    except Exception as exc:
        log.exception("Attack Tree agent failed")
        return {
            "errors": [f"attack_tree: {type(exc).__name__}: {exc}"],
            "timings": {"attack_tree": time.monotonic() - start},
        }


async def controls_node(state: AnalysisState) -> dict:
    start = time.monotonic()
    try:
        all_threats = _collect_threats(state)
        if not all_threats:
            log.warning("[controls] no threats — skipping agent")
            return {"timings": {"controls": 0.0}}

        candidates_raw = await get_candidate_controls()
        candidates = [ControlCandidate(**c) for c in candidates_raw]

        attack_out = state.get("attack")
        tree_out = state.get("attack_tree")

        agent = ControlsAgent(get_llm_provider())
        result = await agent.run(ControlsAgentInput(
            threats=all_threats,
            technique_mappings=attack_out.mappings if attack_out else [],
            attack_paths=tree_out.paths if tree_out else [],
            candidate_controls=candidates,
        ))
        await save_agent_output(
            state["run_id"], "controls",
            result.output.model_dump(),
            result.duration_seconds,
        )
        await persist_controls(state["run_id"], result.output)
        return {
            "controls": result.output,
            "timings": {"controls": result.duration_seconds},
        }
    except Exception as exc:
        log.exception("Controls agent failed")
        return {
            "errors": [f"controls: {type(exc).__name__}: {exc}"],
            "timings": {"controls": time.monotonic() - start},
        }


async def finalize_node(state: AnalysisState) -> dict:
    """Mark the analysis run completed (or failed) in SQLite and log total timings."""
    completed_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    errors = state.get("errors") or []

    if errors:
        status = "failed"
        error_summary = "; ".join(errors[:5])  # cap to avoid very long DB values
    else:
        status = "completed"
        error_summary = None

    await update_analysis_run(
        state["run_id"],
        status=status,
        error_message=error_summary,
        completed_at=completed_at,
    )

    total = sum((state.get("timings") or {}).values())
    log.info(
        "[finalize] run=%s status=%s total_agent_time=%.1fs errors=%d",
        state["run_id"], status, total, len(errors),
    )
    return {"timings": {}}
